import { Ip } from '../../models/ip.modell';
import { Dimension, NominalDimension, NumericDimension, OrdinalDimension } from '../../models/dimension.model';
import { DataRecord } from '../../models/datarecord.model';
import { DataType } from '../../enums/dataType.enum';
import { Value } from '../../models/filter.model';
import { CellTypes } from '../../enums/cellTypes.enum';
import { RangeFilter } from '../../models/rangeFilter.model';
import { DataServiceHelper } from '../../helpers/dataService.helper';
import { FilterOutOfRangeError } from '../../errors/FilterOutOfRangeError';
import { CommonHelper } from '../../helpers/common.helper';

export class ParallelCoordsUtils {
	/**
	 * Unpack a specific attribute from the table.
	 * @param rows Array of objects, each object is a row from the file
	 * @param columName The column to extract
	 * @returns Array of objects, key is column name, value is cell value
	 */
	public static unpack = (rows: Array<DataRecord>, columName: string): Array<Value> => {
		return rows.map(function (row) {
			return row[columName];
		});
	};

	/**
	 * Converts a row from the raw data to a Dimension object, which is displayable by Plotly parallel coordinates.
	 * @param rows Array of objects, each object is a row from the file
	 * @param dimension Dimension info from the meta data.
	 * @param type Type of cell
	 * @param filters Filter (optional) - will set the filtered range of the dimension data.
	 */
	public static convertDimension = (
		rows: Array<DataRecord>,
		dimension: { key: string; label: string; type: string },
		type: CellTypes,
		filters: (Value | RangeFilter<Value>)[] = null,
	): Dimension => {
		switch (dimension.type) {
			case DataType.IP:
				return ParallelCoordsUtils.convertToIp(rows, dimension.key, dimension.label, type, filters);
			case DataType.ORDINAL:
				return ParallelCoordsUtils.convertToOrdinal(rows, dimension.key, dimension.label, type, filters);
			case DataType.NUMERIC:
				return ParallelCoordsUtils.convertToNumeric(rows, dimension.key, dimension.label, type, filters);
			case DataType.NOMINAL:
			default:
				const rawData: Array<string> = ParallelCoordsUtils.unpack(rows, dimension.key) as Array<string>;
				return ParallelCoordsUtils.convertToNominal(rawData, dimension.label, type, filters);
		}
	};

	/**
	 * Will create a so called "wildcard dimension", so a dimension which is not displayed but asterisked in the plot.
	 * @param rows Array of objects, each object is a row from the file
	 * @param dimension Dimension info from the meta data.
	 * @param type Type of cell
	 */
	public static convertToWildcard = (
		rows: Array<DataRecord>,
		dimension: { key: string; label: string; type: string },
		type: CellTypes,
	): NominalDimension => {
		const recordCnt = rows.length;
		const idxData = Array(recordCnt).fill(0);
		return {
			type: type,
			constraintrange: [],
			range: [0, 0],
			label: dimension.label,
			ticktext: ['*'],
			tickvals: [0],
			values: idxData,
			visible: true,
			map: {},
		};
	};

	/**
	 * Will create a nominal dimension to display the data with Plotly parallel coordinates.
	 * @param rawData An array of values (string, number, Ip).
	 * @param label The axis label.
	 * @param type The cell type of the column.
	 * @param filters Filter (optional) - will set the filtered range of the dimension data.
	 * @param replacements optional, for handling default values like ? and Infinity
	 */
	private static convertToNominal = (
		rawData: Array<Value>,
		label: string,
		type: CellTypes,
		filters: (Value | RangeFilter<Value>)[] = null,
		replacements: Record<number, string> = {},
	): NominalDimension => {
		const unique: Array<Value> = rawData.filter((v, i, a) => DataServiceHelper.indexOf(a, v) === i);
		const sorted: Array<string> = unique.sort((a, b) => (a > b ? 1 : -1)).map((v) => v.toString());
		const indices = Array.from(Array(unique.length).keys());

		let i = 0;
		const valueMapping: Record<string, number> = {};
		sorted.forEach((v) => {
			valueMapping[v] = indices[i++];
		});

		const converted = rawData.map((a) => valueMapping[a.toString()]);

		Object.keys(replacements).forEach((idx) => {
			sorted[idx] = replacements[idx];
		});

		const dimension: NominalDimension = {
			type: type,
			range: [Math.min(...indices), Math.max(...indices)],
			label: label,
			values: converted,
			tickvals: indices,
			ticktext: sorted as Array<string>,
			constraintrange: [],
			visible: true,
			map: valueMapping,
		};

		dimension.constraintrange = ParallelCoordsUtils.getConstraintRange(DataType.NOMINAL, dimension, filters);

		return dimension;
	};

	/**
	 * Will create a nominal dimension to display the data with Plotly parallel coordinates.
	 * @param rows Array of objects, each object is a row from the file
	 * @param key Column name to extract.
	 * @param label The axis label.
	 * @param type The cell type of the column.
	 * @param filters Filter (optional) - will set the filtered range of the dimension data.
	 */
	private static convertToIp = (
		rows: Array<DataRecord>,
		key: string,
		label: string,
		type: CellTypes,
		filters: (Value | RangeFilter<Value>)[] = null,
	): NominalDimension => {
		const rawData: Array<Ip> = ParallelCoordsUtils.unpack(rows, key) as Array<Ip>;
		return ParallelCoordsUtils.convertToNominal(rawData, label, type, filters);
	};

