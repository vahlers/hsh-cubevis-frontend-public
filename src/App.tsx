import React from 'react';
import './App.css';

import { DataProcessingService } from './services/dataProcessing.service';
import { CellTypes } from './enums/cellTypes.enum';

import ParallelCoords from './components/parallelCoords/ParallelCoords';
import Filters from './components/filters/Filters';
import ChartsView from './components/chartsView/ChartsView';

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
		await this.setStateAsync({ filters });

		this.getFilteredData();
	};

	getMetadata = async () => {
		const dataService = DataProcessingService.instance();
		const metadata = await dataService.getMetadata();

		await this.setStateAsync({ metadata });
	};

	getFilteredData = async () => {
		const dataService = DataProcessingService.instance();
		const dimensions = this.state.filters.map(({ type }) => ({ type }));
		const filteredData = await dataService.getCuboid(dimensions, this.state.filters);

		await this.setStateAsync({ filteredData });
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
