import React from 'react';

import { Dots } from 'react-activity';
import 'react-activity/dist/react-activity.css';

import { convertToNominal, convertToNumeric, unpack } from '../../helpers/helpers.js';
import './ParallelCoords.css';

import Plot from './Plot';
import { SCORE_KEY, SCORE_MIN, SCORE_MAX } from '../../helpers/constants';
class ParallelCoords extends React.Component {
	componentDidUpdate(prevProps) {
		if (prevProps.data !== this.props.data) this.preProcess();
	}

	// once new props came into the component, the data has to be preprocessed.
	// afterwards it is published to the child component
	preProcess() {
		if (this.props.data == null) return;

		const rows = this.props.data;
		const data = this.state.data;
		data.dimensions = [];
		data.line.color = unpack(rows, SCORE_KEY);

		const metaData = this.props.metadata;

		// loop over dimensions and preprocess each of it, depending on type (numeric, nominal)
		Object.keys(metaData).forEach((dim) => {
			if (metaData[dim].type === 'nominal') {
				data.dimensions.push(convertToNominal(rows, dim, metaData[dim].label));
			} else {
				data.dimensions.push(convertToNumeric(rows, dim, metaData[dim].label));
			}
		});
		this.setState({ data: data });
	}

	constructor(props) {
		super(props);
		this.state = {
			data: {
				type: 'parcoords',
				line: {
					showscale: true,
					colorscale: [
						['0.0', '#00ff00'],
						['0.33', '#FBFF31'],
						['0.66', '#EB9A65'],
						['1.0', '#ff0000'],
					],
					cmin: SCORE_MIN,
					cmax: SCORE_MAX,
				},
			},
			graphIsLoading: false,
		};
	}
	enableActivityIndicator = () => {
		this.setState({ graphIsLoading: true });
	};
	disableActivityIndicator = () => {
		this.setState({ graphIsLoading: false });
	};

	// /*** BUTTON HANDLERS ***/
	// sortDimensions = (event) => {
	// 	let dimensions = this.state.data.dimensions;
	// 	// sort dimension positions by their name (desc)
	// 	dimensions = dimensions.sort((a, b) => (a.label < b.label ? 1 : -1));
	// 	this.updateGraph(dimensions);
	// };
	// updateGraph = (dimensions) => {
	// 	const data = this.state.data;
	// 	data.dimensions = dimensions;

	// 	this.setState({ data: data }, () => {
	// 		const graphDiv = document.getElementById('parCoord');
	// 		Plotly.redraw(graphDiv, [this.state.data], 0);
	// 	});
	// };
	// setPortLimit = () => {
	// 	let dimensions = this.state.data.dimensions;
	// 	// set source port upper bound to specified integer
	// 	dimensions = dimensions.map((d) => ({
	// 		...d,
	// 		constraintrange:
	// 			d.label === 'source.port' ? [this.state.minSourcePort, this.state.maxSourcePort] : d.constraintrange,
	// 	}));
	// 	this.updateGraph(dimensions);
	// };
	// sortAxis = () => {
	// 	let dimensions = this.state.data.dimensions;
	// 	// sort every axis ascending internally
	// 	dimensions = dimensions.map((d) => {
	// 		const { ticktext, tickvals } = d;
	// 		if (!ticktext || !tickvals) return d;
	// 		let objects = ticktext.map((text, idx) => ({
	// 			text: text,
	// 			val: tickvals[idx],
	// 		}));
	// 		objects = objects.sort((a, b) => (a.text > b.text ? -1 : 1));
	// 		const values = d.values.map((v) => objects.findIndex((o) => o.val === v));
	// 		return {
	// 			...d,
	// 			ticktext: objects.map((o) => o.text),
	// 			values: values,
	// 		};
	// 	});
	// 	this.updateGraph(dimensions);
	// };
	// showIPs = () => {
	// 	let dimensions = this.state.data.dimensions;
	// 	dimensions = dimensions.map((d) => ({
	// 		...d,
	// 		visible: this.state.ipsVisible && d.label.includes('ip') ? false : true,
	// 	}));
	// 	this.setState({ ipsVisible: !this.state.ipsVisible });
	// 	this.updateGraph(dimensions);
	// };

	render() {
		return (
			<div className="col coords-container">
				{this.state.graphIsLoading ? (
					<div>
						<p>Loading...</p>
						<Dots />
					</div>
				) : (
					<Plot data={this.state.data}></Plot>
				)}
			</div>
		);
	}
}

ParallelCoords.propTypes = {
	data: Array,
	metadata: Object,
};

export default ParallelCoords;
