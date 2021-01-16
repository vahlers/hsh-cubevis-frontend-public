import React from 'react';
import './App.css';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

import { DataProcessingService } from './services/dataProcessing.service';
import { CellTypes } from './enums/cellTypes.enum';

import ParallelCoords from './components/parallelCoords/ParallelCoords';
import Filters from './components/filters/Filters';
import ChartsView from './components/chartsView/ChartsView';
import Colorbar from './components/colorBar/Colorbar';
import { CubeCellModel } from './models/cell.model';
import { FilterParameter } from './models/filter.model';
import { FcInfo } from 'react-icons/fc';
import { Resizable } from 're-resizable';
import { DataType } from './enums/dataType.enum';

type AppState = {
	metadata: { [id: string]: { key: string; label: string; type: DataType } };
	data: CubeCellModel[];
	filters: FilterParameter;
	filteredData: CubeCellModel[];
	filteredCountData: CubeCellModel[];
	chartSelection: FilterParameter;
};

const dataService = DataProcessingService.instance();

class App extends React.Component<unknown, AppState> {
	private chartRef;

	constructor(props: unknown) {
		super(props);
		this.chartRef = React.createRef();
	}

	componentDidMount(): void {
		this.setup();
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
	setStateAsync(state: Partial<AppState>): Promise<void> {
		return new Promise((resolve) => this.setState(state as AppState, resolve));
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
		const metadata = dataService.getMetadata();

		return this.setStateAsync({ metadata });
	};

	setFilteredData = async (filters: FilterParameter): Promise<unknown> => {
		// if filter array is empty, select all dimensions
		const dimensions =
			filters && filters.getAllCelltypes().length
				? filters.getAllCelltypes().map((t) => ({ type: t }))
				: Object.keys(this.state.metadata).map((type) => ({ type: parseInt(type) as CellTypes }));

		const [filteredData, filteredCountData, data] = await Promise.all([
			dataService.getCuboid(dimensions, filters),
			dataService.getCuboidWithCount(dimensions, filters),
			dataService.getCuboid(dimensions),
		]);

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
		const dimensions = Object.keys(this.state.metadata).map((type) => ({ type: parseInt(type) as CellTypes }));
		const data = await dataService.getCuboid(dimensions);

		return this.setStateAsync({ data });
	};

	/**
	 * Renders tooltip with custom message.
	 * @param message The tooltip message.
	 */
	renderTooltip = (message: string): JSX.Element => <Tooltip id="button-tooltip">{message}</Tooltip>;
	refreshAfterResize = (): void => {
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
					<OverlayTrigger
						placement="right"
						delay={{ show: 250, hide: 400 }}
						overlay={this.renderTooltip(
							'Add a filter by specifying a dimension and a value, or a star to show all the values of the current filtered dimension. There must be only up to two dimensions with a star to show data. Clicking on an eye icon enables or disables the filter.',
						)}
					>
						<span className="infoGrid">
							<FcInfo size={25}></FcInfo>
						</span>
					</OverlayTrigger>
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
						<OverlayTrigger
							placement="left"
							delay={{ show: 250, hide: 400 }}
							overlay={this.renderTooltip(
								'Parallel coordinates show the filtered data in a more global way. It can be used to see the available dimensions, and understand what to filter next. A column represents a dimension, and can be dragged horizontally or sorted vertically.',
							)}
						>
							<span className="infoGrid">
								<FcInfo size={25}></FcInfo>
							</span>
						</OverlayTrigger>
						<ParallelCoords
							metadata={this.state.metadata}
							data={this.state.data}
							filters={this.state.filters}
						/>
					</Resizable>
					<div className="chart-container-flex item-container">
						<OverlayTrigger
							placement="left"
							delay={{ show: 250, hide: 400 }}
							overlay={this.renderTooltip(
								'You can navigate between charts using the left and right arrows or the bottom bars. The elements are colored according to their anomaly score.',
							)}
						>
							<span className="infoGrid">
								<FcInfo size={25}></FcInfo>
							</span>
						</OverlayTrigger>
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
						<OverlayTrigger
							placement="top"
							delay={{ show: 250, hide: 400 }}
							overlay={this.renderTooltip("Anomaly score's color bar")}
						>
							<Colorbar />
						</OverlayTrigger>
					</div>
				</div>
			</div>
		);
	}
}
export default App;
