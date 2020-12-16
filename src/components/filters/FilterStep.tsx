import React, { Component } from 'react';
import { Accordion, Button, Card, Col, Form, Row } from 'react-bootstrap';
import './FilterStep.css';
import { FaAngleRight, FaRegEye } from 'react-icons/fa';
import { ImCross } from 'react-icons/im';
import Select, { ValueType } from 'react-select';
import { Value } from '../../models/filter.model';
import { CellTypes } from '../../enums/cellTypes.enum';
import { Dimension, OptionType, Filter_ } from './Filters';

import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

export interface FilterStepProps {
	id: number;
	dimensions: Dimension[];
	values: OptionType[];
	onChange: (id: number, updated: Filter_) => void;
	onEyeClick: (id: number) => void;
	onDelete: (event: number) => void;
	metadata: { [p: string]: { key: string; label: string; type: string } };
	disabled: boolean;
}

interface FilterStepState {
	filter: Filter_;
	valueIdFrom: number;
	valueIdTo: number;
	setFromValue: OptionType;
	setToValue: OptionType;
	filterLabel: string;
}

const Range = Slider.createSliderWithTooltip(Slider.Range);

export class FilterStep extends Component<FilterStepProps, FilterStepState> {
	constructor(props: FilterStepProps) {
		super(props);

		this.state = {
			filter: {
				type: this.props.dimensions[0].value,
				value: null,
			},
			valueIdFrom: -1,
			valueIdTo: -1,
			setFromValue: null,
			setToValue: null,
			filterLabel: '*',
		};
	}

	notifyEyeClick = (): void => {
		this.props.onEyeClick(this.props.id);
	};

	notifyDelete = (): void => {
		this.props.onDelete(this.props.id);
	};

	emitChange = (updated = this.state.filter): void => {
		this.props.onChange(this.props.id, updated);
	};

	changeDimension = (event: React.ChangeEvent<HTMLSelectElement>): void => {
		// first set the state by casting the event value to an enum

		const newType: CellTypes = parseInt(event.currentTarget.value);

		this.setState(
			{
				filter: { type: newType, value: null },
				setFromValue: null,
				setToValue: null,
				valueIdFrom: -1,
				valueIdTo: -1,
			},
			this.updateFilterLabel,
		);

		// then publish the state to the onChange
		this.emitChange({ type: newType, value: null });
	};

	changeValue = async (isFromValue: boolean, selectedOption: OptionType): Promise<void> => {
		// set the slider appropriately
		if (isFromValue) {
			this.setState({
				valueIdFrom: selectedOption === null ? -1 : this.props.values.indexOf(selectedOption),
			});
		} else {
			this.setState({
				valueIdTo: selectedOption === null ? -1 : this.props.values.indexOf(selectedOption),
			});
		}

		const value = this.state.filter.value;
		const changedValue = selectedOption === null ? null : selectedOption.value;
		// if the filter is not initiated
		if (value === null) {
			if (isFromValue) {
				await this.setState({
					filter: {
						type: this.state.filter.type,
						value: { from: changedValue, to: null },
					},
					setFromValue: selectedOption,
				});
			} else {
				await this.setState({
					filter: {
						type: this.state.filter.type,
						value: { from: null, to: changedValue },
					},
					setToValue: selectedOption,
				});
			}
		} else if (isFromValue) {
			// need to switch from and to
			if (changedValue > value.to) {
				value.from = value.to;
				value.to = changedValue;

				const newFromValue = this.state.setToValue;
				const newToValue = selectedOption;
				await this.setState({
					filter: { type: this.state.filter.type, value: value },
					setFromValue: newFromValue,
					setToValue: newToValue,
				});
			} else {
				value.from = changedValue;
				await this.setState({
					filter: { type: this.state.filter.type, value: value },
					setFromValue: selectedOption,
				});
			}
		} else {
			// need to switch from and to
			if (value.from > changedValue) {
				value.to = value.from;
				value.from = changedValue;

				const newFromValue = selectedOption;
				const newToValue = this.state.setFromValue;
				await this.setState({
					filter: { type: this.state.filter.type, value: value },
					setFromValue: newFromValue,
					setToValue: newToValue,
				});
			} else {
				value.to = changedValue;
				await this.setState({
					filter: { type: this.state.filter.type, value: value },
					setToValue: selectedOption,
				});
			}
		}
		this.updateFilterLabel();
		this.emitChange();
	};

