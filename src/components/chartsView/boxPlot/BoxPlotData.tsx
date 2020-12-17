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

export type { BoxPlotData };
