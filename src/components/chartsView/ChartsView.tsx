import React, { Component } from 'react';
import { CubeCellModel } from '../../models/cell.model';
import { Filter } from '../../models/filter.model';
import './ChartsView.css';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Plotly = require('plotly.js-dist');

type ChartProps = {
	data: CubeCellModel[];
	filters: Filter[];
};

type ChartState = {
	data: {
		name: string;
		type: string;
		x: any[];
		y: any[];
		marker: {
			color: any[];
			colorscale: Array<Array<string>>;
			cauto: true;
			showscale: true;
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
	graphIsLoading: boolean;
	graphLoaded: boolean;
};

class ChartsView extends React.Component<ChartProps, ChartState> {
	componentDidUpdate(prevProps: ChartProps): void {
		// If something changed
		if (prevProps.filters !== this.props.filters || prevProps.data !== this.props.data) {
			this.preProcess();
		} else {
			if (this.state.graphLoaded) {
				console.log('Redrawing component ...');
				Plotly.redraw(document.getElementById('barChart'), [this.state.data], 0);
			}
		}
	}

	preProcess = (): void => {
		if (this.props.data === null) return;
		console.log(this.props.data);
		const arrays = this.props.data;
		const data = this.state.data;
		data.x = [];
		data.y = [];
		data.marker.color = [];

		for (let i = 0; i < arrays.length; i++) {
			data.x.push(i);
			data.y.push(arrays[i]['anomalyScore']);
			data.marker.color.push(this.props.data[i]['anomalyScore']);
		}

		this.setState({ data: data }, () => this.draw());
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
					cauto: true,
					colorscale: [
						['0.0', '#00ff00'],
						['0.33', '#FBFF31'],
						['1.0', '#ff0000'],
					],
					showscale: true,
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
		if (this.state.graphLoaded) {
			console.log('Redrawing component ...');
			console.log(this.state.data);
			Plotly.redraw(document.getElementById('barChart'), [this.state.data], 0);
		} else {
			console.log('Drawing component ...');
			console.log(this.state.data);
			Plotly.newPlot('barChart', [this.state.data], this.state.layout);
			this.setState({ graphLoaded: true });
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
