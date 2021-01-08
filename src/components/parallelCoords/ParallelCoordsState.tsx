import { CellTypes } from '../../enums/cellTypes.enum';
import { COLOR_SCALE, SCORE_MAX, SCORE_MIN } from '../../config';
import { Dimension } from '../../models/dimension.model';
import { FilterParameter, Value } from '../../models/filter.model';

type ParallelCoordsData = {
	type: string;
	line: {
		color: Array<Value>;
		showscale: boolean;
		colorscale: Array<Array<string>>;
		cmin: number;
		cmax: number;
	};
	dimensions: Dimension[];
};

type ParallelCoordsState = {
	data: ParallelCoordsData;
	layout: {
		margin: {
			l: number;
			r: number;
			b: number;
			t: number;
			pad: number;
		};
		height: number;
		width: number;
	};
	config: {
		responsive: boolean;
	};
	graphIsLoading: boolean;
	graphLoaded: boolean;
	filtersMatch: boolean;
	plotContainerName: string;
	errorMessage: string;
	orderedCellTypes: Array<CellTypes>;
	customDimensionOrder: boolean;
	customSorting: boolean;
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
				b: 5,
				t: 40,
				pad: 0,
			},
			height: 0,
			width: 0,
		},
		config: {
			responsive: true,
		},
		graphIsLoading: false,
		graphLoaded: false,
		filtersMatch: true,
		errorMessage: '',
		orderedCellTypes: [],
		customDimensionOrder: false,
		customSorting: false,
		currentFilters: new FilterParameter(),
	};
};

export { initialState };
export type { ParallelCoordsState, ParallelCoordsData };
