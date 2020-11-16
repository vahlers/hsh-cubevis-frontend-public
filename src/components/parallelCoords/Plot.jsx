import React, { Component } from 'react';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Plotly = require('plotly.js-dist');

class Plot extends React.Component {
	constructor(props) {
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

	componentDidUpdate(prevProps) {
		if (this.state.graphLoaded) {
			Plotly.redraw(document.getElementById('parCoord'), [this.props.data], 0);
		} else {
			Plotly.newPlot('parCoord', [this.props.data], this.state.plotConfig.layout);
			this.setState({ graphLoaded: true });
		}
	}

	// Use bootstrap classes
	render() {
		return <div id="parCoord"></div>;
	}
}

Plot.propTypes = {
	data: Array,
};

export default Plot; // Don’t forget to use export default!
