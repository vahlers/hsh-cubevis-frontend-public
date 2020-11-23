import React from 'react';
import './App.css';

import { DataProcessingService } from './services/dataProcessing.service';
import { CellTypes } from './enums/cellTypes.enum';

import ParallelCoords from './components/parallelCoords/ParallelCoords';
import Filters from './components/filters/Filters';
import ChartsView from './components/chartsView/ChartsView';

import { USE_OLD_DATA_SCHEMA } from './helpers/constants';

class App extends React.Component<unknown> {
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
	};

	handleFilterChange = async (filters) => {
		this.getFilteredData(filters);
	};

	getMetadata = async () => {
		const dataService = DataProcessingService.instance();
		const metadata = await dataService.getMetadata();

		await this.setStateAsync({ metadata });
	};

	getFilteredData = async (filters) => {
		const dataService = DataProcessingService.instance();
		const dimensions = filters.map(({ type }) => ({ type }));
		const filteredData = await dataService.getCuboid(dimensions, filters);

		if (USE_OLD_DATA_SCHEMA) {
			await this.setStateAsync({ filteredData, filters });
		} else {
			const data = await dataService.getCuboid(dimensions);
			// caution: if you call setState once for each of the props, all children will rerender multiple times
			// this is probably not a desired behavior and costs performance
			await this.setStateAsync({ filteredData, data, filters });
		}
	};

	getData = async () => {
		const dataService = DataProcessingService.instance();

		const dimensions = Object.keys(this.state.metadata).map((type) => ({ type: parseInt(type) as CellTypes }));

		const data = await dataService.getCuboid(dimensions);

		await this.setStateAsync({ data });
	};
	render() {
		return (
			<div className="App">
				<div className="container">
					<div className="row">
						<Filters onChange={this.handleFilterChange} />
						<ChartsView />
					</div>
					<div className="row">
						<ParallelCoords
							metadata={this.state.metadata}
							data={this.state.data}
							filters={this.state.filters}
						></ParallelCoords>
					</div>
				</div>
			</div>
		);
	}
}
export default App;
