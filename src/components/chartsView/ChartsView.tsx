import React, { Component } from 'react';
import PlotlyChart from 'react-plotlyjs-ts';
import './ChartsView.css';

class ChartsView extends Component {
	render(): JSX.Element {
		const data = [
			{
				name: 'bar chart example',
				type: 'bar',
				x: [1, 2, 3, 4, 5, 6, 7, 8],
				y: [6, 2, 3, 2, 5, 8, 1, 3],
				marker: {
					color: '#36c73d',
				},
			},
		];
		const layout = {
			margin: {
				t: 0,
				r: 25,
				l: 25,
			},
			xaxis: {
				title: 'time',
			},
		};
		// Use bootstrap classes
		return (
			<div className="col chart-container">
				<h1>ChartView</h1>
				<PlotlyChart data={data} layout={layout} />
			</div>
		);
	}
}

export default ChartsView; // Don’t forget to use export default!
