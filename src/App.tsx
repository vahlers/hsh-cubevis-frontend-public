import React from 'react';
import './App.css';

import { DataProcessingService } from './services/dataProcessing.service';
import { CsvRetrievalService } from './services/csvRetrieval.service';
import { CellTypes } from './enums/cellTypes.enum';

import ParallelCoords from './components/parallelCoords/ParallelCoords';
import Filters from './components/filters/Filters';
import ChartsView from './components/chartsView/ChartsView';

class App extends React.Component<unknown> {
	constructor(props: unknown) {
		super(props);
		this.getData();
	}
	state = {
		data: [],
		metadata: {},
	};
	getData = async () => {
		console.log('getData() called');

		// this will at some point be provided by the <Filter></Filter> component
		const dimensions = [
			{ type: CellTypes.SOURCE_IP },
			{ type: CellTypes.DESTINATION_IP },
			{ type: CellTypes.SOURCE_PORT },
			{ type: CellTypes.DESTINATION_PORT },
			{ type: CellTypes.NETWORK_PROTOCOL },
			{ type: CellTypes.NETWORK_TRANSPORT },
			{ type: CellTypes.ARGUS_TRANSACTION_STATE },
		];

		// this metadata should be provided by the data service
		const metadata = {};
		dimensions.forEach((dim) => {
			const key = CsvRetrievalService.modelKeyName(dim.type);
			metadata[key] = {
				label: key,
				type: ['sourcePort', 'destinationPort'].includes(key) ? 'numeric' : 'nominal',
			};
		});

		const dataService = DataProcessingService.instance();
		const data = await dataService.getCuboid(dimensions);

		this.setState({
			data,
			metadata,
		});
	};
	render() {
		return (
			<div className="App">
				<div className="row bg-primary w-75 align-items-center">
					<div className="col bg-primary">
						<div className="row">
							<Filters />
							<ChartsView />
						</div>
						<div className="row">
							<ParallelCoords metadata={this.state.metadata} data={this.state.data}></ParallelCoords>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
export default App;
