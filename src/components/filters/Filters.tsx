import React from 'react';
import { FilterStep, FilterStepProps } from './FilterStep';
import { Accordion } from 'react-bootstrap';
import { CellTypes } from '../../enums/cellTypes.enum';
import './Filters.css';

type FilterState = {
	filterSteps: FilterStep[];
	currentIndex: number;
};

type FilterProps = {
	onChange: any;
};

export class Filters extends React.Component<FilterProps, FilterState> {
	constructor(props: FilterProps) {
		super(props);

		this.state = {
			filterSteps: [],
			currentIndex: 0,
		};

		this.addFilter = this.addFilter.bind(this);
		this.deleteFilter = this.deleteFilter.bind(this);
	}
	// Unused Parameter 'event', Jetbrains IDE doesn't recognize standard underscore notation
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	addFilter(_event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
		let dim = null;

		const props: FilterStepProps = {
			onDelete: this.deleteFilter,
			onChange: (e) => (dim = e.currentTarget.value),
			id: this.state.currentIndex,
		};
		this.setState({
			filterSteps: this.state.filterSteps.concat(new FilterStep(props)),
			currentIndex: this.state.currentIndex + 1,
		});
	}

	deleteFilter(id: number): void {
		const newFilters = this.state.filterSteps.filter(function (step) {
			return step.props.id !== id;
		});
		this.setState({
			filterSteps: newFilters,
		});
	}

	handleClick = (): void => {
		this.props.onChange([
			{
				type: CellTypes.SOURCE_PORT,
				value: 2048,
			},
			{
				type: CellTypes.ARGUS_TRANSACTION_STATE,
				value: 'ECO',
			},
		]);
	};

	render(): React.ReactNode {
		// Use bootstrap classes

		return (
			<div className="col filter-container">
				<h1>Filters</h1>
				<Accordion>
					{this.state.filterSteps.map((filter) => (
						<FilterStep
							onChange={(e) => console.log(e.currentTarget.value)}
							onDelete={this.deleteFilter}
							id={filter.props.id}
							key={filter.props.id}
						/>
					))}
				</Accordion>
				<button onClick={this.addFilter} type="submit" className="btn btn-primary add-step-btn m-2">
					Add Step
				</button>
				<button onClick={this.handleClick} className="btn btn-primary add-step-btn m-2">
					Exec filter
				</button>
			</div>
		);
	}
}

export default Filters; // Don’t forget to use export default!
