import React from 'react';
import './Filters.css';
import { Accordion, Alert, Col, Row } from 'react-bootstrap';
import { CellTypes } from '../../enums/cellTypes.enum';
import { FilterParameter, Value } from '../../models/filter.model';
import { DataProcessingService } from '../../services/dataProcessing.service';
import { FilterStep, FilterStepMode, FilterStepProps } from './FilterStep';

import { RangeFilter } from '../../models/rangeFilter.model';
import { Ip } from '../../models/ip.modell';

export type Filter_ = {
	type: CellTypes;
	value: Value | Value[] | RangeFilter<Value>;
};

export type Dimension = {
	value: CellTypes;
	label: string;
};

export type OptionType = {
	value: string;
	label: string;
};

type FilterState = {
	elements: StateElem[];
	disableFilterAdd: boolean;
	available_dimensions: Dimension[];
};

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

type FilterProps = {
	onChange: (FilterParameter) => void;
	chartSelection: FilterParameter;
	metadata: { [p: string]: { key: string; label: string; type: string } };
};
const allowedLooseDim = 2;
const dataService = DataProcessingService.instance();
let all_dimensions: Dimension[] = [];

export class Filters extends React.Component<FilterProps, FilterState> {
	constructor(props: FilterProps) {
		super(props);

		// Initial empty state
		this.state = { elements: [], disableFilterAdd: true, available_dimensions: [] };
	}
	componentDidUpdate = (prevProps: FilterProps): void => {
		if (this.props.chartSelection !== null && this.props.chartSelection !== prevProps.chartSelection) {
			// get the last added filter, need to reverse as well because order is flipped
			const allFilters = this.props.chartSelection.getOrderedFilters().reverse();
			const newFilterArray = [];
			allFilters.forEach((filterStep) => {
				let newFilter = filterStep.filter;
				if (Array.isArray(newFilter)) {
					// TODO this ignores the Type RangeFilter[] because i dont think that is ever used
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

	async getDataValues(newDimensionType: CellTypes, filterId: number): Promise<OptionType[]> {
		// get all elems with an id smaller than the given one
		const searchIndex = this.state.elements.findIndex((e) => e.id == filterId);
		//if searchIndex not found
		let applicableStateElems = this.state.elements;

		if (searchIndex > 0) {
			applicableStateElems = this.state.elements.filter((elem, id) => id < searchIndex);
		}
		console.log('searching ' + searchIndex + ' in ', this.state.elements);
		console.log(applicableStateElems);
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

	addFilter = async (): Promise<void> => {
		const newFilterDimension: Dimension = this.state.available_dimensions[0];

		let newID = 0;
		for (const elem of this.state.elements) {
			if (elem.id === newID) {
				newID++;
			} else {
				break;
			}
		}

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

		if (this.state.elements === null) {
			await this.setState({ elements: [result] });
		} else {
			await this.setState({ elements: this.state.elements.concat(result) });
		}
		this.emitChange();
		this.checkAllowFilterAdd();
		this.updateAvailableDimensions();
	};

	async applyChartSelection(chartSelection: Filter_[]): Promise<void> {
		await this.setState({
			elements: this.state.elements.map((el) => {
				const corresponding_chartSelection = chartSelection.find((filter) => filter.type === el.filter.type);
				return corresponding_chartSelection !== undefined
					? { ...el, setFilterFromChart: corresponding_chartSelection }
					: el;
			}),
		});

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

	//sends all non disabled filters to the props.onChange
	emitChange = (): void => {
		this.props.onChange(this.getFilterParamFromState());
	};

	deleteFilter = async (id: number): Promise<void> => {
		await this.setState({
			elements: this.state.elements.filter((elem) => elem.id !== id),
		});
		this.emitChange();
		this.checkAllowFilterAdd();
		this.updateAvailableDimensions();
	};

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

	handleChange = async (id: number, mode: FilterStepMode, updatedFilter: Filter_): Promise<void> => {
		const prevDimension = this.state.elements.find((e) => e.id == id).filter.type;

		let isLoose = false;

		// if we want to set a default value, we actually prevent the step from being loose
		if (updatedFilter === null || updatedFilter.value === null) {
			isLoose = true;
			// if filter is array, and has more than one element, it's considered loose
		} else if (Array.isArray(updatedFilter)) {
			isLoose = updatedFilter.length > 1;
			// if filter is RangeFilter, and has either both or neither from and to set, it's considered loose
		} else if (
			updatedFilter.value !== undefined &&
			(updatedFilter.value as RangeFilter<Value>).from !== undefined
		) {
			const newValue = updatedFilter.value as RangeFilter<Value>;
			isLoose =
				(newValue.from === null && newValue.to === null) || (newValue.from !== null && newValue.to !== null);
		}

		// if the updated filter was loose before, and still is.
		const disableFilterAdd =
			this.state.disableFilterAdd && this.state.elements.find((e) => e.id == id).isLooseStep && isLoose;
		// here the state is set by using an object spread '{ }', inserting all of the old object '{ ...el'
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

		await this.setState({
			elements: this.state.elements.map((el) => (el.id === id ? { ...el, values: optValues } : el)),
		});

		// if the step has a loose value but n loose values are already selected, we need to set a default value
		if (this.state.disableFilterAdd && !this.state.elements.find((e) => e.id == id).isLooseStep && isLoose) {
			await this.setState({
				elements: this.state.elements.map((el) =>
					el.id === id
						? { ...el, setFilterFromChart: { type: updatedFilter.type, value: optValues?.[0].value } }
						: el,
				),
			});
			await this.handleChange(id, FilterStepMode.ByValue, {
				type: updatedFilter.type,
				value: optValues?.[0].value,
			});
		} else {
			// prevent emitting update until the FilterStep call handleChange again with the default Value
			this.emitChange();
			this.checkAllowFilterAdd();
			this.updateAvailableDimensions();
		}
	};

	private checkAllowFilterAdd() {
		// we filter all elements for those that have a * as filter and check the result length against the allowed
		const result =
			this.state.elements.filter((e) => !e.isDisabled).length === all_dimensions.length ||
			this.state.elements
				// remove disabled elements
				.filter((elem) => !elem.isDisabled && elem.isLooseStep).length >= allowedLooseDim;
		this.setState({ disableFilterAdd: result });
	}

	private updateAvailableDimensions() {
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

	private getFilterParamFromState() {
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
						<Alert className={this.state.disableFilterAdd ? 'm-4' : 'm-4 hide-alert'} variant="secondary">
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
