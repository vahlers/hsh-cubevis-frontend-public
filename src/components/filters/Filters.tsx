import React from 'react';
import './Filters.css';
import { Accordion, Alert } from 'react-bootstrap';
import { CellTypes } from '../../enums/cellTypes.enum';
import { FilterParameter, Value } from '../../models/filter.model';
import { DataProcessingService } from '../../services/dataProcessing.service';
import { FilterStep, FilterStepProps } from './FilterStep';
import { CubeCellModel } from '../../models/cell.model';
import { RangeFilter } from '../../models/rangeFilter.model';

export type Filter_ = {
	type: CellTypes;
	value: RangeFilter<Value>;
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
	rangefilter: Filter_;
	filterStep: FilterStep;
	disabled: boolean;
};

type FilterProps = {
	onChange: any;
	chartSelection: FilterParameter;
	metadata: { [p: string]: { key: string; label: string; type: string } };
};
const dataService = DataProcessingService.instance();
let dimensions: Dimension[] = [];

export class Filters extends React.Component<FilterProps, FilterState> {
	constructor(props: FilterProps) {
		super(props);

		// Initial empty state
		this.state = { elements: [], disableFilterAdd: true };
	}
	componentDidUpdate = (prevProps: FilterProps): void => {
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

	async getDataValues(dimensionType: CellTypes, filterId: number): Promise<OptionType[]> {
		// get all elems with an id smaller than the given one
		const applicableStateElems = this.state.elements.filter((elem) => elem.id < filterId);
		// map our filters to an object, that fits the getCuboid Signature
		let cuboidDimensions: CellTypes[] = applicableStateElems.map((elem) => elem.rangefilter.type);
		// append our new dimensionType
		cuboidDimensions = cuboidDimensions.concat(dimensionType);

		//TODO
		console.log('dimensionType', dimensionType);
		const result = (await dataService.getAvailableValues(cuboidDimensions, this.getFilterParamFromState()))[
			dimensionType
		];

		//TODO
		console.log('result', result);
		// Map the resulting Values to OptionType values so the Select elements can use them as options
		return result.map((val) => ({
			value: val.toString(),
			label: val.toString(),
		}));
	}

	addFilter = async (): Promise<void> => {
		const defaultDim: Dimension = dimensions[0];
		const newID = this.state === null ? 0 : this.state.elements.length;

		const result: StateElem = {
			id: newID,
			rangefilter: { type: defaultDim.value, value: null },
			values: await this.getDataValues(defaultDim.value, newID),
			filterStep: null,
			disabled: false,
		};

		const props: FilterStepProps = {
			id: result.id,
			values: result.values,
			dimensions: dimensions,
			onDelete: this.deleteFilter,
			onEyeClick: this.handleEyeClick,
			onChange: this.handleChange,
			metadata: this.props.metadata,
			disabled: false,
		};
		result.filterStep = new FilterStep(props);

		if (this.state.elements === null) {
			await this.setState({ elements: [result], disableFilterAdd: true });
		} else {
			await this.setState({ elements: this.state.elements.concat(result), disableFilterAdd: true });
		}
		this.emitChange();
	};

	//sends all non disabled filters to the props.onChange
	// TODO change Filters to natively use the FilterParameter class instead of creating one when emitting change
	emitChange = (): void => {
		this.props.onChange(this.getFilterParamFromState());
	};

	deleteFilter = async (id: number): Promise<void> => {
		const filterCount = this.state.elements.length;
		// get the id of the last filter, that is left after deletion
		const lastFilterId = filterCount - 1 === id ? filterCount - 2 : filterCount - 1;
		await this.setState({
			elements: this.state.elements.filter((elem) => elem.id !== id),
			// if the last filter after deletion has value null (<==> '*'), disable adding a step
			disableFilterAdd:
				this.state.elements.length > 1 && this.state.elements[lastFilterId].rangefilter.value === null,
		});
		this.emitChange();
	};

	handleEyeClick = async (id: number): Promise<void> => {
		await this.setState({
			// if the element has the id of the eyeClick, its	 disabled value is flipped
			elements: this.state.elements.map((el) => (el.id === id ? { ...el, disabled: !el.disabled } : el)),
		});
		this.emitChange();
	};

	handleChange = async (id: number, updatedFilter: Filter_): Promise<void> => {
		const prevDimension = this.state.elements[id].rangefilter.type;
		// here the state is set by using an object spread '{ }', inserting all of the old object '{ ...el'
		// and then updating the changed properties ', values: optValues, filter: updatedFilter }'
		await this.setState({
			elements: this.state.elements.map((el) => (el.id === id ? { ...el, rangefilter: updatedFilter } : el)),
			disableFilterAdd:
				updatedFilter.value === null || (updatedFilter.value.from === null && updatedFilter.value.to === null),
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
			disableFilterAdd: updatedFilter.value === null,
		});

		this.emitChange();
	};

	private getFilterParamFromState() {
		const filters: FilterParameter = new FilterParameter();
		this.state.elements.forEach((stateElem) => {
			if (stateElem.rangefilter.value === null) {
				filters.addFilter(stateElem.rangefilter.type, null);
			} else {
				const from = stateElem.rangefilter.value.from;
				const to = stateElem.rangefilter.value.to;

				if (!stateElem.disabled) {
					if (from == to) {
						filters.addFilter(stateElem.rangefilter.type, from);
					} else if (from !== null && to === null) {
						filters.addFilter(stateElem.rangefilter.type, from);
					} else if (to !== null && from === null) {
						filters.addFilter(stateElem.rangefilter.type, to);
					} else {
						filters.addFilter(stateElem.rangefilter.type, stateElem.rangefilter.value);
					}
				}
			}
		});
		return filters;
	}

	render(): React.ReactNode {
		// Use bootstrap classes
		return (
			<div className="filters">
				<h1>Filters</h1>
				<Accordion>
					{this.state.elements.length <= 0 ? (
						<Alert show={true} variant="secondary">
							There are no steps yet. Click &ldquo;Add step&rdquo; to add your first step!
						</Alert>
					) : (
						this.state.elements.map((elem) => (
							<FilterStep
								id={elem.id}
								key={elem.id}
								dimensions={dimensions}
								values={elem.values}
								onChange={this.handleChange}
								onEyeClick={this.handleEyeClick}
								onDelete={this.deleteFilter}
								metadata={this.props.metadata}
								disabled={elem.disabled}
							/>
						))
					)}
				</Accordion>
				<button
					onClick={this.addFilter}
					type="submit"
					className="btn btn-primary add-step-btn m-2"
					// disable adding another step, if the last step has a value of '*' <==> null
					disabled={this.state.disableFilterAdd}
				>
					Add Step
				</button>
				<br></br>
				<br></br>
				<br></br>
			</div>
		);
	}
}

export default Filters; // Don’t forget to use export default!
