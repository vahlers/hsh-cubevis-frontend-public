import React from 'react';
import { Accordion, Alert, Col, Row } from 'react-bootstrap';
import { CellTypes } from '../../enums/cellTypes.enum';
import { FilterParameter, Value } from '../../models/filter.model';
import { DataProcessingService } from '../../services/dataProcessing.service';
import { FilterStep, FilterStepMode, FilterStepProps } from './FilterStep';

import { RangeFilter } from '../../models/rangeFilter.model';
import { Ip } from '../../models/ip.modell';
import { DataServiceHelper } from '../../helpers/dataService.helper';

/**
 * The FilterStateParam Class doesn't let us handle the filters for each step in a react appropriate way.
 * The Filter_ type is a workaround for the Filters Components only
 */
export type Filter_ = {
	type: CellTypes;
	value: Value | Value[] | RangeFilter<Value>;
};

/**
 * Type for the Dimension Select
 */
export type Dimension = {
	value: CellTypes;
	label: string;
};

/**
 * Type for dimension value selects
 */
export type OptionType = {
	value: string;
	label: string;
};
/**
 * type for this classes state
 * elements: represent all info for every step
 * disableFilterAdd: if n dimensions are loose (set to filter for more than one value), adding filters is disabled
 * unused_dimensions: all dimensions, used in filters or not
 */
type FilterState = {
	elements: StateElem[];
	disableFilterAdd: boolean;
	available_dimensions: Dimension[];
};
/**
 * type to be used in FilterState, represents a FilterStep
 * dimensions: the available dimensions for that steps select
 * values: the available dimension values for that steps selects
 * filter: the filter last set by that FilterStep
 * filterStep: the filterStep element
 * isDisabled: bool if that step is currently disabled
 * isLooseStep: bool if that step has a filter set to a loose value
 * expanded: bool if that FilterStep is currently folded out
 * setFilterFromChart: needed to setting the steps filter to the received chart selection
 */
type StateElem = {
	id: number;
	dimensions: Dimension[];
	values: OptionType[];
	filter: Filter_;
	filterStep: FilterStep;
	isDisabled: boolean;
	isLooseStep: boolean;
	expanded: boolean;
	setFilterFromChart: Filter_;
};

/**
 * Properties needed by the filters object
 * onChange: the method that is called whenever the Filters changes
 * chartSelection: if chartSelection is set it is handed to applyChartSelection
 * metadata: the metadata for initialisation, see componentDidUpdate
 */
type FilterProps = {
	onChange: (FilterParameter) => void;
	chartSelection: FilterParameter;
	metadata: { [p: string]: { key: string; label: string; type: string } };
};

/** The maximum number of allowed loose FilterSteps. Loose meaning the Filter is set to multiple Values or a Range */
const allowedLooseDim = 2;
const dataService = DataProcessingService.instance();
/** all dimensions of the domain, set in componentDidUpdate*/
let all_dimensions: Dimension[] = [];

/**
 * The Filters class manages the GUI for the user to configure Filters. It's essentially an Accordion containing
 * FilterSteps. It manages logic when a filter can be added, what dimension and dimension values it can set and listens
 * for these Steps to change.
 * When a chartSelection is passed in, the Filters also transmits the changes to the FilterSteps
 */
export class Filters extends React.Component<FilterProps, FilterState> {
	constructor(props: FilterProps) {
		super(props);

		// Initial empty state
		this.state = { elements: [], disableFilterAdd: true, available_dimensions: [] };
	}

