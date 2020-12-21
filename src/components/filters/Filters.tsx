import React from 'react';
import './Filters.css';
import { Accordion, Alert, Col, Row } from 'react-bootstrap';
import { CellTypes } from '../../enums/cellTypes.enum';
import { FilterParameter, Value } from '../../models/filter.model';
import { DataProcessingService } from '../../services/dataProcessing.service';
import { FilterStep, FilterStepProps, FilterStepMode } from './FilterStep';

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
};

type StateElem = {
	id: number;
	values: OptionType[];
	filter: Filter_;
	filterStep: FilterStep;
	disabled: boolean;
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
let dimensions: Dimension[] = [];

export class Filters extends React.Component<FilterProps, FilterState> {
	constructor(props: FilterProps) {
		super(props);

		// Initial empty state
		this.state = { elements: [], disableFilterAdd: true };
	}
	componentDidUpdate = (prevProps: FilterProps): void => {
		if (this.props.chartSelection !== null && this.props.chartSelection !== prevProps.chartSelection) {
			// get the last added filter
			const allFilters = this.props.chartSelection.getOrderedFilters();
			const newStep = allFilters[allFilters.length - 1];
			let newFilter = newStep.filter;
			if (Array.isArray(newFilter)) {
				// TODO this ignores the Type RangeFilter[] because i dont think that is ever used
				newFilter = newFilter as Value[];
			} else if ((newFilter as RangeFilter<Value>).from !== undefined) {
				newFilter = newFilter as RangeFilter<Value>;
			} else {
				newFilter = newFilter as Value;
			}
			this.applyChartSelection({ type: newStep.type, value: newFilter });
		}

		if (this.props.metadata !== prevProps.metadata) {
			dimensions =
				this.props.metadata === null
					? []
					: Object.keys(this.props.metadata).map((type) => ({
							value: parseInt(type) as CellTypes,
							label: this.props.metadata[parseInt(type) as CellTypes].label,
					  }));
			this.setState({ disableFilterAdd: dimensions === undefined });
		}
	};

	async getDataValues(newDimensionType: CellTypes, filterId: number): Promise<OptionType[]> {
		// get all elems with an id smaller than the given one
		const applicableStateElems = this.state.elements.filter((elem) => elem.id < filterId);
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
		const newFilterDimension: Dimension = dimensions[0];
		const newID = this.state === null ? 0 : this.state.elements.length;

		const result: StateElem = {
			id: newID,
			filter: { type: newFilterDimension.value, value: null },
			values: await this.getDataValues(newFilterDimension.value, newID),
			filterStep: null,
			disabled: false,
			isLooseStep: true,
			expanded: false,
			setFilterFromChart: null,
		};

		const props: FilterStepProps = {
			id: result.id,
			values: result.values,
			dimensions: dimensions,
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
	};

	applyChartSelection(chartSelection: Filter_): void {
		this.setState({
			elements: this.state.elements.map((el) =>
				el.id === this.state.elements.length - 1 ? { ...el, setFilterFromChart: chartSelection } : el,
			),
		});
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
	};

	handleEyeClick = async (id: number): Promise<void> => {
		await this.setState({
			// if the element has the id of the eyeClick, its	 disabled value is flipped
			elements: this.state.elements.map((el) => (el.id === id ? { ...el, disabled: !el.disabled } : el)),
		});
		this.emitChange();
		this.checkAllowFilterAdd();
	};

	handleChange = async (id: number, mode: FilterStepMode, updatedFilter: Filter_): Promise<void> => {
		const prevDimension = this.state.elements[id].filter.type;

		let isLoose = false;
		// if filter is empty, it's considered loose
		if (updatedFilter === null || updatedFilter.value === null) {
			isLoose = true;
			// if filter is array, and has more than one element, it's considered loose
		} else if (Array.isArray(updatedFilter)) {
			isLoose = updatedFilter.length > 1;
			// if filter is RangeFilter, and has either both or neither from and to set, it's considered loose
		} else if ((updatedFilter.value as RangeFilter<Value>).from !== undefined) {
			const newValue = updatedFilter.value as RangeFilter<Value>;
			isLoose =
				(newValue.from === null && newValue.to === null) || (newValue.from !== null && newValue.to !== null);
		}

		// if one of the loose dimensions is no longer loose, we need to update our state.disableFilterAdd before we
		// set the isLooseStep to false
		if (this.state.elements[id].isLooseStep && !isLoose) {
			this.setState({ disableFilterAdd: false });
		}

		// here the state is set by using an object spread '{ }', inserting all of the old object '{ ...el'
		// and then updating the changed properties ', filter: updatedFilter }'

		await this.setState({
			elements: this.state.elements.map((el) =>
				el.id === id ? { ...el, filter: updatedFilter, isLooseStep: isLoose } : el,
			),
		});

		// get the updated optValues, can't do this before, because getDataValues depends on getFilterParamFromState,
		// which depends on the updated state
		let optValues = this.state.elements[id].values;
		if (prevDimension !== updatedFilter.type) {
			// the dimension changed, and the filterStep needs new opt values
			optValues = await this.getDataValues(updatedFilter.type, id);
		}

		await this.setState({
			elements: this.state.elements.map((el) => (el.id === id ? { ...el, values: optValues } : el)),
			disableFilterAdd: false,
		});

		this.emitChange();
		this.checkAllowFilterAdd();
	};

	private checkAllowFilterAdd() {
		// we filter all elements for those that have a * as filter and check the result length against the allowed
		const result =
			this.state.elements
				// remove disabled elements
				.filter((elem) => !elem.disabled && elem.isLooseStep).length >= allowedLooseDim;
		this.setState({ disableFilterAdd: result });
	}

	private getFilterParamFromState() {
		const filters: FilterParameter = new FilterParameter();
		this.state.elements.forEach((stateElem) => {
			let value = stateElem.filter.value;
			if (value === null) {
				filters.addFilter(stateElem.filter.type, null);
			} else if (typeof value === 'string' || typeof value === 'number' || value instanceof Ip) {
				filters.addFilter(stateElem.filter.type, value);
			} else if (Array.isArray(value)) {
				filters.addFilter(stateElem.filter.type, value);
			} else {
				value = value as RangeFilter<Value>;
				const from = value.from;
				const to = value.to;

				if (from == to) {
					filters.addFilter(stateElem.filter.type, from);
				} else if (from !== null && to === null) {
					filters.addFilter(stateElem.filter.type, from);
				} else if (to !== null && from === null) {
					filters.addFilter(stateElem.filter.type, to);
				} else {
					filters.addFilter(stateElem.filter.type, value);
				}
			}
		});
		return filters;
	}

	rotateArrow = (eventKey: number): void => {
		const elements = this.state.elements;
		elements.forEach((step) => {
			if (step.id == eventKey) {
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
										dimensions={dimensions}
										values={elem.values}
										onChange={this.handleChange}
										onEyeClick={this.handleEyeClick}
										onDelete={this.deleteFilter}
										metadata={this.props.metadata}
										disabled={elem.disabled}
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
							className="btn btn-primary m-2 add-step-btn"
							// disable adding another step, if the last step has a value of '*' <==> null
							disabled={this.state.disableFilterAdd}
						>
							Add Step
						</button>
					</Col>
					<Col md="10" className="m-0 p-0 text-center my-auto">
						<Alert
							className={this.state.disableFilterAdd ? 'm-4 loose-alert' : 'm-4 loose-alert hide-alert'}
							variant="secondary"
						>
							You have selected the maximum number of ranges ({allowedLooseDim}).
						</Alert>
					</Col>
				</Row>
			</div>
		);
	}
}

export default Filters; // Don’t forget to use export default!
