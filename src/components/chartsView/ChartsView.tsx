import React, { Component } from 'react';
import PlotlyChart from 'react-plotlyjs-ts';

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
			plot_bgcolor: 'rgb(212,212,212)',
			paper_bgcolor: 'rgb(212,212,212)',
			title: 'simple example',
			xaxis: {
				title: 'time',
			},
		};
		// Use bootstrap classes
		return (
			<div className="col bg-white">
				<div className="row align-items-center h-100">
					<div className="border border-dark">
						<PlotlyChart data={data} layout={layout} />
					</div>
				</div>
				<h2>ChartsView</h2>
			</div>
		);
	}
}

export default ChartsView; // Don’t forget to use export default!
