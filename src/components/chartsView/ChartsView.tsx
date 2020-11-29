import React, { Component } from 'react';
import { CubeCellModel } from '../../models/cell.model';
import { Filter } from '../../models/filter.model';
import { SCORE_KEY, SCORE_MIN, SCORE_MAX } from '../../helpers/constants';
import './ChartsView.css';

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
	};
	config: {
		responsive: boolean;
	};
	graphIsLoading: boolean;
	graphLoaded: boolean;
	showGraph: boolean;
};

class ChartsView extends React.Component<ChartProps, ChartState> {
	componentDidUpdate(prevProps: ChartProps): void {
		// If something changed
		if (prevProps.filters !== this.props.filters || prevProps.data !== this.props.data) {
			this.preProcess();
		}
	}

	preProcess = (): void => {
		if (this.props.data === null) return;

		const arrays = this.props.data;
		const data = this.state.data;
		const metaData = this.props.metadata;

		data.x = [];
		data.y = [];
		data.marker.color = [];
		let showGraph = false;
		console.log('filters', this.props.filters);
		console.log('dataToShow', this.props.data);
		if (this.props.filters.length > 0 && this.props.data.length > 0) {
			showGraph = true;
			for (let i = 0; i < arrays.length; i++) {
				const lastFilterType = metaData[this.props.filters[this.props.filters.length - 1].type];
				data.x.push(arrays[i][lastFilterType.key].toString());
				data.y.push(arrays[i]['anomalyScore']);
				data.marker.color.push(this.props.data[i]['anomalyScore']);
			}
		}

		this.setState({ data: data, showGraph: showGraph }, () => this.draw());
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
					b: 80,
					t: 0,
					pad: 0,
				},
				height: '380',
				autosize: true,
				xaxis: {
					title: 'cells',
				},
			},
			config: {
				responsive: true,
			},
			showGraph: false,
			graphIsLoading: false,
			graphLoaded: false,
		};

		this.draw = this.draw.bind(this);
	}

	enableActivityIndicator = (): void => {
		this.setState({ graphIsLoading: true });
	};

	disableActivityIndicator = (): void => {
		this.setState({ graphIsLoading: false });
	};

	getFilterValues = (dim: string): Filter => {
		const filters = this.props.filters.filter((f) => {
			return f.type === parseInt(dim);
		});
		return filters !== null ? filters[0] : null;
	};

	draw = (): void => {
		console.log(this.state.showGraph);
		if (this.state.showGraph) {
			console.log('Drawing component ...');
			Plotly.react('barChart', [this.state.data], this.state.layout, this.state.config);
			this.setState({ graphLoaded: true });
		} else {
			if (this.state.graphLoaded) {
				Plotly.purge('barChart');
				const message = document.createElement('div');
				message.setAttribute('style', 'text-align: center; margin-top: 2em;');
				const icon = document.createElement('div');
				const head = document.createElement('h5');
				const body = document.createElement('div');
				icon.className = 'glyphicon glyphicon-cloud';
				head.innerHTML = 'No Data';
				body.innerHTML =
					'There is no date for your current Selection. Please Chose another dimension or filtervalue';
				message.appendChild(icon);
				message.appendChild(head);
				message.appendChild(body);
				document.getElementById('barChart').appendChild(message);
				this.setState({ graphLoaded: false });
			}
		}
	};

	render(): JSX.Element {
		//<h1>ChartView</h1>
		return (
			<div className="chart">
				<div id="barChart" />
			</div>
		);
	}
}

export default ChartsView;
