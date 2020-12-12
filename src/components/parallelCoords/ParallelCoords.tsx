import React from 'react';
import './ParallelCoords.css';

import { ParallelCoordsUtils } from './ParallelCoordsUtils';
import { FilterOutOfRangeError } from '../../errors/FilterOutOfRangeError';
import { FaArrowDown, FaArrowUp, FaUndo } from 'react-icons/fa';

import { SCORE_KEY } from '../../helpers/constants';
import { CellTypes } from '../../enums/cellTypes.enum';
import { initialState, ParallelCoordsState } from './ParallelCoordsState';
import { ParallelCoordsProps } from './ParallelCoordsProps';
import { Button, OverlayTrigger, Tooltip, Alert, Row, Col } from 'react-bootstrap';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Plotly = require('plotly.js-dist');

class ParallelCoords extends React.Component<ParallelCoordsProps, ParallelCoordsState> {
	parCoords: React.RefObject<HTMLDivElement>;
	/**
	 * This method is called each time the Root component has updated the properties.
	 * If the data has changed, the component will pre-process the data for parallel coordinates plot usage.
	 * If only filters have changed, it will only apply filters on the data, to save run-time.
	 * @param prevProps Previous component properties. Important for change detection.
	 */
	componentDidUpdate(prevProps: ParallelCoordsProps): void {
		// filters AND data have changed
		if (prevProps.filters !== this.props.filters && prevProps.data !== this.props.data) {
			this.setState({ currentFilters: this.props.filters.clone() }, () => this.preProcess());
		}
		// only data has changed
		else if (prevProps.data !== this.props.data) {
			this.preProcess();
		}
		// only filters have changed
		else if (prevProps.filters !== this.props.filters) {
			this.setState({ currentFilters: this.props.filters.clone() }, () => this.filterData());
		}
	}
	/**
	 * Filters the data. Only call this once filters (but not data) have changed.
	 */
	filterData = (): void => {
		const data = this.state.data;
		this.getDimensionLabels().forEach((label) => {
			const cellType = this.cellTypeForLabel(label);
			const filters = this.state.currentFilters.getFiltersByCelltype(cellType);
			const dimension = data.dimensions.find((d) => d.label == label);
			if (!dimension) return;
			const dataType = this.props.metadata[cellType.toString()].type;
			dimension.constraintrange = ParallelCoordsUtils.getConstraintRange(dataType, dimension, filters);
		});

		this.setModifiedData(data);
	};

	/**
	 * Retrieve cell type from meta data object by passing the related label.
	 * @param label The label of the dimension.
	 */
	cellTypeForLabel = (label: string): CellTypes => {
		const cellTypeStr = Object.keys(this.props.metadata).find((m) => this.props.metadata[m].label === label);
		return cellTypeStr != undefined ? (parseInt(cellTypeStr) as CellTypes) : undefined;
	};

	/**
	 * Pre-process the new data according to the Plotly-specific format for parallel coordinate plots.
	 * If filters are set, they will also be applied within this method.
	 */
	preProcess = (): void => {
		if (this.props.data == null) return;

		const rows = this.props.data;
		const data = this.state.data;
		data.dimensions = [];
		data.line.color = ParallelCoordsUtils.unpack(rows, SCORE_KEY);

		const metadata = this.props.metadata;

		try {
			this.getDimensionLabels().forEach((label) => {
				const cellType = this.cellTypeForLabel(label);
				const filters = this.state.currentFilters.getFiltersByCelltype(cellType);
				const dimensionInfo = metadata[cellType.toString()];
				const dimension = this.isWildcard(cellType)
					? ParallelCoordsUtils.convertToWildcard(rows, dimensionInfo, cellType)
					: ParallelCoordsUtils.convertDimension(rows, dimensionInfo, cellType, filters);
				data.dimensions.push(dimension);
			});

			this.setState({ filtersMatch: true }, () => this.setModifiedData(data));
		} catch (e) {
			if (e instanceof FilterOutOfRangeError)
				this.setState({ filtersMatch: false, graphLoaded: false, errorMessage: e.message });
			console.error(e.message);
		}
	};

	/**
	 * Initialize component. Default state is defined in external file.
	 * @param props The component props.
	 */
	constructor(props: ParallelCoordsProps) {
		super(props);
		console.log(props);
		this.state = initialState();
		this.parCoords = React.createRef();
	}

	/**
	 * Returns true if a dimension is requested. If not, it will be handled as "*" dimension.
	 * @param activeFilters Array of filters from props.
	 * @param dimension Cell type of given dimension.
	 */
	isWildcard = (dimension: CellTypes): boolean => {
		const activeFilterCellTypes = this.state.currentFilters.getAllCelltypes();
		return activeFilterCellTypes.length > 0 && activeFilterCellTypes.indexOf(dimension) === -1;
	};

	/**
	 * Draw the actual plot. For performance reasons, it will newly draw the plot on the first time.
	 * After each update, only the redraw function from Plotly is called.
	 */
	draw = (): void => {
		if (!this.state.filtersMatch) return;
		if (this.state.graphLoaded) {
			Plotly.redraw(this.parCoords.current, [this.state.data], 0);
		} else {
			Plotly.newPlot(this.parCoords.current, [this.state.data], this.state.layout, this.state.config);
			(this.parCoords.current as any).on('plotly_restyle', (event) => {
				this.onPlotlyRestyle(event);
			});
			this.setState({ graphLoaded: true });
		}
	};

