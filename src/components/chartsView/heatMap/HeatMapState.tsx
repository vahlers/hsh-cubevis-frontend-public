import { FilterParameter } from '../../../models/filter.model';
import { CellTypes } from '../../../enums/cellTypes.enum';
import { SCORE_MIN, SCORE_MAX, COLOR_SCALE } from '../../../config';

type HeatMapState = {
	data: {
		color: number[];
		type: string;
		x: string[];
		y: string[];
		z: number[];
		hovertemplate: string;
		hoverongaps: boolean;
		text: string[];
		colorscale: Array<Array<string>>;
		zmin: number;
		zmax: number;
		showscale: boolean;
		showlegend: boolean;
	};
	layout: {
		dragmode: string;
		hovermode: string;
		margin: {
			l: number;
			r: number;
			b: number;
			t: number;
			pad: number;
		};
		height: number;
		autosize: boolean;
		xaxis: {
			title: string;
		};
		width: number;
		yaxis: {
			automargin: boolean;
			tickformat: string;
			title: {
				text: string;
				standoff: number;
			};
		};
	};
	config: {
		responsive: boolean;
	};
	graphIsLoading: boolean;
	graphLoaded: boolean;
	showGraph: boolean;
	message: string;
	currentFilters: FilterParameter;
	cellTypeX: CellTypes;
	cellTypeY: CellTypes;
};

const initialState = (): HeatMapState => {
	return {
		cellTypeX: null,
		cellTypeY: null,
		data: {
			color: [],
			type: 'heatmap',
			x: [],
			y: [],
			z: [],
			hoverongaps: false,
			hovertemplate: '',
			text: [],
			showscale: false,
			showlegend: false,
			colorscale: COLOR_SCALE,
			zmin: SCORE_MIN,
			zmax: SCORE_MAX,
		},
		layout: {
			dragmode: 'select',
			hovermode: 'closest',
			margin: {
				l: 120,
				r: 120,
				b: 120,
				t: 20,
				pad: 0,
			},
			width: 0,
			height: 0,
			autosize: true,
			xaxis: {
				title: 'dimension',
			},
			yaxis: {
				tickformat: 'd',
				automargin: false,
				title: {
					text: 'dimension',
					standoff: 10,
				},
			},
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
export type { HeatMapState };
