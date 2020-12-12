import React from 'react';
import { CubeCellModel } from '../../../models/cell.model';
import { FilterParameter } from '../../../models/filter.model';
import { SCORE_MIN, SCORE_MAX } from '../../../helpers/constants';
import '../ChartsView.css';
import { GiMagnifyingGlass } from 'react-icons/gi';
import ChartsView from '../ChartsView';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Plotly = require('plotly.js-dist');

type PlotProps = {
	data: CubeCellModel[];
	filters: FilterParameter;
	metadata: { [id: string]: { key: string; label: string; type: string } };
};

type PlotState = {
	data: {
		color: any;
		type: string;
		x: string[];
		y: string[];
		z: number[];
		hovertemplate: string;
		text: string[];
		colorscale: Array<Array<string>>;
		zmin: number;
		zmax: number;
		showscale: boolean;
		showlegend: boolean;
	};
	layout: {
		hovermode: string;
		margin: {
			l: number;
			r: number;
			b: number;
			t: number;
			pad: number;
		};
		height: string;
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
};

class HeatMap extends React.Component<PlotProps, PlotState> {
	heatMap: React.RefObject<HTMLDivElement>;
	/**
	 * This method is called after every property-update.
	 * If data or filters changed, the data will processed and updated
	 * @param prevProps Previous component properties to detect changes for component update.
	 */
	componentDidUpdate(prevProps: PlotProps): void {
		// Chechk wether filters or data changed
		if (prevProps.filters !== this.props.filters || prevProps.data !== this.props.data) {
			this.setState({ currentFilters: this.props.filters.clone() }, () => this.preProcess());
		}
	}

	/**
	 * Pre-processes new or changed data to prepare the scatter plot
	 * This Method also checks if all necessary information for the plot is provided.
	 * If not there will be a message for the user set in this method.
	 */
	preProcess = (): void => {
		// Return if data or metadata lists are undefined to prevent null pointer errors.
		if (this.props.data === null) return;
		if (this.props.metadata == null) return;

		// Preparing all the necessary data for the plot.
		const arrays = this.props.data;
		const data = this.state.data;
		const layout = this.state.layout;
		const metaData = this.props.metadata;
		let message = '';
		data.text = [];
		data.x = [];
		data.y = [];
		data.z = [];
		data.color = [];
		let showGraph = false;
		const orderedFilters = this.state.currentFilters.getOrderedFilters();

		// At least two filters and one data entry is given.
		if (orderedFilters.length > 1 && this.props.data.length > 0) {
			// Necessary information is provided, so set the graph to be displayed.
			showGraph = true;
			// The filtertypes will be obtained from metadata
			const lastFilterType = metaData[orderedFilters[orderedFilters.length - 1].type];
			const secondLastFilterType = metaData[orderedFilters[orderedFilters.length - 2].type];

			// setting the axis labels and hovertemplate
			layout.xaxis.title = lastFilterType.label;
			layout.yaxis.title.text = secondLastFilterType.label;
			data.hovertemplate =
				layout.xaxis.title +
				': <b>%{x}</b><br>' +
				layout.yaxis.title.text +
				': <b>%{y}</b>' +
				'<br><br><b>Score: %{z}</b><extra></extra>';

			// For every data entry  push the values and names into the plot data.
			for (let i = 0; i < arrays.length; i++) {
				data.x.push(arrays[i][lastFilterType.key].toString());
				data.y.push(arrays[i][secondLastFilterType.key].toString());
				const score = Math.round((arrays[i]['anomalyScore'] + Number.EPSILON) * 100) / 100;
				data.z.push(score);
				data.text.push(score.toString());
				data.color.push(this.props.data[i]['anomalyScore']);
			}
			//updating the state of the component with new plot-data, followed by drawing the plot
			this.setState({ data: data, showGraph: showGraph, message: message }, () => this.draw());
			// necessary filters not provided
		} else if (orderedFilters.length < 2) {
			message = 'Please select at least two filters';
			//updating the state of the component with new plot-data, followed by drawing the plot
			this.setState({ showGraph: showGraph, message: message, graphLoaded: false }, () => this.draw());
			// data list is empty
		} else {
			message = 'There is no data matching the given filters. please choose other filters';
			//updating the state of the component with new plot-data, followed by drawing the plot
			this.setState({ showGraph: showGraph, message: message, graphLoaded: false }, () => this.draw());
		}
	};

	draw = (): void => {
		const layout = this.state.layout;
		layout.width = this.currentParentWidth();
		// Is a graph already loaded?
		if (this.state.graphLoaded) {
			Plotly.redraw(this.heatMap.current, [this.state.data], layout, this.state.config);
		} else {
			Plotly.newPlot('heatMap', [this.state.data], layout, this.state.config);
			this.setState({ graphLoaded: true });
		}
	};

	constructor(props: PlotProps) {
		super(props);
		this.state = {
			data: {
				color: [],
				type: 'heatmap',
				x: [],
				y: [],
				z: [],
				hovertemplate: '',
				text: [],
				showscale: true,
				showlegend: false,
				colorscale: [
					['0.0', '#00ff00'],
					['0.33', '#FBFF31'],
					['1.0', '#ff0000'],
				],
				zmin: SCORE_MIN,
				zmax: SCORE_MAX,
			},
			layout: {
				hovermode: 'closest',
				margin: {
					l: 120,
					r: 120,
					b: 120,
					t: 20,
					pad: 0,
				},
				width: 0,
				height: '380',
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
		this.heatMap = React.createRef();
		window.addEventListener('resize', this.resizeChart);
	}

	currentParentWidth = (): number => {
		return document.getElementById(ChartsView.containerName).clientWidth * 0.95;
	};

	resizeChart = (): void => {
		const layoutUpdate = { width: this.currentParentWidth() };
		if (this.heatMap.current) Plotly.relayout(this.heatMap.current, layoutUpdate);
	};

	render(): JSX.Element {
		return (
			<div>
				<div className={this.state.showGraph ? 'chart' : 'chart hide-chart'}>
					<div ref={this.heatMap} id="heatMap" />
				</div>
				<div className={this.state.showGraph ? 'chart chart-no-data hide-chart' : 'chart chart-no-data'}>
					<GiMagnifyingGlass size={80} />
					<h2>No Data</h2>
					<h5> {this.state.message}</h5>
				</div>
			</div>
		);
	}
}

export default HeatMap;
