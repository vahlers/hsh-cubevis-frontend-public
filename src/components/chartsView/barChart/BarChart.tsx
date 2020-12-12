import React from 'react';
import { CubeCellModel } from '../../../models/cell.model';
import { FilterParameter } from '../../../models/filter.model';
import { SCORE_MIN, SCORE_MAX } from '../../../helpers/constants';
import '../ChartsView.css';
import { GiMagnifyingGlass } from 'react-icons/gi';
import ChartsView from '../ChartsView';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Plotly = require('plotly.js-dist');

type ChartProps = {
	data: CubeCellModel[];
	filters: FilterParameter;
	metadata: { [id: string]: { key: string; label: string; type: string } };
};

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
	};

	layout: {
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
		yaxis: {
			title: string;
			range: number[];
			fixedrange: boolean;
			autorange: boolean;
		};
		width: number;
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

class BarChart extends React.Component<ChartProps, ChartState> {
	barChart: React.RefObject<HTMLDivElement>;
	componentDidUpdate(prevProps: ChartProps): void {
		// If something changed
		if (prevProps.filters !== this.props.filters || prevProps.data !== this.props.data) {
			this.setState({ currentFilters: this.props.filters.clone() }, () => this.preProcess());
		}
	}

	preProcess = (): void => {
		if (this.props.data === null) return;
		if (this.props.metadata == null) return;

		const arrays = this.props.data;
		const data = this.state.data;
		const layout = this.state.layout;
		const metaData = this.props.metadata;

		let message = '';
		data.x = [];
		data.y = [];
		data.marker.color = [];
		let showGraph = false;
		const orderedFilters = this.state.currentFilters.getOrderedFilters();
		if (orderedFilters.length && this.props.data.length) {
			showGraph = true;
			const lastFilterType = metaData[orderedFilters.pop().type.toString()];
			layout.xaxis.title = lastFilterType.label;
			for (let i = 0; i < arrays.length; i++) {
				data.x.push(arrays[i][lastFilterType.key].toString());
				data.y.push(arrays[i]['anomalyScore']);
				data.marker.color.push(this.props.data[i]['anomalyScore']);
			}
		} else if (orderedFilters.length < 1) {
			message = 'Please select at least one Filter';
		} else {
			message = 'There is no data matching the given filters. please choose other filters';
		}

		this.setState({ data: data, showGraph: showGraph, message: message }, () => this.draw());
	};

	draw = (): void => {
		if (!this.state.showGraph) return;
		const layout = this.state.layout;
		layout.width = this.currentParentWidth();
		if (this.state.graphLoaded) {
			Plotly.redraw(this.barChart.current, [this.state.data], layout, this.state.config);
		} else {
			Plotly.newPlot('barChart', [this.state.data], layout, this.state.config);
			this.setState({ graphLoaded: true });
		}
	};

	constructor(props: ChartProps) {
		super(props);
		this.state = {
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
			},
			layout: {
				margin: {
					l: 50,
					r: 50,
					b: 150,
					t: 30,
					pad: 0,
				},
				height: '380',
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
		this.barChart = React.createRef();
		window.addEventListener('resize', this.resizeChart);
	}

	currentParentWidth = (): number => {
		return document.getElementById(ChartsView.containerName).clientWidth * 0.95;
	};

	resizeChart = (): void => {
		const layoutUpdate = { width: this.currentParentWidth() };
		if (this.barChart.current) Plotly.relayout(this.barChart.current, layoutUpdate);
	};

	render(): JSX.Element {
		return (
			<div>
				<div className={this.state.graphLoaded ? 'chart' : 'chart hide-chart'}>
					<div ref={this.barChart} id="barChart" />
				</div>
				<div className={!this.state.graphLoaded ? 'chart chart-no-data' : 'chart chart-no-data hide-chart'}>
					<GiMagnifyingGlass size={80} />
					<h2>No Data</h2>
					<h5> {this.state.message}</h5>
				</div>
			</div>
		);
	}
}

export default BarChart;
