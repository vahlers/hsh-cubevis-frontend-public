import React from 'react';
import { CubeCellModel } from '../../models/cell.model';
import { FilterParameter } from '../../models/filter.model';
import BarChart from './barChart/BarChart';
import BoxPlot from './boxPlot/BoxPlot';
import HeatMap from './heatMap/HeatMap';
import { Carousel, OverlayTrigger, Tooltip } from 'react-bootstrap';
import ChartsNotAvailableMessage from './ChartsNotAvailableMessage';
import { ChartsViewUtils } from './ChartsViewUtils';

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
	selectedIndex: number;
	looseDimensions: number;
	looseDimensionMapping: Record<number, number>;
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
			const looseDimensions = ChartsViewUtils.getLooseDimensionsCount(this.props.filters);
			await this.setStateAsync({
				filters: this.props.filters,
				data: this.props.data,
				countData: this.props.countData,
				looseDimensions: looseDimensions,
			});
		} else if (prevProps.filters !== this.props.filters) {
			const looseDimensions = ChartsViewUtils.getLooseDimensionsCount(this.props.filters);
			await this.setStateAsync({
				filters: this.props.filters,
				looseDimensions: looseDimensions,
			});
		} else if (prevProps.data !== this.props.data) {
			await this.setStateAsync({ data: this.props.data, countData: this.props.countData });
		}
	}

	/**
	 * Async pendant of setState.
	 * @param state The partial state of this component.
	 */
	setStateAsync(state: Partial<ChartsViewState>): Promise<void> {
		return new Promise((resolve) => {
			this.setState(state as ChartsViewState, resolve);
		});
	}

	constructor(props: ChartsViewProps) {
		super(props);
		this.state = {
			data: [],
			countData: [],
			filters: new FilterParameter(),
			metadata: {},
			selectedIndex: 0,
			looseDimensions: 0,
			looseDimensionMapping: {
				0: 1, // bar chart -> exactly 1 loose dimension
				1: 2, // heat map -> exactly 2 loose dimensions
				2: 1, // box plot -> exactly 1 loose dimension
			},
		};
	}

	/**
	 * Renders tooltip with custom message.
	 * @param message The tooltip message.
	 */
	renderTooltip = (message: string): JSX.Element => <Tooltip id="button-tooltip">{message}</Tooltip>;

	/**
	 * Save the selected index from carousel.
	 * @param selectedIndex Selected index from carousel.
	 */
	onSelect = (selectedIndex: number): void => {
		this.setState({ selectedIndex });
	};

	render(): JSX.Element {
		return (
			<Carousel
				className="w-100 h-100"
				id={ChartsView.containerName}
				interval={null}
				nextIcon={
					<OverlayTrigger
						placement="top"
						delay={{ show: 250, hide: 400 }}
						overlay={this.renderTooltip('Next chart')}
					>
						<span aria-hidden="true" className="carousel-control-next-icon" />
					</OverlayTrigger>
				}
				prevIcon={
					<OverlayTrigger
						placement="top"
						delay={{ show: 250, hide: 400 }}
						overlay={this.renderTooltip('Previous chart')}
					>
						<span aria-hidden="true" className="carousel-control-prev-icon" />
					</OverlayTrigger>
				}
				onSelect={this.onSelect}
			>
				<Carousel.Item className="carousel-child">
					<div
						className={
							this.state.looseDimensions <= this.state.looseDimensionMapping[this.state.selectedIndex]
								? ''
								: 'd-none'
						}
					>
						<BarChart
							data={this.state.data}
							metadata={this.state.metadata}
							filters={this.state.filters}
							onSelection={this.props.onSelection}
						/>
					</div>
					<ChartsNotAvailableMessage
						message="To enable the chart, choose at most one filter which is not settled to a specific value."
						className={
							this.state.looseDimensions <= this.state.looseDimensionMapping[this.state.selectedIndex]
								? 'd-none chart-no-data'
								: 'chart-no-data'
						}
					/>
				</Carousel.Item>
				<Carousel.Item className="carousel-child">
					<div
						className={
							this.state.looseDimensions === this.state.looseDimensionMapping[this.state.selectedIndex]
								? ''
								: 'd-none'
						}
					>
						<HeatMap
							data={this.state.data}
							metadata={this.state.metadata}
							filters={this.state.filters}
							onSelection={this.props.onSelection}
						/>
					</div>
					<ChartsNotAvailableMessage
						message="To enable the chart, add exactly two filters which are not settled to a specific value."
						className={
							this.state.looseDimensions === this.state.looseDimensionMapping[this.state.selectedIndex]
								? 'd-none chart chart-no-data'
								: 'chart chart-no-data'
						}
					/>
				</Carousel.Item>
				<Carousel.Item className="carousel-child">
					<div
						className={
							this.state.looseDimensions <= this.state.looseDimensionMapping[this.state.selectedIndex]
								? ''
								: 'd-none'
						}
					>
						<BoxPlot
							data={this.state.countData}
							metadata={this.state.metadata}
							filters={this.state.filters}
						/>
					</div>
					<ChartsNotAvailableMessage
						message="To enable the chart, choose at most one filter which is not settled to a specific value."
						className={
							this.state.looseDimensions <= this.state.looseDimensionMapping[this.state.selectedIndex]
								? 'd-none chart chart-no-data'
								: 'chart chart-no-data'
						}
					/>
				</Carousel.Item>
			</Carousel>
		);
	}
}

export default ChartsView;
