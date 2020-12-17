import React from 'react';
import { CubeCellModel } from '../../models/cell.model';
import { FilterParameter } from '../../models/filter.model';
import './ChartsView.css';
import BarChart from './barChart/BarChart';
import BoxPlot from './boxPlot/BoxPlot';
import HeatMap from './heatMap/HeatMap';
import { Carousel } from 'react-bootstrap';

type ChartsViewProps = {
	data: CubeCellModel[];
	countData: CubeCellModel[];
	filters: FilterParameter;
	metadata: { [id: string]: { key: string; label: string; type: string } };
	onSelection;
};

type ChartsViewState = {
	data: CubeCellModel[];
	countData: CubeCellModel[];
	filters: FilterParameter;
	metadata: { [id: string]: { key: string; label: string; type: string } };
};

class ChartsView extends React.Component<ChartsViewProps, ChartsViewState> {
	static containerName = 'charts-view';
	async componentDidUpdate(prevProps: ChartsViewProps): Promise<void> {
		// meta data is only needed once
		if (prevProps.metadata !== this.props.metadata) {
			await this.setStateAsync({ metadata: this.props.metadata });
		}

		// for performance reasons, this has to be differentiated
		if (prevProps.filters !== this.props.filters && prevProps.data !== this.props.data) {
			await this.setStateAsync({
				filters: this.props.filters,
				data: this.props.data,
				countData: this.props.countData,
			});
		} else if (prevProps.filters !== this.props.filters) {
			await this.setStateAsync({ filters: this.props.filters });
		} else if (prevProps.data !== this.props.data) {
			await this.setStateAsync({ data: this.props.data, countData: this.props.countData });
		}
	}

	setStateAsync(state): Promise<void> {
		return new Promise((resolve) => {
			this.setState(state, resolve);
		});
	}

	constructor(props: ChartsViewProps) {
		super(props);
		this.state = {
			data: [],
			countData: [],
			filters: new FilterParameter(),
			metadata: {},
		};
	}

	render(): JSX.Element {
		return (
			<Carousel className="charts-view" id={ChartsView.containerName} interval={null}>
				<Carousel.Item className="carousel-child">
					<BarChart
						data={this.state.data}
						metadata={this.state.metadata}
						filters={this.state.filters}
						onSelection={this.props.onSelection}
					/>
				</Carousel.Item>
				<Carousel.Item className="carousel-child">
					<HeatMap
						data={this.state.data}
						metadata={this.state.metadata}
						filters={this.state.filters}
						onSelection={this.props.onSelection}
					/>
				</Carousel.Item>
				<Carousel.Item className="carousel-child">
					<BoxPlot data={this.state.countData} metadata={this.state.metadata} filters={this.state.filters} />
				</Carousel.Item>
			</Carousel>
		);
	}
}

export default ChartsView;
