import { CellTypes } from '../enums/cellTypes.enum';
import { Ip } from '../models/ip.modell';
import { Dimension, NominalDimension, NumericDimension } from '../models/dimension.model';
import { DataRecord } from '../models/datarecord.model';

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
	rawData: Array<string>,
	label: string,
	filter: { type: CellTypes; value: number | string } = null,
): NominalDimension => {
	const uniqueData: Array<string> = rawData.filter((v, i, a) => a.indexOf(v) === i);
	const sortedData: Array<string> = uniqueData.filter((v, i, a) => a.indexOf(v) === i);
	const idxData = Array.from(Array(sortedData.length).keys());
	let i = 0;
	const map: Record<string, number> = {};
	sortedData.forEach((np) => {
		map[np] = idxData[i++];
	});

	const converted = [];
	rawData.forEach((a) => {
		converted.push(map[a]);
	});

	return {
		range: [0, idxData.length - 1],
		constraintrange: filter && filter.value ? [map[filter.value as string], map[filter.value as string]] : [],
		label: label,
		ticktext: sortedData,
		tickvals: idxData,
		values: converted,
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

const convertToWildcard = (rows: Array<DataRecord>, key: string, label: string): NominalDimension => {
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

	// TODO: remove this if a solution was found
	rawData.forEach((d) => {
		if (d === Number.POSITIVE_INFINITY) {
			const idx = rawData.indexOf(d);
			rawData[idx] = -1000;
		}
	});

	return {
		range: [Math.min(...rawData), Math.max(...rawData)],
		label: label,
		values: rawData,
		constraintrange: filter && filter.value ? [filter.value as number, filter.value as number] : [],
		visible: true,
	};
};

export { convertDimension, convertAnomalyScore, unpack, convertToWildcard };
