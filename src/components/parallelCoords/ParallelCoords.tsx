import React from 'react';
import './ParallelCoords.css';

import { ParallelCoordsUtils } from './ParallelCoordsUtils';
import { FilterOutOfRangeError } from '../../errors/FilterOutOfRangeError';
import { FaArrowDown, FaArrowUp, FaUndo } from 'react-icons/fa';

import { SCORE_KEY } from '../../config';
import { CellTypes } from '../../enums/cellTypes.enum';
import { initialState, ParallelCoordsState, ParallelCoordsData } from './ParallelCoordsState';
import { ParallelCoordsProps } from './ParallelCoordsProps';
import { Button, OverlayTrigger, Tooltip, Alert, Row, Col } from 'react-bootstrap';
import { CommonHelper } from '../../helpers/common.helper';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Plotly = require('plotly.js-dist');

class ParallelCoords extends React.Component<ParallelCoordsProps, ParallelCoordsState> {
	parCoords: React.RefObject<HTMLDivElement>;
	rootContainer: React.RefObject<HTMLDivElement>;
	buttonContainer: React.RefObject<HTMLDivElement>;

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
		this.getOrderedCellTypes().forEach((cellType) => {
			const filters = this.state.currentFilters.getFiltersByCelltype(cellType);
			const dimension = data.dimensions.find((d) => d.type === cellType);
			if (!dimension) return;
			const dataType = this.props.metadata[cellType.toString()].type;
			dimension.constraintrange = ParallelCoordsUtils.getConstraintRange(dataType, dimension, filters);
		});

		this.setModifiedData(data);
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
		data.line.color = CommonHelper.unpack(rows, SCORE_KEY);

