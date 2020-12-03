import React from 'react';
import { CubeCellModel } from '../../../models/cell.model';
import { Filter } from '../../../models/filter.model';
import { SCORE_MIN, SCORE_MAX } from '../../../helpers/constants';
import '../ChartsView.css';

import { GiMagnifyingGlass } from 'react-icons/gi';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Plotly = require('plotly.js-dist');

type ChartProps = {
	data: CubeCellModel[];
	filters: Filter[];
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
			range: number[];
			fixedrange: boolean;
			autorange: boolean;
		};
	};
	config: {
		responsive: boolean;
	};
	graphIsLoading: boolean;
	graphLoaded: boolean;
	showGraph: boolean;
	message: string;
};

class BarChart extends React.Component<ChartProps, ChartState> {
	componentDidUpdate(prevProps: ChartProps): void {
		// If something changed
		if (prevProps.filters !== this.props.filters || prevProps.data !== this.props.data) {
			this.preProcess();
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
		console.log('filters', this.props.filters);
		console.log('dataToShow', this.props.data);
		if (this.props.filters.length > 0 && this.props.data.length > 0) {
			showGraph = true;
			const lastFilterType = metaData[this.props.filters[this.props.filters.length - 1].type];
			layout.xaxis.title = lastFilterType.label;
			for (let i = 0; i < arrays.length; i++) {
				data.x.push(arrays[i][lastFilterType.key].toString());
				data.y.push(arrays[i]['anomalyScore']);
				data.marker.color.push(this.props.data[i]['anomalyScore']);
			}
		} else if (this.props.filters.length < 1) {
			message = 'Please select at least one Filter';
		} else {
			message = 'There is no data matching the given filters. please choose other filters';
		}

		this.setState({ data: data, showGraph: showGraph, message: message }, () => this.draw());
	};

	draw = (): void => {
		if (this.state.showGraph) {
			console.log('Drawing component ...');
			Plotly.react('barChart', [this.state.data], this.state.layout, this.state.config);
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
					showscale: true,
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
					r: 110,
					b: 150,
					t: 20,
					pad: 0,
				},
				height: '380',
				autosize: true,
				xaxis: {
					title: 'dimension',
				},
				yaxis: {
					range: [0, 10],
					fixedrange: true,
					autorange: false,
				},
			},
			config: {
				responsive: true,
			},
			showGraph: false,
			graphIsLoading: false,
			graphLoaded: false,
			message: '',
		};
	}

	render(): JSX.Element {
		if (this.state.showGraph) {
			return (
				<div className="chart">
					<div id="barChart" />
				</div>
			);
		} else {
			return (
				<div className="chart chart-no-data">
					<GiMagnifyingGlass size={80} />
					<h2>No Data</h2>
					<h5> {this.state.message}</h5>
				</div>
			);
		}
	}
}

export default BarChart;