	/** we need extra logic when the metadata is first set and whenever the chartSelection changes*/
	componentDidUpdate = (prevProps: FilterProps): void => {
		if (this.props.chartSelection !== null && this.props.chartSelection !== prevProps.chartSelection) {
			// get the last added filter, need to reverse as well because order is flipped
			const allFilters = this.props.chartSelection.getOrderedFilters().reverse();
			const newFilterArray = [];
			allFilters.forEach((filterStep) => {
				let newFilter = filterStep.filter;
				if (Array.isArray(newFilter)) {
					// this ignores the Type RangeFilter[], but that is never used
					newFilter = newFilter as Value[];
				} else if ((newFilter as RangeFilter<Value>).from !== undefined) {
					newFilter = newFilter as RangeFilter<Value>;
				} else {
					newFilter = newFilter as Value;
				}
				newFilterArray.push({ type: filterStep.type, value: newFilter });
			});
			this.applyChartSelection(newFilterArray);
		}

		// if metadata object changes, reload all_dimensions.
		// if all_dimensions is undefined, the initial loading is not finished and no steps can be added
		if (this.props.metadata !== prevProps.metadata) {
			all_dimensions =
				this.props.metadata === null
					? []
					: Object.keys(this.props.metadata).map((type) => ({
							value: parseInt(type) as CellTypes,
							label: this.props.metadata[parseInt(type) as CellTypes].label,
					  }));
			this.setState({ disableFilterAdd: all_dimensions === undefined, available_dimensions: all_dimensions });
		}
	};

	/**
	 * Requests all available values, for the given dimension.
	 * @param newDimensionType The dimension for which the values are requested
	 * @param filterId The filter
	 */
	async getDataValues(newDimensionType: CellTypes, filterId: number): Promise<OptionType[]> {
		// get all elems with an id smaller than the given one
		const searchIndex = this.state.elements.findIndex((e) => e.id == filterId);
		//if searchIndex not found
		let applicableStateElems = this.state.elements;

		if (searchIndex > 0) {
			applicableStateElems = this.state.elements.filter((elem, id) => id < searchIndex);
		}
		// map our filters to an object, that fits the getCuboid Signature
		let cuboidDimensions: CellTypes[] = applicableStateElems.map((elem) => elem.filter.type);
		// append our new newDimensionType
		cuboidDimensions = cuboidDimensions.concat(newDimensionType);

		const result = (await dataService.getAvailableValues(cuboidDimensions, this.getFilterParamFromState()))[
			newDimensionType
		];

		// Map the resulting Values to OptionType values so the Select elements can use them as options
		return result.map((val) => ({
			value: val.toString(),
			label: val.toString(),
		}));
	}
	/**
	 * Creates a new FilterStep
	 */
	addFilter = async (): Promise<void> => {
		// The default dimension is the first unused dimension
		const newFilterDimension: Dimension = this.state.available_dimensions[0];

		// Set id to the lowest unused id
		let newID = 0;
		for (const elem of this.state.elements) {
			if (elem.id === newID) {
				newID++;
			} else {
				break;
			}
		}
		// create a new StateElement to append to this.state
		const result: StateElem = {
			id: newID,
			dimensions: this.state.available_dimensions,
			filter: { type: newFilterDimension.value, value: null },
			values: await this.getDataValues(newFilterDimension.value, newID),
			filterStep: null,
			isDisabled: false,
			isLooseStep: true,
			expanded: false,
			setFilterFromChart: null,
		};

		// create the properties for the new FilterStep
		const props: FilterStepProps = {
			id: result.id,
			values: result.values,
			dimensions: this.state.available_dimensions,
			onDelete: this.deleteFilter,
			onEyeClick: this.handleEyeClick,
			onChange: this.handleChange,
			onExpand: this.rotateArrow,
			metadata: this.props.metadata,
			disabled: false,
			disableLooseFiltering: false,
			stepnumber: 0,
			expanded: false,
			chartSelection: null,
		};
		result.filterStep = new FilterStep(props);

		// if this filterStep is the first, initialize state.elements
		if (this.state.elements === null) {
			await this.setState({ elements: [result] });
		} else {
			await this.setState({ elements: this.state.elements.concat(result) });
		}
		this.emitChange();
		this.checkAllowFilterAdd();
		this.updateAvailableDimensions();
	};

