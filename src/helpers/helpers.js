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

const convertToNominal = (rows, keyName) => {
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
		label: keyName,
		ticktext: sortedData,
		tickvals: idxData,
		values: converted,
		visible: true,
	};
};

const convertToNumeric = (rows, key) => {
	const rawData = unpack(rows, key);
	return {
		range: [Math.min(...rawData), Math.max(...rawData)],
		label: key,
		values: rawData,
		constraintrange: [],
		visible: true,
	};
};

const activeWildCard = (rows, key) => {
	return unpack(rows, key).includes('*');
};

export { activeWildCard, convertAnomalyScore, convertToNominal, unpack, convertToNumeric };
