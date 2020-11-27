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
	currentIndex: number;
	filters: Filter[];
	availableDimensions: Dimension[];
};

type FilterProps = {
	onChange: any;
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
			currentIndex: 0,
			filters: [],
			availableDimensions: [],
		};

		this.addFilter = this.addFilter.bind(this);
		this.applyFilter = this.applyFilter.bind(this);
		this.deleteFilter = this.deleteFilter.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.getAvailableDimensions = this.getAvailableDimensions.bind(this);
	}

	// Unused Parameter 'event', Jetbrains IDE doesn't recognize standard underscore notation
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async addFilter(_event: React.MouseEvent<HTMLButtonElement, MouseEvent>): Promise<void> {
		const props: FilterStepProps = {
			id: this.state.currentIndex,
			dimensions: this.state.availableDimensions,
			values: this.state.filterStep_dimensionAttributes[this.state.currentIndex],
			onDelete: this.deleteFilter,
			onChange: this.handleChange,
			metadata: this.props.metadata,
		};

		const tmp_filterSteps: FilterStep[] = this.state.filterSteps;
		tmp_filterSteps.push(new FilterStep(props));

		this.setState({
			filterSteps: tmp_filterSteps,
			currentIndex: this.state.currentIndex + 1,
		});
	}

	componentDidUpdate(prevProps: FilterProps): void {
		if (this.props.metadata !== prevProps.metadata) {
			const availableDimensions = this.props.metadata === null ? [] : this.getAvailableDimensions();
			this.setState({ availableDimensions });
		}
	}

	deleteFilter(id: number): void {
		const newFilters = this.state.filterSteps.filter(function (step) {
			return step.props.id !== id;
		});

		this.setState({
			filterSteps: newFilters,
			// availableDimensions: this.getAvailableDimensions(),
		});
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

	applyFilter(): void {
		this.props.onChange(this.state.filters);
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
							dimensions={filter.props.dimensions}
							values={this.state.filterStep_dimensionAttributes[filter.props.id]}
							metadata={filter.props.metadata}
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

				<button onClick={this.applyFilter} type="submit" className="btn btn-primary add-step-btn m-2">
					Apply Filters
				</button>
			</div>
		);
	}
}

export default Filters; // Don’t forget to use export default!
