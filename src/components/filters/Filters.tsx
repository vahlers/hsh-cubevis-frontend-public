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
	//TODO:
	// change steps to: filterSteps: { [id: number]: {step: FilterStep, dimensions: Dimension[], attributes: OptionType[] }
	// This way the damn React-Select element might update if we change the dimensions
	filterSteps: FilterStep[];
	filterStep_dimensionAttributes: { [step_id: number]: OptionType[] };
	filterDisabled: boolean[];
	currentIndex: number;
	filters: Filter[];
	availableDimensions: Dimension[];
};

type FilterProps = {
	onChange: any;
	chartSelection: Filter[];
	metadata: { [p: string]: { key: string; label: string; type: string } };
};
const dataService = DataProcessingService.instance();

function convertToOptions(values: (string | number | Ip)[]): OptionType[] {
	const opts: OptionType[] = [];
	for (let i = 0; i < values.length; i++) {
		const value = values[i].toString();
		opts.push({ value: value, label: value });
	}
	return opts;
}

export class Filters extends React.Component<FilterProps, FilterState> {
	constructor(props: FilterProps) {
		super(props);

		// Iterate over all CellTypes (-1 because CellTypes.CellType_Count is not a real CellType) :(

		this.state = {
			filterSteps: [],
			filterStep_dimensionAttributes: [],
			filterDisabled: [],
			currentIndex: 0,
			filters: [],
			availableDimensions: [],
		};

		this.addFilter = this.addFilter.bind(this);
		this.deleteFilter = this.deleteFilter.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleEyeClick = this.handleEyeClick.bind(this);
		this.getAvailableDimensions = this.getAvailableDimensions.bind(this);
	}

	// Unused Parameter 'event', Jetbrains IDE doesn't recognize standard underscore notation
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async addFilter(_event: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> {
		const tmp_disabled = this.state.filterDisabled;
		tmp_disabled[this.state.currentIndex] = false;
		this.setState({ filterDisabled: tmp_disabled });

		const props: FilterStepProps = {
			id: this.state.currentIndex,
			dimensions: this.state.availableDimensions,
			values: this.state.filterStep_dimensionAttributes[this.state.currentIndex],
			onDelete: this.deleteFilter,
			onEyeClick: this.handleEyeClick,
			onChange: this.handleChange,
			metadata: this.props.metadata,
			disabled: false,
		};

		const tmp_filterSteps: FilterStep[] = this.state.filterSteps;
		tmp_filterSteps.push(new FilterStep(props));

		await this.setState({
			filterSteps: tmp_filterSteps,
			currentIndex: this.state.currentIndex + 1,
		});

		this.props.onChange(this.state.filters);
	}

	componentDidUpdate(prevProps: FilterProps): void {
		if (this.props.metadata !== prevProps.metadata) {
			const availableDimensions = this.props.metadata === null ? [] : this.getAvailableDimensions();
			this.setState({ availableDimensions });
		}
	}

	async deleteFilter(id: number): Promise<void> {
		const tmp_filterSteps = this.state.filterSteps.filter(function (step) {
			return step.props.id !== id;
		});

		const tmp_dimensionAttributes = this.state.filterStep_dimensionAttributes;
		delete tmp_dimensionAttributes[id];

		const tmp_filters = this.state.filters;
		tmp_filters.splice(id, 1);

		await this.setState({
			filters: tmp_filters,
			filterSteps: tmp_filterSteps,
			filterStep_dimensionAttributes: tmp_dimensionAttributes,
			// availableDimensions: this.getAvailableDimensions(),
		});
		this.props.onChange(this.state.filters);
	}

	async handleEyeClick(id: number): Promise<void> {
		console.log('Filter Steps: ', this.state.filterSteps);
		const tmp_disabled: boolean[] = [];
		const tmp_filters: Filter[] = [];

		for (let i = 0; i < this.state.filterSteps.length; i++) {
			const key = this.state.filterSteps[i].props.id;
			tmp_disabled[key] = key > id;
			if (key <= id) {
				tmp_filters.push(this.state.filters[key]);
			}
		}

		await this.setState({
			filterDisabled: tmp_disabled,
		});
		this.props.onChange(tmp_filters);
	}

	async handleChange(id: number, updatedFilter: Filter): Promise<void> {
		const tmp_filters = this.state.filters;
		tmp_filters[id] = updatedFilter;

		const tmp_values = this.state.filterStep_dimensionAttributes;
		tmp_values[id] = convertToOptions(
			(await dataService.getAvailableValues([updatedFilter.type]))[updatedFilter.type],
		);

		this.setState({
			filters: tmp_filters,
			filterStep_dimensionAttributes: tmp_values,
			availableDimensions: this.props.metadata === null ? [] : this.getAvailableDimensions(),
		});

		this.props.onChange(this.state.filters);
	}

	getAvailableDimensions(): Dimension[] {
		if (!this.props.metadata === null) return [];
		const availableDimensions: Dimension[] = [];
		for (let i = 0; i < Object.keys(CellTypes).length / 2 - 1; i++) {
			// this weird line works because calling CellTypes[int] gives a string and CellTypes[string] gives an enum
			const curCellType = CellTypes[CellTypes[i]];
			availableDimensions.push({ label: this.props.metadata[curCellType].label, value: curCellType });
		}
		return availableDimensions;
	}

	// getAvailableDimensions(): Dimension[] {
	// 	const availableDimensions: Dimension[] = [];
	// 	for (let i = 0; i < Object.keys(CellTypes).length / 2 - 1; i++) {
	// 		// this weird line works because calling CellTypes[int] gives a string and CellTypes[string] gives an enum
	// 		const curCellType = CellTypes[CellTypes[i]];
	// 		let dimensionUnused = true;
	// 		if (this.state !== undefined) {
	// 			console.log('Filters are:  ', this.state.filters);
	// 			for (let k = 0; k < this.state.filters.length; k++) {
	// 				if (this.state.filters[k].type == curCellType) {
	// 					dimensionUnused = false;
	// 					break;
	// 				}
	// 			}
	// 		}
	// 		console.log('Dimension ' + CellTypes[curCellType] + ': ' + dimensionUnused);
	// 		availableDimensions.push({ label: metadata[curCellType].label, value: curCellType });
	// 	}
	// 	return availableDimensions;
	// }

	render(): React.ReactNode {
		// Use bootstrap classes

		return (
			<div className="filters">
				<h1>Filters</h1>
				<Accordion>
					{this.state.filterSteps.map((filter) => (
						<FilterStep
							id={filter.props.id}
							key={filter.props.id}
							onChange={filter.props.onChange}
							onDelete={filter.props.onDelete}
							onEyeClick={filter.props.onEyeClick}
							dimensions={filter.props.dimensions}
							values={this.state.filterStep_dimensionAttributes[filter.props.id]}
							metadata={filter.props.metadata}
							disabled={this.state.filterDisabled[filter.props.id]}
						/>
					))}
				</Accordion>
				<button
					onClick={this.addFilter}
					type="submit"
					className="btn btn-primary add-step-btn m-2"
					disabled={this.state.availableDimensions.length <= 0}
				>
					Add Step
				</button>
			</div>
		);
	}
}

export default Filters; // Don’t forget to use export default!
