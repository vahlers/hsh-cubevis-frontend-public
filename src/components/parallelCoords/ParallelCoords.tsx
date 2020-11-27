import React from 'react';
import './ParallelCoords.css';
import { Dots } from 'react-activity';
import 'react-activity/dist/react-activity.css';
import { convertDimension, unpack, convertToWildcard } from '../../helpers/helpers';
import { SCORE_KEY, SCORE_MIN, SCORE_MAX } from '../../helpers/constants';
import { CellTypes } from '../../enums/cellTypes.enum';
import { Filter } from '../../models/filter.model';
import { Dimension, NominalDimension } from '../../models/dimension.model';
import { DataType } from '../../enums/dataType.enum';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Plotly = require('plotly.js-dist');

type ParCoordProps = {
	data: Array<Record<string, number | string>>;
	metadata: { [id: string]: { key: string; label: string; type: string } };
	filters: Filter[];
};

type ParCoordState = {
	data: {
		type: string;
		line: {
			color: any;
			showscale: boolean;
			colorscale: Array<Array<string>>;
			cmin: number;
			cmax: number;
		};
		dimensions: Dimension[];
	};

	layout: {
		margin: {
			l: number;
			r: number;
			b: number;
			t: number;
			pad: number;
		};
		height: number;
	};
	config: {
		responsive: boolean;
	};
	graphIsLoading: boolean;
	graphLoaded: boolean;
};

class ParallelCoords extends React.Component<ParCoordProps, ParCoordState> {
	componentDidUpdate(prevProps: ParCoordProps): void {
		// filters AND data have changed
		if (prevProps.filters !== this.props.filters && prevProps.data !== this.props.data) {
			this.preProcess();
		}
		// only data has changed
		else if (prevProps.data !== this.props.data) {
			this.preProcess();
		}
		// only filters have changed
		else if (prevProps.filters !== this.props.filters) {
			this.filterData();
		}
	}

	filterData = (): void => {
		const data = this.state.data;
		const metaData = this.props.metadata;
		Object.keys(metaData).forEach((dim) => {
			const filter = this.getFilterValues(dim);
			const dimension = data.dimensions.find((d) => d.label == metaData[dim].label);
			if (filter) {
				let filterVal;
				switch (metaData[dim].type) {
					case DataType.NUMERIC:
						filterVal = filter.value as number;
						break;
					case DataType.IP:
					case DataType.NOMINAL:
					case DataType.ORDINAL:
					default:
						filterVal = (dimension as NominalDimension).map[filter.value as string];
						break;
				}
				dimension.constraintrange = [filterVal, filterVal];
			} else {
				dimension.constraintrange = [];
			}
		});

		this.setState({ data: data }, () => this.draw());
	};

	preProcess = (): void => {
		if (this.props.data == null) return;

		const rows = this.props.data;
		const data = this.state.data;
		data.dimensions = [];
		data.line.color = unpack(rows, SCORE_KEY);

		const metaData = this.props.metadata;

		const activeFilters = this.activeFilters();
		Object.keys(metaData).forEach((dim) => {
			const filter = this.getFilterValues(dim);
			const dimension = this.isWildcard(activeFilters, dim)
				? convertToWildcard(rows, metaData[dim].key, metaData[dim].label)
				: convertDimension(rows, metaData[dim], filter);
			data.dimensions.push(dimension);
		});

		this.setState({ data: data }, () => this.draw());
	};

	constructor(props: ParCoordProps) {
		super(props);
		this.state = {
			data: {
				type: 'parcoords',
				line: {
					color: null,
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
				dimensions: [],
			},

			layout: {
				margin: {
					l: 80,
					r: 10,
					b: 20,
					t: 50,
					pad: 0,
				},
				height: 450,
			},
			config: {
				responsive: true,
			},
			graphIsLoading: false,
			graphLoaded: false,
		};
	}

	enableActivityIndicator = (): void => {
		this.setState({ graphIsLoading: true });
	};

	disableActivityIndicator = (): void => {
		this.setState({ graphIsLoading: false });
	};

	activeFilters = (): Array<CellTypes> => {
		const activeFilters = [];
		this.props.filters.map((f) => {
			if (f) activeFilters.push(f.type);
		});
		return activeFilters;
	};

	getFilterValues = (dim: string): Filter => {
		const filters = this.props.filters.filter((f) => {
			return f.type === parseInt(dim);
		});
		return filters !== null ? filters[0] : null;
	};

	isWildcard = (activeFilters: Array<CellTypes>, dimension: string): boolean => {
		return activeFilters.length > 0 && activeFilters.indexOf(parseInt(dimension)) === -1;
	};

	draw = (): void => {
		if (this.state.graphLoaded) {
			console.log('Redrawing component ...');
			Plotly.redraw(document.getElementById('parCoord'), [this.state.data], 0);
		} else {
			console.log('Drawing component ...');
			Plotly.newPlot('parCoord', [this.state.data], this.state.layout, this.state.config);
			this.setState({ graphLoaded: true });
		}
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

	render(): JSX.Element {
		return (
			<div className="coords">
				<div id="parCoord"></div>
			</div>
		);
	}
}

export default ParallelCoords;