	changeFromValue = (selected?: ValueType<OptionType> | OptionType[] | null): void => {
		if (selected === null || selected === undefined) {
			this.changeValue(true, null);
		} else {
			const value = selected as OptionType;
			if (Array.isArray(value)) {
				// we don't allow multi selection, so this should never happen
				console.error('Unexpected type passed to ReactSelect onChange handler');
			} else {
				this.changeValue(true, value);
			}
		}
	};

	changeToValue = (selected?: ValueType<OptionType> | OptionType[] | null): void => {
		if (selected === null || selected === undefined) {
			this.changeValue(false, null);
		} else {
			const value = selected as OptionType;
			if (Array.isArray(value)) {
				// we don't allow multi selection, so this should never happen
				console.error('Unexpected type passed to ReactSelect onChange handler');
			} else {
				this.changeValue(false, value);
			}
		}
	};

	sliderChange = async ([valueFrom, valueTo]: number[]): Promise<void> => {
		// object destructing assignment
		const { values } = this.props;
		if (valueFrom > valueTo) {
			const tmp = valueFrom;
			valueFrom = valueTo;
			valueTo = tmp;
		}

		const fromValue = valueFrom >= 0 ? values[valueFrom].value : null;
		const toValue = valueTo >= 0 ? values[valueTo].value : null;

		await this.setState({
			valueIdFrom: valueFrom,
			valueIdTo: valueTo,
			setFromValue: values[valueFrom],
			setToValue: values[valueTo],
			filter: {
				type: this.state.filter.type,
				value: { from: fromValue, to: toValue },
			},
		});
		this.updateFilterLabel();
	};

	updateFilterLabel = (): void => {
		if (this.state.filter.value === null) {
			this.setState({ filterLabel: '*' });
			return;
		}
		const from = this.state.filter.value.from;
		const to = this.state.filter.value.to;

		if (from === null && to === null) {
			this.setState({ filterLabel: '*' });
		} else if (from == to) {
			this.setState({ filterLabel: from.toString() });
		} else if (from !== null && to === null) {
			this.setState({ filterLabel: from.toString() });
		} else if (to !== null && from === null) {
			this.setState({ filterLabel: to.toString() });
		} else {
			this.setState({ filterLabel: from.toString() + ' : ' + to.toString() });
		}
	};

	render(): React.ReactNode {
		const { values } = this.props;
		return (
			<Card id={this.props.id.toString()} className="overflow-visible">
				<Card.Header className="filter-header">
					<Row>
						<Col xs={2}>
							<Accordion.Toggle as={Button} variant="link" eventKey={'' + this.props.id}>
								<FaAngleRight size="20" opacity={this.props.disabled ? 0.4 : 1} />
							</Accordion.Toggle>
						</Col>
						<Col xs={4}>
							<Form>
								<Form.Control as="select" onChange={this.changeDimension}>
									{this.props.dimensions.map((dim) => (
										<option
											key={this.props.id + '.' + dim.value}
											value={dim.value}
											disabled={this.props.disabled}
										>
											{dim.label}
										</option>
									))}
								</Form.Control>
							</Form>
						</Col>
						<Col xs={3}>
							<h5 className="text-center filter-text">{this.state.filterLabel}</h5>
						</Col>
						<Col xs={3}>
							<Button variant="link" onClick={this.notifyEyeClick}>
								<FaRegEye size="24" opacity={this.props.disabled ? 0.4 : 1} />
							</Button>
							<Button variant="link" onClick={this.notifyDelete}>
								<ImCross size="18" color="red" opacity={this.props.disabled ? 0.4 : 1} />
							</Button>
						</Col>
					</Row>
				</Card.Header>
				<Accordion.Collapse eventKey={this.props.id.toString()}>
					<Card.Body className="filter-body">
						<Form.Group>
							<Form.Label>From</Form.Label>
							<Select
								options={values}
								value={this.state.setFromValue}
								isSearchable={true}
								isClearable={true}
								onChange={this.changeFromValue}
								placeholder={'*'}
							/>
						</Form.Group>
						<Form.Group>
							<Form.Label>To</Form.Label>
							<Select
								options={values}
								value={this.state.setToValue}
								isSearchable={true}
								isClearable={true}
								onChange={this.changeToValue}
								placeholder={'*'}
							/>
						</Form.Group>
						<Range
							value={[this.state.valueIdFrom, this.state.valueIdTo]}
							min={-1}
							max={values.length - 1}
							tipFormatter={(index) => (index >= 0 && index < values.length ? values[index].label : '*')}
							onChange={this.sliderChange}
							onAfterChange={() => this.emitChange()}
							allowCross={true}
						/>
					</Card.Body>
				</Accordion.Collapse>
			</Card>
		);
	}
}
