type BoxPlotData = {
	dimension: string;
	countValue: number;
	meanValue: number;
	stdDeviation: number;
	firstQuartile: number;
	thirdQuartile: number;
	lowerFence: number;
	upperFence: number;
	anomalyScore: number;
};

type BoxTrace = {
	type: string;
	name: string;
	q1: number[];
	median: number[];
	mean: number[];
	q3: number[];
	lowerfence: number[];
	upperfence: number[];
	y: string[];
	orientation: string;
	sd: number;
	showlegend: boolean;
	hoverinfo: string;
	marker: {
		color: string;
	};
};

type HoverTrace = {
	type: string;
	x: number[];
	y: string[];
	orientation: string;
	showlegend: boolean;
	opacity: number;
	// setting the hovertemplate for the whole boxplot
	hovertemplate: string;
	hoverlabel: {
		bgcolor: string;
		align: string;
	};
};

type ScoreMarker = {
	x: number[];
	y: string[];
	showlegend: boolean;
	hoverinfo: string;
	name: string;
	marker: {
		// Setting the color depending on the anomaly score
		color: number[];
		showscale: boolean;
		colorscale: string[][];
		cmin: number;
		cmax: number;
		size: 8;
	};
};

export type { BoxPlotData, BoxTrace, HoverTrace, ScoreMarker };
