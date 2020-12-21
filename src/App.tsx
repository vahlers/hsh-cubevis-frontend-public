import React from 'react';
import './App.css';

import { DataProcessingService } from './services/dataProcessing.service';
import { CellTypes } from './enums/cellTypes.enum';

import ParallelCoords from './components/parallelCoords/ParallelCoords';
import Filters from './components/filters/Filters';
import ChartsView from './components/chartsView/ChartsView';
import Colorbar from './components/colorBar/Colorbar';
import { CubeCellModel } from './models/cell.model';
import { Filter } from './models/filter.model';
import { DataServiceHelper } from './helpers/dataService.helper';
import { FilterParameter } from './models/filter.model';
import { Resizable, ResizeCallback } from 're-resizable';

type AppState = {
	metadata: any;
	data: any;
	filters: FilterParameter;
	filteredData: CubeCellModel[];
	filteredCountData: CubeCellModel[];
	chartSelection: any;
};

class App extends React.Component<unknown, AppState> {
	private chartRef;

	constructor(props: unknown) {
		super(props);
		this.setup();
		this.chartRef = React.createRef();
	}

	state = {
		metadata: {},
		data: [],
		filters: new FilterParameter(),
		filteredData: [],
		filteredCountData: [],
		chartSelection: null,
	};

	// kinda hacky, but does its job. is there a better alternative?
	setStateAsync(state): Promise<unknown> {
		return new Promise((resolve) => this.setState(state, resolve));
	}

	setup = async (): Promise<unknown> => {
		await this.getMetadata();
		await this.getData();

		return this.setState({ filteredData: this.state.data, filteredCountData: this.state.data });
	};

	handleFilterChange = async (filters: FilterParameter): Promise<unknown> => {
		return this.setFilteredData(filters);
	};

	handleChartSelection = async (chartSelection: FilterParameter): Promise<unknown> => {
		// propagating the filter from the ChartsView up to App and then back down to Filters is not great, but works
		// a possible extension would be using some kind of state management for the filters, for more of that, see /docs/possible-extensions.md

		await this.setStateAsync({ chartSelection });

		// to be able to listen for the same click twice, the selection is removed immediately after setting it
		return this.setState({ chartSelection: null });
	};

	getMetadata = async (): Promise<unknown> => {
		const dataService = DataProcessingService.instance();
		const metadata = await dataService.getMetadata();

		return this.setStateAsync({ metadata });
	};

	setFilteredData = async (filters: FilterParameter): Promise<unknown> => {
		const dataService = DataProcessingService.instance();
		// if filter array is empty, select all dimensions
		const dimensions =
			filters && filters.getAllCelltypes().length
				? filters.getAllCelltypes().map((t) => ({ type: t }))
				: Object.keys(this.state.metadata).map((type) => ({ type: parseInt(type) as CellTypes }));

		const filteredData = await dataService.getCuboid(dimensions, filters);
		const filteredCountData = await dataService.getCuboidWithCount(dimensions, filters);
		const data = await dataService.getCuboid(dimensions);

		// caution: if you call setState once for each of the props, all children will rerender multiple times
		// this is probably not a desired behavior and costs performance
		return this.setStateAsync({
			filteredData: filteredData,
			filteredCountData: filteredCountData,
			data: data,
			filters: filters,
		});
	};

	getData = async (): Promise<unknown> => {
		const dataService = DataProcessingService.instance();
		const dimensions = Object.keys(this.state.metadata).map((type) => ({ type: parseInt(type) as CellTypes }));
		const data = await dataService.getCuboid(dimensions);

		return this.setStateAsync({ data });
	};

	refreshAfterResize = (ResizeCallback): void => {
		this.handleFilterChange(this.state.filters);
	};

	render(): React.ReactNode {
		return (
			<div className="App flex-container">
				<Resizable
					defaultSize={{
						width: '45vw',
						height: '100%',
					}}
					minWidth="20%"
					maxWidth="75%"
					bounds="parent"
					enable={{ right: true }}
					onResizeStop={this.refreshAfterResize}
					className="filter-container-flex item-container"
				>
					<Filters
						onChange={this.handleFilterChange}
						metadata={this.state.metadata}
						chartSelection={this.state.chartSelection}
					/>
				</Resizable>

				<div className="charts-container">
					<Resizable
						enable={{ bottom: true }}
						defaultSize={{
							width: '100%',
							height: '40vh',
						}}
						onResizeStop={this.refreshAfterResize}
						minWidth="20vh"
						minHeight="30vh"
						maxHeight="60vh"
						className="parallel-container-flex item-container"
					>
						<ParallelCoords
							metadata={this.state.metadata}
							data={this.state.data}
							filters={this.state.filters}
						/>
					</Resizable>
					<div className="chart-container-flex item-container">
						<ChartsView
							data={this.state.filteredData}
							countData={this.state.filteredCountData}
							filters={this.state.filters}
							metadata={this.state.metadata}
							onSelection={this.handleChartSelection}
							ref={this.chartRef}
						/>
					</div>
					<div className="colorbar-container item-container">
						<Colorbar />
					</div>
				</div>
			</div>
		);
	}
}
export default App;
