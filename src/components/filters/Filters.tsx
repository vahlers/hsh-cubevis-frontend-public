import React from 'react';
import './Filters.css';
import { Accordion } from 'react-bootstrap';
import { CellTypes } from '../../enums/cellTypes.enum';
import { Filter } from '../../models/filter.model';
import { DataProcessingService } from '../../services/dataProcessing.service';
import { FilterStep, FilterStepProps } from './FilterStep';
import { Ip } from '../../models/ip.modell';

export type Dimension = {
	value: CellTypes;
	label: string;
};

export type DimensionValue = {
	value: string | number | Ip;
	label: string;
};

export type OptionType = {
	value: string | number;
	label: string;
};

type FilterState = {
	elements: StateElem[];
	disableFilterAdd: boolean;
};

type StateElem = {
	id: number;
	filter: Filter;
	values: OptionType[];
	filterStep: FilterStep;
	disabled: boolean;
};

type FilterProps = {
	onChange: any;
	chartSelection: Filter[];
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

	// This is in preparation for a future feature, only showing available dimensions by using the optional filters
	// 	// Map the resulting Values to OptionType values so the Select elements can use them as options
	// 	return filteredResult.map((val) => ({ value: val.toString(), label: val.toString() }));
	// }
	// 	async getDataValues(dimension: CellTypes, filterId: number): Promise<OptionType[]> {
	// 	const result = await await dataService.getAvailableValues(
	// 		this.state
	// 			// get all filterStepData with id < filterID
	// 			.filter((filterStepDatum) => filterStepDatum.id < filterId)
	// 			// extract only the filters CellType from the filterStepData
	// 			.map((filterStepDatum) => filterStepDatum.filter.type)
	// 			// append current dimensions CellType
	// 			.concat(dimension),
	// 		// only need the values for the given CellType
	// 	)[dimension];
	// Map the resulting Values to OptionType values so the Select elements can use them as options
	// return result.map((val) => ({ value: val, label: val }));
	// }

	getDataValues = async (cellType: CellTypes, filterId: number): Promise<OptionType[]> => {
		const result = (await dataService.getAvailableValues([cellType]))[cellType];
		// Map the resulting Values to OptionType values so the Select elements can use them as options
		return result.map((val) => ({ value: val.toString(), label: val.toString() }));
	};

	// Unused Parameter 'event', Jetbrains IDE doesn't recognize standard underscore notation
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	addFilter = async (): Promise<void> => {
		const defaultDim: Dimension = dimensions[0];
		const newID = this.state === null ? 0 : this.state.elements.length;

		const result: StateElem = {
			id: newID,
			filter: { type: defaultDim.value, value: null },
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

	//sends all non disabled filters to the props.onChange
	emitChange = (): void => {
		const filters = this.state.elements.map(function (elem) {
			if (!elem.disabled) {
				return elem.filter;
			}
		});
		// if all filters are disabled, map returns an array with an undefined element
		if (filters.length === 1 && filters[0] === undefined) {
			this.props.onChange([{ type: null, value: null }]);
		} else {
			this.props.onChange(filters);
		}
	};

	deleteFilter = async (id: number): Promise<void> => {
		const filterCount = this.state.elements.length;
		// get the id of the last filter, that is left after deletion
		const lastFilterId = filterCount - 1 === id ? filterCount - 2 : filterCount - 1;
		console.log(this.state.elements.length === 1);
		await this.setState({
			elements: this.state.elements.filter((elem) => elem.id !== id),
			// if the last filter after deletion has value null (<==> '*'), disable adding a step
			disableFilterAdd: this.state.elements.length > 1 && this.state.elements[lastFilterId].filter.value === null,
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

	handleChange = async (id: number, updatedFilter: Filter): Promise<void> => {
		let optValues = this.state.elements[id].values;
		if (this.state.elements[id].filter.type !== updatedFilter.type) {
			// the dimension changed, and the filterStep needs new opt values
			optValues = await this.getDataValues(updatedFilter.type, id);
		}

		// here the state is set by using an object spread '{ }', inserting all of the old object '{ ...el'
		// and then updating the changed properties ', values: optValues, filter: updatedFilter }'
		await this.setState({
			elements: this.state.elements.map((el) =>
				el.id === id ? { ...el, values: optValues, filter: updatedFilter } : el,
			),
			disableFilterAdd: updatedFilter.value === null,
		});

		this.emitChange();
	};

	render(): React.ReactNode {
		// Use bootstrap classes
		return (
			<div className="filters">
				<h1>Filters</h1>
				<Accordion>
					{this.state.elements.length <= 0
						? ''
						: this.state.elements.map((elem) => (
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
						  ))}
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
			</div>
		);
	}
}

export default Filters; // Don’t forget to use export default!
