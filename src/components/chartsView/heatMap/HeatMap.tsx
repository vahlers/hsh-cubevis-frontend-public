import React from 'react';
import { FilterParameter } from '../../../models/filter.model';
import '../ChartsView.css';
import ChartsView from '../ChartsView';
import { HeatMapUtils } from './HeatMapUtils';
import { HeatMapProps } from './HeatMapProps';
import { HeatMapState, initialState } from './HeatMapState';
import { SCORE_KEY } from '../../../helpers/constants.js';
import UserInfoMessage from '../messages/UserInfoMessage';
import { DataServiceHelper } from '../../../helpers/dataService.helper';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Plotly = require('plotly.js-dist');

class HeatMap extends React.Component<HeatMapProps, HeatMapState> {
	heatMap: React.RefObject<HTMLDivElement>;
	/**
	 * This method is called after every property-update.
	 * If data or filters changed, the data will processed and updated
	 * @param prevProps Previous component properties to detect changes for component update.
	 */
	componentDidUpdate(prevProps: HeatMapProps): void {
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
			arrays.forEach((row) => {
				data.x.push(row[lastFilterType.key].toString());
				data.y.push(row[secondLastFilterType.key].toString());
				const score = Math.round((row[SCORE_KEY] + Number.EPSILON) * 100) / 100;
				data.z.push(score);
				data.text.push(score.toString());
				data.color.push(row[SCORE_KEY]);
			});
			//updating the state of the component with new plot-data, followed by drawing the plot
			this.setState(
				{ data: data, showGraph: showGraph, message: message, cellTypeX: cellTypeX, cellTypeY: cellTypeY },
				() => this.draw(),
			);
			// necessary filters not provided
		} else if (orderedFilters.length < 2) {
			message = 'Please select at least two filters.';
			//updating the state of the component with new plot-data, followed by drawing the plot
			this.setState({ showGraph: showGraph, message: message }, () => this.draw());
			// data list is empty
		} else {
			message = 'There is no data matching the given filters. Please choose other filters.';
			//updating the state of the component with new plot-data, followed by drawing the plot
			this.setState({ showGraph: showGraph, message: message }, () => this.draw());
		}
	};

	draw = (): void => {
		const layout = this.state.layout;
		layout.width = this.currentParentWidth();
		layout.height = this.currentParentHeight();
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
		const lowerValueDimX = this.state.data.x.find((elem, idx) => idx === x1);
		const upperValueDimX = this.state.data.x.find((elem, idx) => idx === x2);
		const lowerValueDimY = this.state.data.y.find((elem, idx) => idx === y1);
		const upperValueDimY = this.state.data.y.find((elem, idx) => idx === y2);

		if (!lowerValueDimX || !upperValueDimX || !lowerValueDimY || !upperValueDimY) {
			return;
		}

		const filters: FilterParameter = new FilterParameter();
		if (DataServiceHelper.equals(lowerValueDimX, upperValueDimX)) {
			filters.addFilter(this.state.cellTypeX, lowerValueDimX);
		} else {
			filters.addFilter(this.state.cellTypeX, { from: lowerValueDimX, to: upperValueDimX });
		}

		if (DataServiceHelper.equals(lowerValueDimY, upperValueDimY)) {
			filters.addFilter(this.state.cellTypeY, lowerValueDimY);
		} else {
			filters.addFilter(this.state.cellTypeY, { from: lowerValueDimY, to: upperValueDimY });
		}
		this.props.onSelection(filters);
	};
	constructor(props: HeatMapProps) {
		super(props);
		this.state = initialState();
		this.heatMap = React.createRef();
		window.addEventListener('resize', this.resizeChart);
	}

	currentParentWidth = (): number => {
		const parent = document.getElementById(ChartsView.containerName);
		return parent ? parent.clientWidth * 0.95 : 0;
	};

	currentParentHeight = (): number => {
		const parent = document.getElementById(ChartsView.containerName);
		return parent ? parent.clientHeight * 0.95 : 0;
	};

	resizeChart = (): void => {
		if (!this.state.showGraph) return;
		const layoutUpdate = { width: this.currentParentWidth(), height: this.currentParentHeight() };
		if (this.heatMap.current) Plotly.relayout(this.heatMap.current, layoutUpdate);
	};

	render(): JSX.Element {
		return (
			<div>
				<div className={this.state.showGraph ? 'chart' : 'chart hide-chart'}>
					<div ref={this.heatMap} id="heatMap" />
				</div>
				<UserInfoMessage
					className={!this.state.showGraph ? 'chart chart-no-data' : 'chart chart-no-data hide-chart'}
					message={this.state.message}
				/>
			</div>
		);
	}
}

export default HeatMap;
