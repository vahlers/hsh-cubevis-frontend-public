import { FilterParameter } from '../../../models/filter.model';
import { CellTypes } from '../../../enums/cellTypes.enum';
import { SCORE_MIN, SCORE_MAX } from '../../../config';

type ChartState = {
	data: {
		name: string;
		type: string;
		x: any[];
		y: any[];
		marker: {
			color: any;
			colorscale: Array<Array<string>>;
			cmin: number;
			cmax: number;
			showscale: boolean;
		};
		selectedpoints: any;
	};

	layout: {
		margin: {
			l: number;
			r: number;
			b: number;
			t: number;
			pad: number;
		};
		autosize: boolean;
		xaxis: {
			title: string;
		};
		yaxis: {
			title: string;
			range: number[];
			fixedrange: boolean;
			autorange: boolean;
		};
		width: number;
		height: number;
		dragmode: string;
	};
	config: {
		responsive: boolean;
	};
	graphIsLoading: boolean;
	graphLoaded: boolean;
	showGraph: boolean;
	message: string;
	currentFilters: FilterParameter;
	currentCellType: CellTypes;
};

const initialState = (): ChartState => {
	return {
		currentCellType: null,
		data: {
			name: 'Anomaly-Score Barchart',
			type: 'bar',
			x: [],
			y: [0, 10],
			marker: {
				color: [],
				showscale: false,
				colorscale: [
					['0.0', '#00ff00'],
					['0.33', '#FBFF31'],
					['1.0', '#ff0000'],
				],
				cmin: SCORE_MIN,
				cmax: SCORE_MAX,
			},
			selectedpoints: [],
		},
		layout: {
			dragmode: 'select',
			margin: {
				l: 50,
				r: 50,
				b: 150,
				t: 30,
				pad: 0,
			},
			autosize: true,
			xaxis: {
				title: 'dimension',
			},
			yaxis: {
				title: 'anomaly-score',
				range: [0, 10],
				fixedrange: true,
				autorange: false,
			},
			width: 0,
			height: 0,
		},
		config: {
			responsive: true,
		},
		showGraph: false,
		graphIsLoading: false,
		graphLoaded: false,
		message: '',
		currentFilters: new FilterParameter(),
	};
};

export { initialState };
export type { ChartState };
