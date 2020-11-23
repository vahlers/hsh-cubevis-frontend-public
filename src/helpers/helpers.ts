import { CellTypes } from '../enums/cellTypes.enum';
import { Ip } from '../models/ip.modell';
import { Dimension, NominalDimension, NumericDimension } from '../models/dimension.model';
import { DataRecord } from '../models/datarecord.model';
import { USE_OLD_DATA_SCHEMA } from '../helpers/constants';

const unpack = (rows: Array<DataRecord>, key: string): Array<string | number | Ip> => {
	return rows.map(function (row) {
		return row[key];
	});
};

const convertAnomalyScore = (rows: Array<unknown>, key: string): Array<number> => {
	return rows.map(function (row) {
		return parseFloat(row[key].replace('[', '').replace(']', ''));
	});
};

const convertDimension = (
	rows: Array<DataRecord>,
	dimension: { key: string; label: string; type: string },
	filter: { type: CellTypes; value: number | string } = null,
): Dimension => {
	switch (dimension.type) {
		case 'ip':
			return convertToIp(rows, dimension.key, dimension.label, filter);
		case 'numeric':
			return convertToNumeric(rows, dimension.key, dimension.label, filter);
		case 'nominal':
		default:
			return convertToNominal(rows, dimension.key, dimension.label, filter);
	}
};

const _convertToNominal = (
	rawData: Array<string | number>,
	label: string,
	filter: { type: CellTypes; value: number | string } = null,
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
			// hacky approach, to be discussed
			console.error(
				`The requested filter value '${filter.value}' of dimension '${label}' is not in the data. None of the records match!`,
			);
			const fictive = Math.max(...indices) + 1;
			indices.push(fictive);
			constraintrange = [fictive, fictive];
		} else {
			const value = valueMapping[filter.value as string];
			constraintrange = [value, value];
		}
	}

	return {
		range: [Math.min(...indices), Math.max(...indices)],
		label: label,
		values: converted,
		tickvals: indices,
		ticktext: sorted as Array<string>,
		constraintrange: constraintrange,
		visible: true,
	};
};

const convertToIp = (
	rows: Array<DataRecord>,
	keyName: string,
	label: string,
	filter: { type: CellTypes; value: number | string } = null,
): NominalDimension => {
	const rawData: Array<Ip> = unpack(rows, keyName) as Array<Ip>;
	const convertedIPs: Array<string> = rawData.map((ip) => ip.toString());
	return _convertToNominal(convertedIPs, label, filter);
};

const convertToNominal = (
	rows: Array<DataRecord>,
	keyName: string,
	label: string,
	filter: { type: CellTypes; value: number | string } = null,
): NominalDimension => {
	const rawData: Array<string> = unpack(rows, keyName) as Array<string>;
	return _convertToNominal(rawData, label, filter);
};

const convertToWildcard = (
	rows: Array<DataRecord>,
	key: string,
	label: string,
): NominalDimension | NumericDimension => {
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
	};
};

const convertToNumeric = (
	rows: Array<DataRecord>,
	key: string,
	label: string,
	filter: { type: CellTypes; value: number | string } = null,
): NumericDimension => {
	const rawData: Array<number> = unpack(rows, key) as Array<number>;

	if (USE_OLD_DATA_SCHEMA) {
		let constraintrange = [];
		if (filter && filter.value) {
			constraintrange = [filter.value, filter.value];
		}
		return {
			range: [Math.min(...rawData), Math.max(...rawData)],
			label: label,
			values: rawData as Array<number>,
			constraintrange: constraintrange,
			visible: true,
		};
	}

	const minimum = Math.min(...rawData) - 1;
	const converted: Array<number> = rawData.map((d) =>
		d === Number.POSITIVE_INFINITY ? (rawData[rawData.indexOf(d)] = minimum) : d,
	);
	return _convertToNominal(converted, label, filter, { 0: '?' });
};

export { convertDimension, convertAnomalyScore, unpack, convertToWildcard };