	/**
	 * Takes filters and adapts the current state and all FilterSteps within so that they represent the given filters.
	 * @param chartSelection The filters that the current state needs to be set to
	 */
	async applyChartSelection(chartSelection: Filter_[]): Promise<void> {
		await this.setState({
			// create a new elements array, by changing the filters of the elements which have the same
			// filter.type (dimension) as the given filters
			elements: this.state.elements.map((el) => {
				// find the filter in the chartSelection with the same dimension as the element
				const corresponding_chartSelection = chartSelection.find((filter) => filter.type === el.filter.type);
				// if there is a corresponding filter, set that as the element.setFilterFromChart
				return corresponding_chartSelection !== undefined
					? { ...el, setFilterFromChart: corresponding_chartSelection }
					: el;
			}),
		});

		/*
		 * this is a workaround! when setting multiple FilterSteps via setFilterFromChart they would trigger their
		 * onChange Method (which is Filters.handleChange) would be called multiple times in parallel, resulting in an
		 * inconsistent state, since only the last handleChange would be persistent. To prevent this we call
		 * handleChange manually here.
		 */
		for (const newFilter of chartSelection) {
			const id = this.state.elements.find((ele) => ele.filter.type === newFilter.type).id;
			await this.handleChange(
				id,
				(newFilter.value as RangeFilter<Value>).from !== undefined
					? FilterStepMode.ByValue
					: FilterStepMode.ByRange,
				newFilter,
			);
		}
	}

	/**
	 * Send the result of getFilterParamFromState to our onChange handler
	 */
	emitChange = (): void => {
		this.props.onChange(this.getFilterParamFromState());
	};

	/**
	 * Deletes the FilterStep which has the given id from state.
	 * @param id The id of the filter to be deleted
	 */
	deleteFilter = async (id: number): Promise<void> => {
		// set state.elements to an array which doesn't have the element with the given filter
		await this.setState({
			elements: this.state.elements.filter((elem) => elem.id !== id),
		});
		this.emitChange();
		this.checkAllowFilterAdd();
		this.updateAvailableDimensions();
	};

	/**
	 * Toggles the FilterStep with the given id, if possible, meaning disable them if enabled and vice versa.
	 * @param id The id of the FilterStep which will be enabled / disabled
	 */
	handleEyeClick = async (id: number): Promise<void> => {
		if (this.state.elements.find((e) => e.id == id).isDisabled) {
			if (this.state.disableFilterAdd && this.state.elements.find((e) => e.id == id).isLooseStep) {
				alert(
					'Enabling this step is not possible, as it would exceed the maximum amount of selectable ranges.',
				);
				return;
			} else if (
				!this.state.available_dimensions.includes(
					all_dimensions[this.state.elements.find((e) => e.id == id).filter.type],
				)
			) {
				alert('Enabling this step is not possible, the dimension is already selected.');
				return;
			}
		}
		await this.setState({
			// if the element has the id of the eyeClick, its disabled value is flipped
			elements: this.state.elements.map((el) => (el.id === id ? { ...el, isDisabled: !el.isDisabled } : el)),
		});

		this.emitChange();
		this.checkAllowFilterAdd();
		this.updateAvailableDimensions();
	};