	/**
	 * This event handler is called once a user has dragged one of the axis in the parallel coords plot.
	 * Important for e.g. controlling the sort button order!
	 * @param event The restyle event with payload.
	 */
	onPlotlyRestyle = (event): void => {
		if (event && event instanceof Array && event.length && event[0].dimensions) {
			const orderedDimensionLabels = event[0].dimensions[0].map((d) => d.label);
			this.setState({ orderedDimensionLabels, customDimensionOrder: true });
		}
	};

	/**
	 * Once the user has clicked a sort button, this click handler will reverse the internal order of the axis.
	 * @param label The label of the dimension to be sorted.
	 */
	sortDimension = (label: string): void => {
		const data = this.state.data;

		data.dimensions = data.dimensions.map((d) => {
			if (d.label !== label) return d;
			return {
				...d,
				range: [d.range[1], d.range[0]],
			};
		});

		this.setState({ data: data }, () => this.draw());
	};

	/**
	 * Get the labels of all dimensions. Initially, it will return the labels in the order they occur in the
	 * metadata props object. Once a filter is applied or an axis is dragged by the user, it will return the
	 * custom order of dimensions.
	 */
	getDimensionLabels = (): Array<string> => {
		if (this.state.orderedDimensionLabels && this.state.orderedDimensionLabels.length > 0) {
			return this.state.orderedDimensionLabels;
		} else {
			return Object.keys(this.props.metadata).map((m) => this.props.metadata[m].label);
		}
	};

	/**
	 * This function will apply new newly created data and will trigger the actually draw method of plotly.
	 * If the user does not have requested custom ordering, the function sorts the dimension in the same order
	 * the filters are configured.
	 * @param data Already pre-processed data structure for Plotly parallel coords.
	 */
	setModifiedData = (data: any): void => {
		const activeFilters = [];
		this.state.currentFilters.getOrderedFilters().forEach((f) => {
			if (activeFilters.indexOf(f.type) === -1) activeFilters.push(f.type);
		});
		if (!this.state.customDimensionOrder) {
			activeFilters.reverse().forEach((f) => {
				data.dimensions.sort((a, b) =>
					(a.type as number) === (f as number) ? -1 : (b.type as number) === (f as number) ? 1 : 0,
				);
			});
			const labels = data.dimensions.map((d) => d.label);
			this.setState({ data, orderedDimensionLabels: labels }, this.draw);
		} else {
			this.setState({ data: data }, this.draw);
		}
	};

	/**
	 * Create sort buttons dynamically for each dimension.
	 */
	createButtons = (): JSX.Element[] => {
		const buttons = [];

		if (!this.state.graphLoaded) return buttons;

		const dimLabels = this.getDimensionLabels();

		dimLabels.forEach((label) => {
			const dimension = this.state.data.dimensions.find((d) => d.label == label);
			const ascendingOrder = dimension && dimension.range[0] <= dimension.range[1];
			buttons.push(
				<Col className="btn-column" key={`col-${label}`}>
					<OverlayTrigger
						placement="top"
						delay={{ show: 250, hide: 400 }}
						overlay={this.renderTooltip(`Reverse order`)}
					>
						<span>
							<Button
								variant="link"
								disabled={this.isWildcard(dimension.type)}
								key={label}
								onClick={() => this.sortDimension(label)}
							>
								{ascendingOrder ? <FaArrowUp /> : <FaArrowDown />}
							</Button>
						</span>
					</OverlayTrigger>
				</Col>,
			);
		});

		return buttons;
	};

	/**
	 * Once a user has clicked the reset button, the dimensions are ordered in the way they are in the filters.
	 * The function sets the relevant boolean flag to "false".
	 */
	resetCustomDimensionOrder = () => {
		this.setState(
			{
				customDimensionOrder: false,
			},
			() => {
				this.setModifiedData(this.state.data);
			},
		);
	};

	/**
	 * Renders tooltip with custom message.
	 * @param message The tooltip message.
	 */
	renderTooltip = (message: string): JSX.Element => <Tooltip id="button-tooltip">{message}</Tooltip>;

	render(): JSX.Element {
		return (
			<div className="coords">
				<div className={this.state.filtersMatch ? '' : 'hide-plot'}>
					<OverlayTrigger
						placement="right"
						delay={{ show: 250, hide: 400 }}
						overlay={this.renderTooltip(`Reset custom ordering`)}
					>
						<span>
							<Button
								variant="link"
								onClick={this.resetCustomDimensionOrder}
								disabled={!this.state.customDimensionOrder}
							>
								<FaUndo></FaUndo>
							</Button>
						</span>
					</OverlayTrigger>
					<Row className="btn-container">{this.createButtons()}</Row>
					<div ref={this.parCoords} id={this.state.plotContainerName}></div>
				</div>
				<Alert show={!this.state.filtersMatch} variant="warning">
					<Alert.Heading>Warning</Alert.Heading>
					<p>{this.state.errorMessage}</p>
				</Alert>
			</div>
		);
	}
}

export default ParallelCoords;