		try {
			this.getOrderedCellTypes().forEach((cellType) => {
				const filters = this.state.currentFilters.getFiltersByCelltype(cellType);
				const dimensionInfo = this.props.metadata[cellType.toString()];
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
		this.state = initialState();
		this.parCoords = React.createRef();
		this.rootContainer = React.createRef();
		this.buttonContainer = React.createRef();
		window.addEventListener('resize', this.resizeChart);
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
	 * For dynamic resizing.
	 * @returns Height to be set after resizing.
	 */
	getComputedHeight = (): number => {
		return this.rootContainer.current
			? (this.rootContainer.current.clientHeight - this.buttonContainer.current.clientHeight) * 0.85
			: 0;
	};

	/**
	 * For dynamic resizing.
	 * @returns Width to be set after resizing.
	 */
	getComputedWidth = (): number => {
		return this.rootContainer.current ? this.rootContainer.current.clientWidth : 0;
	};

	/**
	 * Event handler, called once the window size changes.
	 * Updates the plot component width and height.
	 */
	resizeChart = (): void => {
		if (!this.state.graphLoaded) return;
		const layoutUpdate = { width: this.getComputedWidth(), height: this.getComputedHeight() };
		if (this.parCoords.current) Plotly.relayout(this.parCoords.current, layoutUpdate);
	};

	/**
	 * Draw the actual plot. For performance reasons, it will newly draw the plot on the first time.
	 * After each update, only the redraw function from Plotly is called.
	 */
	draw = (): void => {
		const layout = this.state.layout;
		layout.height = this.getComputedHeight();
		layout.width = this.getComputedWidth();

		if (!this.state.filtersMatch) return;
		if (this.state.graphLoaded) {
			Plotly.redraw(this.parCoords.current, [this.state.data], layout);
		} else {
			Plotly.newPlot(this.parCoords.current, [this.state.data], layout, this.state.config);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
	onPlotlyRestyle = (event: MouseEvent): void => {
		if (event && event instanceof Array && event.length && event[0].dimensions) {
			const orderedCellTypes = event[0].dimensions[0].map((d) => d.type);
			this.setState({ orderedCellTypes, customDimensionOrder: true });
		}
	};

	/**
	 * Once the user has clicked a sort button, this click handler will reverse the internal order of the axis.
	 * @param type The type of the dimension to be sorted.
	 */
	sortDimension = (type: CellTypes): void => {
		const data = this.state.data;

		data.dimensions = data.dimensions.map((d) => {
			if (d.type !== type) return d;
			return {
				...d,
				range: [d.range[1], d.range[0]],
			};
		});

		this.setState({ data: data, customSorting: true }, () => this.draw());
	};

	/**
	 * Get the types of all dimensions, in specific order.
	 * Initially, it will return the type in the order they occur in the metadata props object.
	 * Once a filter is applied or an axis is dragged by the user, it will return the types in
	 * custom order.
	 */
	getOrderedCellTypes = (): Array<CellTypes> => {
		const orderedFilters = this.state.currentFilters.getOrderedFilters();
		// user has dragged axis -> return saved cell types from state (modified in onPlotlyRestyle)
		if (this.state.customDimensionOrder) {
			return this.state.orderedCellTypes;
		}
		// no filters are added -> return default order
		if (!orderedFilters.length) {
			return Object.keys(this.props.metadata).map((m) => parseInt(m) as CellTypes);
		}
		// otherwise: return cell type order depending on filter order
		const activeFilters = [];
		orderedFilters.forEach((filter) => {
			if (activeFilters.indexOf(filter.type) === -1) activeFilters.push(filter.type);
		});
		const orderedCellTypes = Object.keys(this.props.metadata).map((key) => parseInt(key) as CellTypes);
		activeFilters.reverse().forEach((filter) => {
			orderedCellTypes.sort((a, b) => (a === filter ? -1 : b === filter ? 1 : 0));
		});
		return orderedCellTypes;
	};

	/**
	 * This function will apply new newly created data and will trigger the actually draw method of plotly.
	 * If the user does not have requested custom ordering, the function sorts the dimension in the same order
	 * the filters are configured.
	 * @param data Already pre-processed data structure for Plotly parallel coords.
	 */
	setModifiedData = (data: ParallelCoordsData): void => {
		if (!this.state.customDimensionOrder) {
			this.getOrderedCellTypes()
				.reverse()
				.forEach((type) => {
					data.dimensions.sort((a, b) => (a.type === type ? -1 : b.type === type ? 1 : 0));
				});
		}
		this.setState({ data }, this.draw);
	};

	/**
	 * Create sort buttons dynamically for each dimension.
	 */
	createButtons = (): JSX.Element[] => {
		const buttons = [];

		if (!this.state.graphLoaded) return buttons;

		this.getOrderedCellTypes().forEach((type) => {
			const dimension = this.state.data.dimensions.find((d) => d.type === type);
			const ascendingOrder = dimension && dimension.range[0] <= dimension.range[1];
			buttons.push(
				<Col className="text-center" key={`col-${type}`}>
					<OverlayTrigger
						placement="top"
						delay={{ show: 250, hide: 400 }}
						overlay={this.renderTooltip(`Reverse order`)}
					>
						<span>
							<Button
								className="m-0 p-0"
								variant="link"
								disabled={this.isWildcard(type)}
								key={type}
								onClick={() => this.sortDimension(type)}
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
	 * Plus, the arrow direction of sort buttons will be reset.
	 */
	resetCustomDimensionOrder = (): void => {
		const data = this.state.data;
		// reset axis-internal order of dimensions
		data.dimensions.forEach((d) => {
			if (d.range[0] > d.range[1]) {
				d.range = d.range.reverse();
			}
		});
		this.setState(
			{
				data: data,
				customDimensionOrder: false,
				customSorting: false,
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
			<div ref={this.rootContainer} className="h-100 sample">
				<div className={this.state.filtersMatch ? '' : 'd-none'}>
					<div ref={this.buttonContainer} className="m-0 p-0">
						<Row className="btn-container">{this.createButtons()}</Row>
					</div>
					<div ref={this.parCoords} id={this.state.plotContainerName}></div>
					<div className="float-right">
						<OverlayTrigger
							placement="left"
							delay={{ show: 250, hide: 400 }}
							overlay={this.renderTooltip(`Reset custom ordering`)}
						>
							<span>
								<Button
									variant="link"
									className="m-0 p-0"
									onClick={this.resetCustomDimensionOrder}
									disabled={!this.state.customDimensionOrder && !this.state.customSorting}
								>
									<FaUndo></FaUndo>
								</Button>
							</span>
						</OverlayTrigger>
					</div>
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
