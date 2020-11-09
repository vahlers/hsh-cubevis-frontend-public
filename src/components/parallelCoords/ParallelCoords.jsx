import React from 'react';
import Select from 'react-select';
import { Dots } from 'react-activity';
import 'react-activity/dist/react-activity.css';
import { activeWildCard, convertToNominal, convertAnomalyScore, convertToNumeric } from '../../helpers/helpers.js';
import './ParallelCoords.css';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Plotly = require('plotly.js-dist');

import MySlider from './RangeSlider';

class ParallelCoords extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			data: {},
			minSourcePort: 0,
			maxSourcePort: 65535,
			ipsVisible: true,
			slider: <MySlider action={this.sliderChange} />,
			options: [
				{
					value: './data/(_, destination.ip, _, _, network.protocol, _, _).csv',
					label: '_, destination.ip, _, _, network.protocol, _, _',
				},
				{
					value:
						'./data/(source.ip, destination.ip, source.port, destination.port, network.protocol, network.transport, Argus.transaction.state).csv',
					label:
						'source.ip, destination.ip, source.port, destination.port, network.protocol, network.transport, Argus.transaction.state',
				},
				{
					value: './data/(source.ip, destination.ip, _, _, _, _, _).csv',
					label: 'source.ip, destination.ip, _, _, _, _, _',
				},
				{
					value: './data/(_, destination.ip, _, destination.port, network.protocol, _, _).csv',
					label: '_, destination.ip, _, destination.port, network.protocol, _, _',
				},
			],
			selectedCube: './data/(source.ip, destination.ip, _, _, _, _, _).csv',
			graphIsLoading: false,
			plotConfig: {
				coloringScheme: [
					['0.0', '#00ff00'],
					['0.33', '#FBFF31'],
					['0.66', '#EB9A65'],
					['1.0', '#ff0000'],
				],
				numericalDimensions: ['destination.port', 'source.port'],
				nominalDimensions: [
					'network.protocol',
					'network.transport',
					'Argus.transaction.state',
					'destination.ip',
					'source.ip',
				],
				colorScaleDimension: 'count_z_score',
			},
		};
	}
	disableActivityIndicator = () => {
		this.setState({ graphIsLoading: false });
	};
	plotGraph = () => {
		console.log('Plotting graph for file:', this.state.selectedCube);
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const component = this;
		const { plotConfig } = component.state;
		Plotly.d3.csv(component.state.selectedCube, (rows) => {
			const data = {
				type: 'parcoords',
				line: {
					showscale: true,
					colorscale: plotConfig.coloringScheme,
					cmin: 0.0,
					cmax: 10.0,
					color: convertAnomalyScore(rows, plotConfig.colorScaleDimension),
				},
				dimensions: [],
			};

			plotConfig.numericalDimensions.forEach((dim) => {
				if (!activeWildCard(rows, dim)) {
					data.dimensions.push(convertToNumeric(rows, dim));
				}
			});

			plotConfig.nominalDimensions.forEach((dim) => {
				if (!activeWildCard(rows, dim)) {
					data.dimensions.push(convertToNominal(rows, dim));
				}
			});

			const layout = {
				height: 800,
			};
			Plotly.newPlot('parCoord', [data], layout);

			component.setState({ data: data });
			component.disableActivityIndicator();
		});
	};
	/*** BUTTON HANDLERS ***/
	sortDimensions = (event) => {
		let dimensions = this.state.data.dimensions;
		// sort dimension positions by their name (desc)
		dimensions = dimensions.sort((a, b) => (a.label < b.label ? 1 : -1));
		this.updateGraph(dimensions);
	};
	updateGraph = (dimensions) => {
		const data = this.state.data;
		data.dimensions = dimensions;

		this.setState({ data: data }, () => {
			const graphDiv = document.getElementById('parCoord');
			Plotly.redraw(graphDiv, [this.state.data], 0);
		});
	};
	setPortLimit = () => {
		let dimensions = this.state.data.dimensions;
		// set source port upper bound to specified integer
		dimensions = dimensions.map((d) => ({
			...d,
			constraintrange:
				d.label === 'source.port' ? [this.state.minSourcePort, this.state.maxSourcePort] : d.constraintrange,
		}));
		this.updateGraph(dimensions);
	};
	sortAxis = () => {
		let dimensions = this.state.data.dimensions;
		// sort every axis ascending internally
		dimensions = dimensions.map((d) => {
			const { ticktext, tickvals } = d;
			if (!ticktext || !tickvals) return d;
			let objects = ticktext.map((text, idx) => ({
				text: text,
				val: tickvals[idx],
			}));
			objects = objects.sort((a, b) => (a.text > b.text ? -1 : 1));
			const values = d.values.map((v) => objects.findIndex((o) => o.val === v));
			return {
				...d,
				ticktext: objects.map((o) => o.text),
				values: values,
			};
		});
		this.updateGraph(dimensions);
	};
	showIPs = () => {
		let dimensions = this.state.data.dimensions;
		dimensions = dimensions.map((d) => ({
			...d,
			visible: this.state.ipsVisible && d.label.includes('ip') ? false : true,
		}));
		this.setState({ ipsVisible: !this.state.ipsVisible });
		this.updateGraph(dimensions);
	};
	handleChange = (selection) => {
		this.setState({ selectedCube: selection.value, graphIsLoading: true }, () => {
			this.plotGraph();
		});
	};
	sliderChange = (payload) => {
		this.setState({
			minSourcePort: payload[0],
			maxSourcePort: payload[1],
		});
	};
	render() {
		return (
			<div>
				<div>
					<p>Min: {this.state.minSourcePort}</p>
					{this.state.slider}
					<p>Max: {this.state.maxSourcePort}</p>
				</div>
				<div className="cv-custom-select">
					<p className="card-header">Please select cube:</p>
					<Select onChange={this.handleChange} options={this.state.options} />
					{this.state.graphIsLoading ? (
						<div>
							<p>Loading {this.state.selectedCube}</p> <Dots />
						</div>
					) : null}
				</div>
				<div className="btn-group">
					<button className="btn btn-primary m-2" onClick={this.sortDimensions}>
						Sort dimensions
					</button>
					<button className="btn btn-primary m-2" onClick={this.setPortLimit}>
						Set port limit
					</button>
					<button className="btn btn-primary m-2" onClick={this.sortAxis}>
						Sort axis labels
					</button>
					{this.state.ipsVisible ? (
						<button className="btn btn-primary m-2" onClick={this.showIPs}>
							Hide IPs
						</button>
					) : (
						<button className="btn btn-primary m-2" onClick={this.showIPs}>
							Show IPs
						</button>
					)}
				</div>

				<div id="parCoord"></div>
			</div>
		);
	}
}

export default ParallelCoords;
