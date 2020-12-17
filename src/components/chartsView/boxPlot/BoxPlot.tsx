import React from 'react';
import '../ChartsView.css';
import { GiMagnifyingGlass } from 'react-icons/gi';
import ChartsView from '../ChartsView';
import { initialState, PlotState } from './BoxPlotState';
import { PlotProps } from './BoxPlotProps';
import { BoxPlotUtils } from './BoxPlotUtils';
import { BoxPlotData } from './BoxPlotData';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Plotly = require('plotly.js-dist');

class BoxPlot extends React.Component<PlotProps, PlotState> {
	boxPlot: React.RefObject<HTMLDivElement>;
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
	 * Pre-processes new or changed data to prepare the boxplot
	 * This Method also checks if all necessary information for the plot is provided.
	 * If not there will be a message for the user set in this method.
	 */
	preProcess = (): void => {
		// Return if data or metadata lists are undefined to prevent null pointer errors.
		if (this.props.data === null) return;
		if (this.props.metadata == null) return;

		// Preparing all the necessary data for the plot.
		const datarows = this.props.data;
		const metaData = this.props.metadata;
		const layout = this.state.layout;
		const plotData = [];
		let helpMessage = '';
		let showGraph = false;
		const orderedFilters = this.state.currentFilters.getOrderedFilters();

		// At least two filters and one data entry is given.
		if (orderedFilters.length > 0 && this.props.data.length > 0) {
			// Necessary information is provided, so set the graph to be displayed.
			showGraph = true;
			// The filtertypes will be obtained from metadata
			const lastFilterType = metaData[orderedFilters[orderedFilters.length - 1].type];
			layout.yaxis.title = lastFilterType.label;

			// For every data entry  push the values and names into the plot data.
			for (let i = 0; i < datarows.length; i++) {
				//Create data for the current plotentry
				const rowData: BoxPlotData = BoxPlotUtils.formatBoxPlotData({
					dimension: datarows[i][lastFilterType.key].toString(),
					countValue: datarows[i]['count'],
					meanValue: datarows[i]['countMean'],
					stdDeviation: datarows[i]['countStandardDeviation'],
					firstQuartile: datarows[i]['countMean'] - datarows[i]['countStandardDeviation'],
					thirdQuartile: datarows[i]['countMean'] + datarows[i]['countStandardDeviation'],
					lowerFence: datarows[i]['countMean'] - 2 * datarows[i]['countStandardDeviation'],
					upperFence: datarows[i]['countMean'] + 2 * datarows[i]['countStandardDeviation'],
					anomalyScore:
						(datarows[i]['count'] - datarows[i]['countMean']) / datarows[i]['countStandardDeviation'],
				});

				// Add a trace containing the boxes
				plotData.push(BoxPlotUtils.createBoxTrace(rowData));
				// Add a trace containing the hoverdata
				plotData.push(BoxPlotUtils.createHoverTrace(rowData));
				// Add a trace containing the actual count value
				plotData.push(BoxPlotUtils.createScoreMarker(rowData));
			}
			// necessary filters not provided
		} else if (orderedFilters.length == 0) {
			helpMessage = 'Please select at least one filters';
			// data list is empty
		} else {
			helpMessage = 'There is no data matching the given filters. please choose other filters';
		}

		this.setState({ data: plotData, showGraph: showGraph, message: helpMessage }, () => this.draw());
	};

	draw = (): void => {
		//if (!this.state.showGraph) return;
		const layout = this.state.layout;
		layout.width = this.currentParentWidth();
		Plotly.react(this.boxPlot.current, this.state.data, layout, this.state.config);
	};

	constructor(props: PlotProps) {
		super(props);
		this.state = initialState();
		this.boxPlot = React.createRef();
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
		if (this.boxPlot.current && this.state.showGraph) Plotly.relayout(this.boxPlot.current, layoutUpdate);
	};

	render(): JSX.Element {
		return (
			<div>
				<div className={this.state.showGraph ? 'chart' : 'chart hide-chart'}>
					<div ref={this.boxPlot} id="barChart" />
				</div>
				<div className={!this.state.showGraph ? 'chart chart-no-data' : 'chart chart-no-data hide-chart'}>
					<GiMagnifyingGlass size={80} />
					<h2>No Data</h2>
					<h5> {this.state.message}</h5>
				</div>
			</div>
		);
	}
}

export default BoxPlot;
