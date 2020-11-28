import React from 'react';
import './ParallelCoords.css';
import { Dots } from 'react-activity';
import 'react-activity/dist/react-activity.css';

import { ParallelCoordsUtils } from './ParallelCoordsUtils';
import { FilterOutOfRangeError } from '../../errors/FilterOutOfRangeError';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';

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
	filtersMatch: boolean;
	plotContainerName: string;
	errorMessage: string;
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
		data.line.color = ParallelCoordsUtils.unpack(rows, SCORE_KEY);

		const metaData = this.props.metadata;

		const activeFilters = this.activeFilters();

		try {
			Object.keys(metaData).forEach((dim) => {
				const filter = this.getFilterValues(dim);
				const dimension = this.isWildcard(activeFilters, dim)
					? ParallelCoordsUtils.convertToWildcard(rows, metaData[dim].label)
					: ParallelCoordsUtils.convertDimension(rows, metaData[dim], filter);
				data.dimensions.push(dimension);
			});

			this.setState({ data: data, filtersMatch: true }, () => this.draw());
		} catch (e) {
			if (e instanceof FilterOutOfRangeError)
				this.setState({ filtersMatch: false, graphLoaded: false, errorMessage: e.message });
			console.error(e.message);
		}
	};

	constructor(props: ParCoordProps) {
		super(props);
		this.state = {
			plotContainerName: 'par-coord',
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
				height: 350,
			},
			config: {
				responsive: true,
			},
			graphIsLoading: false,
			graphLoaded: false,
			filtersMatch: true,
			errorMessage: '',
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
		if (!this.state.filtersMatch) return;
		if (this.state.graphLoaded) {
			console.log('Redrawing component ...');
			Plotly.redraw(document.getElementById(this.state.plotContainerName), [this.state.data], 0);
		} else {
			console.log('Drawing component ...');
			Plotly.newPlot(this.state.plotContainerName, [this.state.data], this.state.layout, this.state.config);
			this.setState({ graphLoaded: true });
		}
	};

	sortDimension = (dimension: { label: string }): void => {
		const data = this.state.data;

		data.dimensions = data.dimensions.map((d) => {
			if (d.label !== dimension.label) return d;
			return {
				...d,
				range: [d.range[1], d.range[0]],
			};
		});

		this.setState({ data: data }, () => this.draw());
	};

	createButtons = (): JSX.Element[] => {
		const buttons = [];

		if (!this.state.graphLoaded) return buttons;

		Object.keys(this.props.metadata).forEach((m) => {
			const dimLabel = this.props.metadata[m].label;
			const dimension = this.state.data.dimensions.find((d) => d.label == dimLabel);
			let ascendingOrder = true;
			if (dimension && dimension.range[0] > dimension.range[1]) {
				ascendingOrder = false;
			}
			buttons.push(
				<button
					disabled={this.isWildcard(this.activeFilters(), m)}
					key={m}
					className="btn btn-primary add-step-btn m-2"
					onClick={() => this.sortDimension(this.props.metadata[m])}
				>
					{ascendingOrder ? <FaArrowUp className="m-2" /> : <FaArrowDown className="m-2" />}
					{dimLabel}
				</button>,
			);
		});

		return buttons;
	};

	render(): JSX.Element {
		return (
			<div className="coords">
				<div id={this.state.plotContainerName} className={this.state.filtersMatch ? '' : 'hide-plot'}></div>
				<div className={this.state.filtersMatch ? 'sort-buttons' : 'hide-plot'}>{this.createButtons()}</div>
				{this.state.filtersMatch ? null : <h1 className="no-match">{this.state.errorMessage}</h1>}
			</div>
		);
	}
}

export default ParallelCoords;
