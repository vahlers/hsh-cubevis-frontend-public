const unpack = (rows, key) => {
	rows = rows.filter((row) => row[key] !== '?');
	return rows.map(function (row) {
		return row[key];
	});
};

const convertAnomalyScore = (rows, key) => {
	rows = rows.filter((row) => row[key] !== '?');
	return rows.map(function (row) {
		return parseFloat(row[key].replace('[', '').replace(']', ''));
	});
};

const convertToNominal = (rows, keyName, label) => {
	const rawData = unpack(rows, keyName);
	const uniqueData = rawData.filter((v, i, a) => a.indexOf(v) === i);
	const sortedData = uniqueData.filter((v, i, a) => a.indexOf(v) === i);
	const idxData = Array.from(Array(sortedData.length).keys());
	let i = 0;
	const map = {};
	sortedData.forEach((np) => {
		map[np] = idxData[i++];
	});

	const converted = [];
	rawData.forEach((a) => {
		converted.push(map[a]);
	});

	return {
		range: [0, idxData.length - 1],
		label: label,
		ticktext: sortedData,
		tickvals: idxData,
		values: converted,
		visible: true,
	};
};

const convertToNumeric = (rows, key, label) => {
	const rawData = unpack(rows, key);
	return {
		range: [Math.min(...rawData), Math.max(...rawData)],
		label: label,
		values: rawData,
		constraintrange: [],
		visible: true,
	};
};

const activeWildCard = (rows, key) => {
	const dimension = unpack(rows, key);
	return dimension && dimension.includes('*');
};

export { activeWildCard, convertAnomalyScore, convertToNominal, unpack, convertToNumeric };
