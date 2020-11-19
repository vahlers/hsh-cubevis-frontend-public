import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Plotly = require('plotly.js-dist');

type ParCoordPlotProps = {
	data: any;
};

type ParCoordPlotState = {
	plotConfig: {
		layout: {
			height: number;
		};
	};
	graphLoaded: boolean;
};

class Plot extends React.Component<ParCoordPlotProps, ParCoordPlotState> {
	constructor(props: ParCoordPlotProps) {
		super(props);
		this.state = {
			plotConfig: {
				layout: {
					height: 800,
				},
			},
			graphLoaded: false,
		};
	}

	componentDidUpdate(): void {
		if (this.state.graphLoaded) {
			Plotly.redraw(document.getElementById('parCoord'), [this.props.data], 0);
		} else {
			Plotly.newPlot('parCoord', [this.props.data], this.state.plotConfig.layout);
			this.setState({ graphLoaded: true });
		}
	}

	render(): JSX.Element {
		return <div id="parCoord"></div>;
	}
}
export default Plot;
