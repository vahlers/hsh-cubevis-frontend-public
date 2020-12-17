import React from 'react';
import { CubeCellModel } from '../../../models/cell.model';
import { FilterParameter } from '../../../models/filter.model';
import { SCORE_MIN, SCORE_MAX, COLOR_SCALE } from '../../../helpers/constants';
import '../ChartsView.css';
import { GiMagnifyingGlass } from 'react-icons/gi';
import ChartsView from '../ChartsView';
import { CellTypes } from '../../../enums/cellTypes.enum';
import { HeatMapUtils } from './HeatMapUtils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Plotly = require('plotly.js-dist');

type PlotProps = {
	data: CubeCellModel[];
	filters: FilterParameter;
	metadata: { [id: string]: { key: string; label: string; type: string } };
	onSelection;
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

		let cellTypeX = null;
		let cellTypeY = null;

		// At least two filters and one data entry is given.
		if (orderedFilters.length > 1 && this.props.data.length > 0) {
			// Necessary information is provided, so set the graph to be displayed.
			showGraph = true;
			cellTypeX = orderedFilters[orderedFilters.length - 1].type;
			cellTypeY = orderedFilters[orderedFilters.length - 2].type;
			// The filtertypes will be obtained from metadata
			const lastFilterType = metaData[cellTypeX];
			const secondLastFilterType = metaData[cellTypeY];

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
			this.setState(
				{ data: data, showGraph: showGraph, message: message, cellTypeX: cellTypeX, cellTypeY: cellTypeY },
				() => this.draw(),
			);
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
			Plotly.newPlot(this.heatMap.current, [this.state.data], layout, this.state.config);
			// add event handlers: if a user clicks the chart, or selects a range by rect
			(this.heatMap.current as any).on('plotly_click', (event) => {
				this.onPlotlyClick(event);
			});
			(this.heatMap.current as any).on('plotly_selected', (event) => {
				this.onPlotlySelected(event);
			});
			this.setState({ graphLoaded: true });
		}
	};

	/** Once a user has clicked a tile on the heatmap,
	 * 	a filter of the current dimensions,
	 * 	specified to the value of the clicked tile, is emitted. */
	onPlotlyClick = (event): void => {
		if (!event || !event.points || event.points.length != 1) return;
		const { x, y } = event.points[0];
		const filters: FilterParameter = new FilterParameter();
		filters.addFilter(this.state.cellTypeX, x);
		filters.addFilter(this.state.cellTypeY, y);
		this.props.onSelection(filters);
	};

	/** Once a user has selected multiple tiles by rect in the heatmap,
	 * 	a multivalue filter for both dimensions is emitted. */
	onPlotlySelected = (event): void => {
		const selectionRectangle = HeatMapUtils.getCoordinatesFromSelection(event);
		if (!selectionRectangle) return;
		const { x1, x2, y1, y2 } = selectionRectangle;

		// invalid selection from user, do nothing
		if (y2 < y1 || x2 < x1) return;

		// find values based on selection
		const valuesDimX = this.state.data.x.filter((element, i) => i >= x1 && i <= x2);
		const valuesDimY = this.state.data.y.filter((element, i) => i >= y1 && i <= y2);

		const filters: FilterParameter = new FilterParameter();
		filters.addFilter(this.state.cellTypeX, valuesDimX);
		filters.addFilter(this.state.cellTypeY, valuesDimY);
		this.props.onSelection(filters);
	};

	constructor(props: PlotProps) {
		super(props);
		this.state = {
			cellTypeX: null,
			cellTypeY: null,
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
				height: 380,
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

	currentParentHeight = (): number => {
		return document.getElementById(ChartsView.containerName).clientHeight * 0.95;
	};

	resizeChart = (): void => {
		const layoutUpdate = { width: this.currentParentWidth(), height: this.currentParentHeight() };
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