	/**
	 * The handleChange method will be handed over to the FilterSteps so they can call it onChange
	 * Also determines whether a step is loose
	 * @param id The changed Steps ID
	 * @param mode If the Step is set to value selection or range selection
	 * @param updatedFilter The Filter that changed
	 */
	handleChange = async (id: number, mode: FilterStepMode, updatedFilter: Filter_): Promise<void> => {
		// determine which step in FilterState needs to change
		const prevDimension = this.state.elements.find((e) => e.id == id).filter.type;

		let isLoose = false;

		// null values are interpreted as * and are therefore loose
		if (updatedFilter === null || updatedFilter.value === null) {
			isLoose = true;
			// if filter is array, and has more than one element, it's considered loose
		} else if (Array.isArray(updatedFilter)) {
			isLoose = updatedFilter.length > 1;
			// if filter is RangeFilter, and has either both or neither 'from' and 'to' set to different values
		} else if (
			updatedFilter.value !== undefined &&
			(updatedFilter.value as RangeFilter<Value>).from !== undefined
		) {
			const newValue = updatedFilter.value as RangeFilter<Value>;
			isLoose =
				(newValue.from === null && newValue.to === null) ||
				(newValue.from !== null &&
					newValue.to !== null &&
					!DataServiceHelper.equals(newValue.from, newValue.to));
		}

		// if the updated filter was loose before, and still is.
		const disableFilterAdd =
			this.state.disableFilterAdd && this.state.elements.find((e) => e.id == id).isLooseStep && isLoose;

		// here the state is set by using an "object spread" '{ }', inserting all of the old object '{ ...el'
		// and then updating the changed properties ', filter: updatedFilter }'
		await this.setState({
			elements: this.state.elements.map((el) =>
				el.id === id ? { ...el, filter: updatedFilter, isLooseStep: isLoose } : el,
			),
			disableFilterAdd: disableFilterAdd,
		});

		// get the updated optValues, can't do this before, because getDataValues depends on getFilterParamFromState,
		// which depends on the updated state
		let optValues = this.state.elements.find((e) => e.id == id).values;
		if (prevDimension !== updatedFilter.type) {
			// the dimension changed, and the filterStep needs new opt values
			optValues = await this.getDataValues(updatedFilter.type, id);
		}

		// set the new dimension attribute options
		await this.setState({
			elements: this.state.elements.map((el) => (el.id === id ? { ...el, values: optValues } : el)),
		});

		// if the step has changed dimensions but n loose values are already selected, we need to set a default value
		// also need to prevent emitting an update since we are briefly in an inconsitstent state
		if (this.state.disableFilterAdd && isLoose && !this.state.elements.find((e) => e.id == id).isLooseStep) {
			await this.setState({
				elements: this.state.elements.map((el) =>
					el.id === id
						? { ...el, setFilterFromChart: { type: updatedFilter.type, value: optValues?.[0].value } }
						: el,
				),
			});
			// manually calling handleChange
			await this.handleChange(id, FilterStepMode.ByValue, {
				type: updatedFilter.type,
				value: optValues?.[0].value,
			});
		} else {
			this.emitChange();
			this.checkAllowFilterAdd();
			this.updateAvailableDimensions();
		}
	};

	// iterates all FilterStateElements and check if n of them are loose
	// then disableFilterAdd is set appropriately
	private checkAllowFilterAdd(): void {
		// we filter all elements for those that have a * as filter and check the result length against the allowed
		const result =
			this.state.elements.filter((e) => !e.isDisabled).length === all_dimensions.length ||
			this.state.elements
				// remove disabled elements
				.filter((elem) => !elem.isDisabled && elem.isLooseStep).length >= allowedLooseDim;
		this.setState({ disableFilterAdd: result });
	}

	// check which of the dimensions are already used in the FilterState
	private updateAvailableDimensions(): void {
		// all dimensions that are not included in a filter already
		const new_dimensions = all_dimensions.filter(
			(dim) =>
				!this.state.elements
					.map((elem) => (!elem.isDisabled && elem.filter !== null ? elem.filter.type : null))
					.includes(dim.value),
		);

		this.setState({
			available_dimensions: new_dimensions,
			elements: this.state.elements.map((el) => {
				// if filter, or filter.type are null for some reason we don't need to insert the filters
				// selected dimension into it's available dimensions
				// also don't need to do that for disabled dims
				if (el.filter === null || el.filter.type === null) {
					return { ...el, dimensions: new_dimensions };
				} else if (el.isDisabled) {
					// if a filter is disabled and another filter uses the same dimension we
					// need to insert the dimension into it's available dimensions again

					if (!new_dimensions.includes(all_dimensions[el.filter.type])) {
						const index = new_dimensions.findIndex((dim) => dim.value > el.filter.type);

						return {
							...el,
							dimensions: new_dimensions
								.slice(0, index)
								.concat(all_dimensions[el.filter.type])
								.concat(new_dimensions.slice(index)),
						};
					} else {
						return { ...el, dimensions: new_dimensions };
					}
				} else {
					// insert the dimension (all_dimensions[el.filter.type]) used by elem
					// at index of the dimension
					const index = new_dimensions.findIndex((dim) => dim.value > el.filter.type);
					return {
						...el,
						dimensions: new_dimensions
							.slice(0, index)
							.concat(all_dimensions[el.filter.type])
							.concat(new_dimensions.slice(index)),
					};
				}
			}),
		});
	}

