import React from 'react';
import { FilterParameter, Value } from '../../../models/filter.model';
import ChartsView from '../ChartsView';
import { initialState, ChartState } from './BarChartState';
import { ChartProps } from './BarChartProps';
import UserInfoMessage from '../messages/UserInfoMessage';
import { SCORE_KEY } from '../../../config';
import { SingleFilter } from '../../../models/filter.model';
import { ChartsViewUtils } from '../ChartsViewUtils';
import { PlotlyHTMLElement } from 'plotly.js';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Plotly = require('plotly.js-dist');

class BarChart extends React.Component<ChartProps, ChartState> {
	barChart: React.RefObject<HTMLDivElement>;
	componentDidUpdate(prevProps: ChartProps): void {
		// If something changed
		if (prevProps.filters !== this.props.filters || prevProps.data !== this.props.data) {
			this.setState({ currentFilters: this.props.filters.clone() }, () => this.preProcess());
		}
	}

	/** Extract the relevant filters from filter props.
	 *	If a loose dimension is in the filters, it will be selected.
	 *	If not, the last added dimension will be selected.
	 */
	getDimensionsForChart = (): SingleFilter => {
		const orderedFilters = this.state.currentFilters.getOrderedFilters();
		const looseFilters = ChartsViewUtils.getLooseDimensions(this.state.currentFilters);
		return looseFilters.length ? looseFilters.pop() : orderedFilters.pop();
	};

	preProcess = (): void => {
		if (this.props.data === null) return;
		if (this.props.metadata == null) return;

		const arrays = this.props.data;
		const data = this.state.data;
		const layout = this.state.layout;
		const metaData = this.props.metadata;

		let message = '';
		data.selectedpoints = null;
		data.x = [];
		data.y = [];
		data.marker.color = [];
		let showGraph = false;
		const filter = this.getDimensionsForChart();
		let currentCellType = null;
		if (ChartsViewUtils.getLooseDimensionsCount(this.state.currentFilters) !== 1) {
			message = 'Please select at least one filter.';
		} else if (filter && this.props.data.length) {
			showGraph = true;
			currentCellType = filter.type;
			const lastFilterType = metaData[currentCellType];
			layout.xaxis.title = lastFilterType.label;
			// For every data entry  push the values and names into the plot data.
			arrays.forEach((row) => {
				data.x.push(row[lastFilterType.key].toString());
				data.y.push(row[SCORE_KEY]);
				data.marker.color.push(row[SCORE_KEY]);
			});
		} else {
			message = 'There is no data matching the given filters. Please choose other filters.';
		}

		this.setState({ data: data, showGraph: showGraph, message: message, currentCellType: currentCellType }, () =>
			this.draw(),
		);
	};

	draw = (): void => {
		if (!this.state.showGraph) return;
		const layout = this.state.layout;
		layout.width = this.currentParentWidth();
		layout.height = this.currentParentHeight();
		if (this.state.graphLoaded) {
			Plotly.redraw(this.barChart.current, [this.state.data], layout, this.state.config);
		} else {
			Plotly.newPlot(this.barChart.current, [this.state.data], layout, this.state.config);
			const bc = (this.barChart.current as unknown) as PlotlyHTMLElement;
			// add event handlers: if a user clicks the chart, or selects a range by rect
			bc.on('plotly_click', (event) => {
				this.onPlotlyClick(event);
			});
			bc.on('plotly_selected', (event) => {
				this.onPlotlySelected(event);
			});
			this.setState({ graphLoaded: true });
		}
	};

	/** Once a user has clicked a bar, a filter of the current dimension,
	 * 	specified to the value of the clicked bar, is emitted. */
	onPlotlyClick = (event: Readonly<Plotly.PlotMouseEvent>): void => {
		if (!event || !event.points || event.points.length !== 1) return;
		const x = (event.points[0].x as unknown) as Value;
		const filters: FilterParameter = new FilterParameter();
		filters.addFilter(this.state.currentCellType, x);
		this.props.onSelection(filters);
	};

	/** Once a user has selected a rectangle in the plot, a filter of the current dimension,
	 * 	specified to the values of the selected bars, is emitted. */
	onPlotlySelected = (selection: Readonly<Plotly.PlotSelectionEvent>): void => {
		if (!selection) return;
		const filters: FilterParameter = new FilterParameter();
		if (selection.points && selection.points.length) {
			const selectedBars = selection.points.map((p) => p.x as Value);
			if (selectedBars.length >= 2) {
				const rangeFilter = {
					from: selectedBars[0] as Value,
					to: selectedBars[selectedBars.length - 1] as Value,
				};
				filters.addFilter(this.state.currentCellType, rangeFilter);
			} else {
				filters.addFilter(this.state.currentCellType, selectedBars);
			}
		}
		this.props.onSelection(filters);
	};

	constructor(props: ChartProps) {
		super(props);
		this.state = initialState();
		this.barChart = React.createRef();
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
		if (this.barChart.current) Plotly.relayout(this.barChart.current, layoutUpdate);
	};

	render(): JSX.Element {
		return (
			<div>
				<div className={this.state.showGraph ? 'chart' : 'chart d-none'}>
					<div ref={this.barChart} id="barChart" />
				</div>

				<UserInfoMessage
					className={!this.state.showGraph ? 'chart chart-no-data' : 'chart chart-no-data d-none'}
					message={this.state.message}
				/>
			</div>
		);
	}
}

export default BarChart;
