import React from 'react';
import './App.css';

import { DataProcessingService } from './services/dataProcessing.service';
import { CellTypes } from './enums/cellTypes.enum';

import ParallelCoords from './components/parallelCoords/ParallelCoords';
import Filters from './components/filters/Filters';
import ChartsView from './components/chartsView/ChartsView';
import { CubeCellModel } from './models/cell.model';
import { Filter } from './models/filter.model';

type AppState = {
	metadata: any;
	data: any;
	filters: Filter[];
	filteredData: CubeCellModel[];
};

class App extends React.Component<unknown, AppState> {
	constructor(props: unknown) {
		super(props);
		this.setup();
	}

	state = {
		metadata: {},
		data: [],
		filters: [],
		filteredData: [],
	};

	// kinda hacky, but does its job. is there a better alternative?
	setStateAsync(state) {
		return new Promise((resolve) => {
			this.setState(state, resolve);
		});
	}

	setup = async () => {
		await this.getMetadata();
		await this.getData();
		this.setState({ filteredData: this.state.data });
	};

	handleFilterChange = async (filters) => {
		await this.setFilteredData(filters);
	};

	getMetadata = async () => {
		const dataService = DataProcessingService.instance();
		const metadata = await dataService.getMetadata();

		await this.setStateAsync({ metadata });
	};

	setFilteredData = async (filters) => {
		const dataService = DataProcessingService.instance();
		const dimensions = filters.map(({ type }) => ({ type }));
		const filteredData = await dataService.getCuboid(dimensions, filters);
		const data = await dataService.getCuboid(dimensions);
		// caution: if you call setState once for each of the props, all children will rerender multiple times
		// this is probably not a desired behavior and costs performance
		await this.setStateAsync({ filteredData, data, filters: [...filters] });
	};

	getData = async () => {
		const dataService = DataProcessingService.instance();

		const dimensions = Object.keys(this.state.metadata).map((type) => ({ type: parseInt(type) as CellTypes }));

		const data = await dataService.getCuboid(dimensions);

		await this.setStateAsync({ data });
	};
	render(): React.ReactNode {
		return (
			<div className="App grid-container">
				<div className="filter-container item-container">
					<Filters onChange={this.handleFilterChange} metadata={this.state.metadata} />
				</div>
				<div className="chart-container item-container">
					<ChartsView data={this.state.filteredData} filters={this.state.filters} />
				</div>
				<div className="parallel-container item-container">
					<ParallelCoords
						metadata={this.state.metadata}
						data={this.state.data}
						filters={this.state.filters}
					/>
				</div>
			</div>
		);
	}
}
export default App;
