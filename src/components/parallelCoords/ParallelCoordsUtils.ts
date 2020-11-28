import { Ip } from '../../models/ip.modell';
import { Dimension, NominalDimension, NumericDimension, OrdinalDimension } from '../../models/dimension.model';
import { DataRecord } from '../../models/datarecord.model';
import { DataType } from '../../enums/dataType.enum';
import { Filter } from '../../models/filter.model';
import { FilterOutOfRangeError } from '../../errors/FilterOutOfRangeError';

export class ParallelCoordsUtils {
	static unpack = (rows: Array<DataRecord>, key: string): Array<string | number | Ip> => {
		return rows.map(function (row) {
			return row[key];
		});
	};

	static convertDimension = (
		rows: Array<DataRecord>,
		dimension: { key: string; label: string; type: string },
		filter: Filter = null,
	): Dimension => {
		switch (dimension.type) {
			case DataType.IP:
				return ParallelCoordsUtils._convertToIp(rows, dimension.key, dimension.label, filter);
			case DataType.ORDINAL:
				return ParallelCoordsUtils._convertToOrdinal(rows, dimension.key, dimension.label, filter);
			case DataType.NUMERIC:
				return ParallelCoordsUtils._convertToNumeric(rows, dimension.key, dimension.label, filter);
			case DataType.NOMINAL:
			default:
				const rawData: Array<string> = ParallelCoordsUtils.unpack(rows, dimension.key) as Array<string>;
				return ParallelCoordsUtils._convertToNominal(rawData, dimension.label, filter);
		}
	};

	static convertToWildcard = (rows: Array<DataRecord>, label: string): NominalDimension => {
		const recordCnt = rows.length;
		const idxData = Array(recordCnt).fill(0);
		return {
			constraintrange: [],
			range: [0, 0],
			label: label,
			ticktext: ['*'],
			tickvals: [0],
			values: idxData,
			visible: true,
			map: {},
		};
	};

	static _convertToNominal = (
		rawData: Array<string | number>,
		label: string,
		filter: Filter = null,
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

		let constraintrange = [];
		if (filter && filter.value) {
			if (!valueMapping[filter.value as string]) {
				throw new FilterOutOfRangeError(filter.value, label);
			}
			const value = valueMapping[filter.value as string];
			constraintrange = [value, value];
			if (converted.find((v) => v === value) === undefined) console.error('Value was not found');
		}

		return {
			range: [Math.min(...indices), Math.max(...indices)],
			label: label,
			values: converted,
			tickvals: indices,
			ticktext: sorted as Array<string>,
			constraintrange: constraintrange,
			visible: true,
			map: valueMapping,
		};
	};

	static _convertToIp = (
		rows: Array<DataRecord>,
		keyName: string,
		label: string,
		filter: Filter = null,
	): NominalDimension => {
		const rawData: Array<Ip> = ParallelCoordsUtils.unpack(rows, keyName) as Array<Ip>;
		const convertedIPs: Array<string> = rawData.map((ip) => ip.toString());
		return ParallelCoordsUtils._convertToNominal(convertedIPs, label, filter);
	};

	static _convertToOrdinal = (
		rows: Array<DataRecord>,
		key: string,
		label: string,
		filter: Filter = null,
	): OrdinalDimension => {
		const rawData: Array<number> = ParallelCoordsUtils.unpack(rows, key) as Array<number>;

		const minimum = Math.min(...rawData) - 1;
		const converted: Array<number> = rawData.map((d) =>
			d === Number.POSITIVE_INFINITY ? (rawData[rawData.indexOf(d)] = minimum) : d,
		);

		return ParallelCoordsUtils._convertToNominal(converted, label, filter, { 0: '?' });
	};

	static _convertToNumeric = (
		rows: Array<DataRecord>,
		key: string,
		label: string,
		filter: Filter = null,
	): NumericDimension => {
		const rawData: Array<number> = ParallelCoordsUtils.unpack(rows, key) as Array<number>;
		const minimum = Math.min(...rawData) - 1;
		const converted: Array<number> = rawData.map((d) =>
			d === Number.POSITIVE_INFINITY ? (rawData[rawData.indexOf(d)] = minimum) : d,
		);
		return {
			range: [Math.min(...converted), Math.max(...converted)],
			label: label,
			values: converted,
			constraintrange: filter && filter.value ? [filter.value as number, filter.value as number] : [],
			visible: true,
		};
	};
}
