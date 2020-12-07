import { Ip } from '../../models/ip.modell';
import { Dimension, NominalDimension, NumericDimension, OrdinalDimension } from '../../models/dimension.model';
import { DataRecord } from '../../models/datarecord.model';
import { DataType } from '../../enums/dataType.enum';
import { Value } from '../../models/filter.model';
import { CellTypes } from '../../enums/cellTypes.enum';
import { RangeFilter } from '../../models/rangeFilter.model';

export class ParallelCoordsUtils {
	static unpack = (rows: Array<DataRecord>, columName: string): Array<string | number | Ip> => {
		return rows.map(function (row) {
			return row[columName];
		});
	};

	static convertDimension = (
		rows: Array<DataRecord>,
		dimension: { key: string; label: string; type: string },
		type: CellTypes,
		filters: (Value | RangeFilter<Value>)[] = null,
	): Dimension => {
		switch (dimension.type) {
			case DataType.IP:
				return ParallelCoordsUtils._convertToIp(rows, dimension.key, dimension.label, type, filters);
			case DataType.ORDINAL:
				return ParallelCoordsUtils._convertToOrdinal(rows, dimension.key, dimension.label, type, filters);
			case DataType.NUMERIC:
				return ParallelCoordsUtils._convertToNumeric(rows, dimension.key, dimension.label, type, filters);
			case DataType.NOMINAL:
			default:
				const rawData: Array<string> = ParallelCoordsUtils.unpack(rows, dimension.key) as Array<string>;
				return ParallelCoordsUtils._convertToNominal(rawData, dimension.key, dimension.label, type, filters);
		}
	};

	static convertToWildcard = (
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

	static _convertToNominal = (
		rawData: Array<string | number>,
		key: string,
		label: string,
		type: CellTypes,
		filters: (Value | RangeFilter<Value>)[] = null,
		replacements: Record<number, string> = {},
	): NominalDimension => {
		const unique: Array<string | number> = rawData.filter((v, i, a) => a.indexOf(v) === i);
		const sorted: Array<string | number> = unique.sort((a, b) => (a > b ? 1 : -1));
		const indices = Array.from(Array(unique.length).keys());

		let i = 0;
		const valueMapping: Record<string, number> = {};
		unique.forEach((v) => {
			valueMapping[v] = indices[i++];
		});

		const converted = rawData.map((a) => valueMapping[a]);

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

	static _convertToIp = (
		rows: Array<DataRecord>,
		key: string,
		label: string,
		type: CellTypes,
		filters: (Value | RangeFilter<Value>)[] = null,
	): NominalDimension => {
		const rawData: Array<Ip> = ParallelCoordsUtils.unpack(rows, key) as Array<Ip>;
		const convertedIPs: Array<string> = rawData.map((ip) => ip.toString());
		return ParallelCoordsUtils._convertToNominal(convertedIPs, key, label, type, filters);
	};

	static _convertToOrdinal = (
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

		return ParallelCoordsUtils._convertToNominal(converted, key, label, type, filters, { 0: '?' });
	};

	static _convertToNumeric = (
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

	static getConstraintRange = (
		dataType: string,
		dimension: Dimension,
		filters: (Value | RangeFilter<Value>)[],
	): Array<number> => {
		const constraintrange = [];

		if (filters) {
			switch (dataType) {
				case DataType.NUMERIC:
					filters.forEach((filter) => {
						if (!filter) return;
						if (typeof filter === 'string' || filter instanceof Ip) {
							console.error(
								'Filter has type string or Ip, even though the specified data type is numeric.',
							);
							return;
						}
						if (typeof filter === 'number') {
							constraintrange.push([filter, filter]);
						} else {
							const rangeFilter: RangeFilter<number> = filter as RangeFilter<number>;
							constraintrange.push([rangeFilter.from, rangeFilter.to]);
						}
					});
					break;
				case DataType.IP:
				case DataType.NOMINAL:
				case DataType.ORDINAL:
				default:
					filters.forEach((filter) => {
						if (!filter) return;
						if (typeof filter === 'string' || typeof filter === 'number' || filter instanceof Ip) {
							const filterValue = (dimension as NominalDimension).map[filter.toString()];
							constraintrange.push([filterValue, filterValue]);
						} else {
							const rangeFilter: RangeFilter<Value> = filter as RangeFilter<Value>;
							const from = (dimension as NominalDimension).map[rangeFilter.from.toString()];
							const to = (dimension as NominalDimension).map[rangeFilter.to.toString()];
							constraintrange.push([from, to]);
						}
					});
					break;
			}
		}

		return constraintrange;
	};
}
