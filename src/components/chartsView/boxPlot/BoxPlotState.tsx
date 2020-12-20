import { FilterParameter } from '../../../models/filter.model';

type PlotState = {
	data: any[];
	layout: {
		width: number;
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
			tickformat: string;
			automargin: boolean;
		};
		yaxis: {
			title: string;
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
};

const initialState = (): PlotState => {
	return {
		data: [],
		layout: {
			width: 300,
			hovermode: 'y unified',
			margin: {
				l: 120,
				r: 120,
				b: 120,
				t: 20,
				pad: 0,
			},
			height: 380,
			autosize: true,
			xaxis: {
				title: 'absolute occurrence',
				tickformat: 'd',
				automargin: false,
			},
			yaxis: {
				title: 'yLabel',
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
export type { PlotState };
