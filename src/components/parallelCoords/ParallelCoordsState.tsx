import { COLOR_SCALE, SCORE_MAX, SCORE_MIN } from '../../helpers/constants';
import { Dimension } from '../../models/dimension.model';
import { FilterParameter } from '../../models/filter.model';

type ParallelCoordsState = {
	data: {
		type: string;
		line: {
			color: any;
			showscale: boolean;
			colorscale: Array<Array<string>>;
			cmin: number;
			cmax: number;
		};
		dimensions: Dimension[];
	};

	layout: {
		margin: {
			l: number;
			r: number;
			b: number;
			t: number;
			pad: number;
		};
		height: number;
	};
	config: {
		responsive: boolean;
	};
	graphIsLoading: boolean;
	graphLoaded: boolean;
	filtersMatch: boolean;
	plotContainerName: string;
	errorMessage: string;
	orderedDimensionLabels: Array<string>;
	customDimensionOrder: boolean;
	currentFilters: FilterParameter;
};

const initialState = (): ParallelCoordsState => {
	return {
		plotContainerName: 'par-coord',
		data: {
			type: 'parcoords',
			line: {
				color: null,
				showscale: false,
				colorscale: COLOR_SCALE,
				cmin: SCORE_MIN,
				cmax: SCORE_MAX,
			},
			dimensions: [],
		},

		layout: {
			margin: {
				l: 80,
				r: 80,
				b: 20,
				t: 50,
				pad: 0,
			},
			height: 350,
		},
		config: {
			responsive: true,
		},
		graphIsLoading: false,
		graphLoaded: false,
		filtersMatch: true,
		errorMessage: '',
		orderedDimensionLabels: [],
		customDimensionOrder: false,
		currentFilters: new FilterParameter(),
	};
};

export { initialState };
export type { ParallelCoordsState };