	/**
	 * Creates a FilterParam model out of the FilterState
	 * @returns A FilterParam representing the FilterState
	 */
	private getFilterParamFromState(): FilterParameter {
		const filters: FilterParameter = new FilterParameter();
		this.state.elements.forEach((stateElem) => {
			if (!stateElem.isDisabled) {
				let value = stateElem.filter.value;
				if (value === null || value === undefined) {
					filters.addFilter(stateElem.filter.type, null);
				} else if (typeof value === 'string' || typeof value === 'number' || value instanceof Ip) {
					filters.addFilter(stateElem.filter.type, value);
				} else if (Array.isArray(value)) {
					filters.addFilter(stateElem.filter.type, value);
				} else {
					value = value as RangeFilter<Value>;
					const from = value.from;
					const to = value.to;

					if (from === to) {
						filters.addFilter(stateElem.filter.type, from);
					} else if (from !== null && to === null) {
						filters.addFilter(stateElem.filter.type, from);
					} else if (to !== null && from === null) {
						filters.addFilter(stateElem.filter.type, to);
					} else if (value.from.valueOf() > value.to.valueOf()) {
						const tempValue: RangeFilter<Value> = { from: to, to: from };
						filters.addFilter(stateElem.filter.type, tempValue);
					} else {
						filters.addFilter(stateElem.filter.type, value);
					}
				}
			}
		});
		return filters;
	}

	/**
	 * Flips the expanded boolean for a step with the given id
	 * @param eventKey The id of the FilterStep that is opened or closed
	 */
	rotateArrow = (eventKey: number): void => {
		const elements = this.state.elements;
		elements.forEach((step) => {
			if (step.id === eventKey) {
				step.expanded = !step.expanded;
			} else {
				step.expanded = false;
			}
		});
		this.setState({
			elements: elements,
		});
	};

	/**
	 * The React
	 */
	render(): React.ReactNode {
		// Use bootstrap classes
		return (
			<div className="filters m-0">
				<h1>Filters</h1>
				<Row className="m-0">
					<Col>
						<Accordion>
							{this.state.elements.length <= 0 ? (
								<Alert className="filter-alert" show={true} variant="secondary">
									There are no steps yet. Click &ldquo;Add step&rdquo; to add your first step!
								</Alert>
							) : (
								this.state.elements.map((elem, index) => (
									<FilterStep
										id={elem.id}
										key={elem.id}
										stepnumber={index + 1}
										dimensions={elem.dimensions}
										values={elem.values}
										onChange={this.handleChange}
										onEyeClick={this.handleEyeClick}
										onDelete={this.deleteFilter}
										metadata={this.props.metadata}
										disabled={elem.isDisabled}
										// disable setting a loose dimension if n are already set to loose,
										// and it itself is not a loose dimension
										disableLooseFiltering={this.state.disableFilterAdd && !elem.isLooseStep}
										onExpand={this.rotateArrow}
										expanded={elem.expanded}
										chartSelection={elem.setFilterFromChart}
									/>
								))
							)}
						</Accordion>
					</Col>
				</Row>
				<Row className="m-0 p-0">
					<Col className="m-0 p-0 text-center my-auto" md="2">
						<button
							onClick={() => this.addFilter()}
							type="submit"
							className="btn btn-primary m-2 add-step-btn text-nowrap"
							// disable adding another step, if the last step has a value of '*' <==> null
							disabled={this.state.disableFilterAdd}
						>
							Add Step
						</button>
					</Col>
					<Col md="10" className="m-0 p-0 text-center my-auto">
						<Alert className={this.state.disableFilterAdd ? 'm-4' : 'm-4 d-none'} variant="secondary">
							{this.state.elements.filter((e) => !e.isDisabled).length < all_dimensions.length
								? `You have selected the maximum number of ranges (${allowedLooseDim}).`
								: 'You have added a filter for every dimension.'}
						</Alert>
					</Col>
				</Row>
			</div>
		);
	}
}

export default Filters; // Don’t forget to use export default!