	/**
	 * Will create an ordinal dimension. E.g. for port numbers.
	 * @param rows An array of values (string, number, Ip).
	 * @param key Column name to extract.
	 * @param label The axis label.
	 * @param type The cell type of the column.
	 * @param filters Filter (optional) - will set the filtered range of the dimension data.
	 */
	private static convertToOrdinal = (
		rows: Array<DataRecord>,
		key: string,
		label: string,
		type: CellTypes,
		filters: (Value | RangeFilter<Value>)[] = null,
	): OrdinalDimension => {
		const rawData: Array<number> = ParallelCoordsUtils.unpack(rows, key) as Array<number>;

		const minimum = Math.min(...rawData) - 1;
		const converted: Array<number> = rawData.map((d) =>
			d === Number.POSITIVE_INFINITY ? (rawData[rawData.indexOf(d)] = minimum) : d,
		);

		return ParallelCoordsUtils.convertToNominal(converted, label, type, filters, { 0: '?' });
	};

	/**
	 * Converts a numeric row to a Plotly-specific dimension structure.
	 * @param rows Raw data from data service.
	 * @param key Name of column to extract.
	 * @param label Axis label.
	 * @param type Cell type.
	 * @param filters Filter (optional) - will set the filtered range of the dimension data.
	 */
	private static convertToNumeric = (
		rows: Array<DataRecord>,
		key: string,
		label: string,
		type: CellTypes,
		filters: (Value | RangeFilter<Value>)[] = null,
	): NumericDimension => {
		const rawData: Array<number> = ParallelCoordsUtils.unpack(rows, key) as Array<number>;
		const minimum = Math.min(...rawData) - 1;
		const converted: Array<number> = rawData.map((d) =>
			d === Number.POSITIVE_INFINITY ? (rawData[rawData.indexOf(d)] = minimum) : d,
		);
		const dimension: NumericDimension = {
			type: type,
			range: [Math.min(...converted), Math.max(...converted)],
			label: label,
			values: converted,
			constraintrange: [],
			visible: true,
		};

		dimension.constraintrange = ParallelCoordsUtils.getConstraintRange(DataType.NUMERIC, dimension, filters);

		return dimension;
	};

	/**
	 * Get constraint ranges to display filters for axis.
	 * @param dataType Data type (numeric, nominal, ...)
	 * @param dimension The dimension itself.
	 * @param filters The filters to be applied.
	 * @returns Array with min/max indices of the range values, Plotly-specific.
	 */
	public static getConstraintRange = (
		dataType: string,
		dimension: Dimension,
		filters: (Value | RangeFilter<Value>)[],
	): Array<number> => {
		if (!filters) return [];

		switch (dataType) {
			case DataType.NUMERIC:
				return ParallelCoordsUtils.extractNumericConstraintRange(filters);
			case DataType.IP:
			case DataType.NOMINAL:
			case DataType.ORDINAL:
			default:
				return ParallelCoordsUtils.extractNominalConstraintRange(dimension, filters);
		}
	};

	/**
	 * Create constraint range for numerical axis.
	 * @param filters The filters to be applied.
	 */
	private static extractNumericConstraintRange = (filters: (Value | RangeFilter<Value>)[]): Array<number> => {
		const constraintrange = [];
		filters.forEach((filter) => {
			if (filter === null) return;
			if (typeof filter === 'string' || filter instanceof Ip) {
				console.error('Filter has type string or Ip, even though the specified data type is numeric.');
				return;
			}
			if (typeof filter === 'number') {
				constraintrange.push([filter, filter]);
			} else {
				const rangeFilter: RangeFilter<number> = filter as RangeFilter<number>;
				constraintrange.push([rangeFilter.from, rangeFilter.to]);
			}
		});
		return constraintrange;
	};

	/**
	 * Create constraint range for nominal axis.
	 * @param dimension The actual dimension.
	 * @param filters The filters to be applied.
	 */
	private static extractNominalConstraintRange = (
		dimension: Dimension,
		filters: (Value | RangeFilter<Value>)[],
	): Array<number> => {
		const constraintrange = [];
		filters.forEach((filter) => {
			if (filter === null) return;
			const map = (dimension as NominalDimension).map;
			if (typeof filter === 'string' || typeof filter === 'number' || filter instanceof Ip) {
				filter = filter === Infinity ? -1 : filter;
				const filterValue = map[filter.toString()];
				if (CommonHelper.isNullOrUndefined(filterValue))
					throw new FilterOutOfRangeError(filter, dimension.label);
				constraintrange.push([filterValue, filterValue]);
			} else {
				const rangeFilter: RangeFilter<Value> = filter as RangeFilter<Value>;
				rangeFilter.from = rangeFilter.from === Infinity ? -1 : rangeFilter.from;
				rangeFilter.to = rangeFilter.to === Infinity ? -1 : rangeFilter.to;
				const from = map[rangeFilter.from.toString()];
				const to = map[rangeFilter.to.toString()];
				if (CommonHelper.isNullOrUndefined(from)) throw new FilterOutOfRangeError(from, dimension.label);
				if (CommonHelper.isNullOrUndefined(to)) throw new FilterOutOfRangeError(to, dimension.label);
				constraintrange.push([from, to]);
			}
		});
		return constraintrange;
	};
}
