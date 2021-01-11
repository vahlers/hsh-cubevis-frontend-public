import React, { Component, FormEvent } from 'react';
import { Accordion, Button, Card, Col, Form, Row, OverlayTrigger, Tooltip } from 'react-bootstrap';
import './FilterStep.css';
import { FaAngleRight, FaAngleDown, FaRegEye } from 'react-icons/fa';
import { ImCross } from 'react-icons/im';
import Select, { ValueType } from 'react-select';
import { CellTypes } from '../../enums/cellTypes.enum';
import { Dimension, Filter_, OptionType } from './Filters';
import { RangeFilter } from '../../models/rangeFilter.model';

import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { Ip } from '../../models/ip.modell';
import { Value } from '../../models/filter.model';

export interface FilterStepProps {
	id: number;
	dimensions: Dimension[];
	values: OptionType[];
	onChange: (id: number, mode: FilterStepMode, updated: Filter_) => void;
	onEyeClick: (id: number) => void;
	onDelete: (event: number) => void;
	metadata: { [p: string]: { key: string; label: string; type: string } };
	disabled: boolean;
	stepnumber: number;
	disableLooseFiltering: boolean;
	onExpand: (eventKey: number) => void;
	expanded: boolean;
	chartSelection: Filter_;
}

export enum FilterStepMode {
	ByValue,
	ByRange,
}

interface FilterStepState {
	filter: Filter_;
	valueIdFrom: number;
	valueIdTo: number;
	setMultiSelectValue: OptionType | OptionType[];
	setFromValue: OptionType;
	setToValue: OptionType;
	filterLabel: string;
	mode: FilterStepMode;
	radios: { name: string; value: FilterStepMode }[];
}

type ExpandArrowProps = {
	size: number;
	opacity: number;
	expanded: boolean;
};

class ExpandArrow extends Component<ExpandArrowProps> {
	render(): React.ReactNode {
		if (this.props.expanded) {
			return <FaAngleDown size={this.props.size} opacity={this.props.opacity} />;
		} else {
			return <FaAngleRight size={this.props.size} opacity={this.props.opacity} />;
		}
	}
}

const Range = Slider.createSliderWithTooltip(Slider.Range);

//Utility methods
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isValue = (testElem: Value | Value[] | RangeFilter<Value>): testElem is Value =>
	typeof testElem === 'string' || typeof testElem === 'number' || testElem instanceof Ip;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isValueArray = (testElem: Value | Value[] | RangeFilter<Value>): testElem is Value[] => Array.isArray(testElem);

const isRangeFilter = (testElem: Value | Value[] | RangeFilter<Value>): testElem is RangeFilter<Value> =>
	(testElem as RangeFilter<Value>).from !== undefined;

export class FilterStep extends Component<FilterStepProps, FilterStepState> {
	constructor(props: FilterStepProps) {
		super(props);

		this.state = {
			mode: FilterStepMode.ByValue,
			filter: {
				type: this.props.dimensions[0].value,
				value: null,
			},
			valueIdFrom: -1,
			valueIdTo: -1,
			setMultiSelectValue: null,
			setFromValue: null,
			setToValue: null,
			filterLabel: '*',
			radios: [
				{ name: 'By Value', value: FilterStepMode.ByValue },
				{ name: 'By Range', value: FilterStepMode.ByRange },
			],
		};
	}

	componentDidUpdate = async (prevProps: FilterStepProps): Promise<void> => {
		if (this.props.disableLooseFiltering && this.props.disableLooseFiltering !== prevProps.disableLooseFiltering) {
			this.setState({ mode: FilterStepMode.ByValue });
			let currentOption = null;
			let currentValue = this.state.filter.value;
			if (currentValue !== null) {
				if (Array.isArray(currentValue) && currentValue.length === 1) {
					currentValue = currentValue[0];
				} else if (isRangeFilter(currentValue)) {
					// currentValue = currentValue as RangeFilter<Value>;
					if (currentValue.from !== null) {
						currentValue = currentValue.from;
					} else {
						currentValue = currentValue.to;
					}
				}
				currentOption = this.props.values.find((opt) => opt.value === currentValue);
			}
			this.setState({ setMultiSelectValue: currentOption });
		}
		if (this.props.chartSelection !== null && this.props.chartSelection !== prevProps.chartSelection) {
			const newFilter = this.props.chartSelection;
			let newSetMulti = null;
			let newSetFrom = null;
			let newSetTo = null;
			let valueIdFrom = -1;
			let valueIdTo = -1;
			let mode = FilterStepMode.ByValue;

			if (isValue(newFilter.value)) {
				newSetMulti = this.props.values.find((value) => value.value === newFilter.value);
			} else if (isValueArray(newFilter.value)) {
				const newFilterValues = newFilter.value as Value[];
				newSetMulti = this.props.values.filter((value) => newFilterValues.includes(value.value));
			} else {
				const newFilterValue = newFilter.value as RangeFilter<Value>;
				newSetFrom = this.props.values.find((value) => value.value === newFilterValue.from.toString());
				valueIdFrom = this.props.values.indexOf(newSetFrom);
				newSetTo = this.props.values.find((value) => value.value === newFilterValue.to.toString());
				valueIdTo = this.props.values.indexOf(newSetTo);
				mode = FilterStepMode.ByRange;
			}
			this.setState(
				{
					mode: mode,
					filter: newFilter,
					setMultiSelectValue: newSetMulti,
					setFromValue: newSetFrom,
					setToValue: newSetTo,
					valueIdFrom: valueIdFrom,
					valueIdTo: valueIdTo,
				},
				() => {
					this.updateFilterLabel();
				},
			);
		}
	};

	notifyEyeClick = (): void => {
		this.props.onEyeClick(this.props.id);
	};

	notifyDelete = (): void => {
		this.props.onDelete(this.props.id);
	};

	emitChange = (updated = this.state.filter): void => {
		this.props.onChange(this.props.id, this.state.mode, updated);
	};

	changeDimension = async (event: React.ChangeEvent<HTMLSelectElement>): Promise<void> => {
		// first set the state by casting the event value to an enum

		const newType: CellTypes = parseInt(event.currentTarget.value);

		await this.setState(
			{
				filter: { type: newType, value: null },
				setMultiSelectValue: null,
				setFromValue: null,
				setToValue: null,
				valueIdFrom: -1,
				valueIdTo: -1,
			},
			this.updateFilterLabel,
		);

		// then publish the state to the onChange
		this.emitChange(this.state.filter);
	};

	changeRangeValue = async (isFromValue: boolean, selectedOption: OptionType): Promise<void> => {
		// set the slider and selects appropriately
		const selectedOptionIndex = this.props.values.indexOf(selectedOption);
		if (isFromValue) {
			this.setState({
				valueIdFrom: selectedOption === null ? -1 : selectedOptionIndex,
				setFromValue: selectedOption,
			});
		} else {
			this.setState({
				valueIdTo: selectedOption === null ? -1 : selectedOptionIndex,
				setToValue: selectedOption,
			});
		}

		const changedValue = selectedOption === null ? null : selectedOption.value;
		let newValue: RangeFilter<Value> = { from: null, to: null };
		// if there is an old Filter and it is a RangeFilter, reuse the old values
		if (this.state.filter.value !== null && isRangeFilter(this.state.filter.value)) {
			newValue = this.state.filter.value as RangeFilter<Value>;
		}

		newValue = newValue as RangeFilter<Value>;
		if (isFromValue) {
			newValue.from = changedValue;
		} else {
			newValue.to = changedValue;
		}
		// if from is larger than to, swap em
		if (newValue.from !== null && newValue.to !== null && newValue.from > newValue.to) {
			const tmp = newValue.from;
			newValue.from = newValue.to;
			newValue.to = tmp;
		}

		await this.setState({
			filter: { type: this.state.filter.type, value: newValue },
		});

		this.updateFilterLabel();
		this.emitChange();
	};

	handleFromChange = (selected?: ValueType<OptionType> | OptionType[] | null): void => {
		if (selected === null || selected === undefined) {
			this.changeRangeValue(true, null);
		} else {
			const value = selected as OptionType;
			if (Array.isArray(value)) {
				// we don't allow multi selection here, so this should never happen
				console.error('Unexpected type passed to ReactSelect onChange handler');
			} else {
				this.changeRangeValue(true, value);
			}
		}
	};

	handleToChange = (selected?: ValueType<OptionType> | OptionType[] | null): void => {
		if (selected === null || selected === undefined) {
			this.changeRangeValue(false, null);
		} else {
			const value = selected as OptionType;
			if (Array.isArray(value)) {
				// we don't allow multi selection, so this should never happen
				console.error('Unexpected type passed to ReactSelect onChange handler');
			} else {
				this.changeRangeValue(false, value);
			}
		}
	};

	handleSliderChange = async ([indexFrom, indexTo]: number[]): Promise<void> => {
		// object destructing assignment
		const { values } = this.props;
		if (indexFrom > indexTo) {
			const tmp = indexFrom;
			indexFrom = indexTo;
			indexTo = tmp;
		}

		const fromValue = indexFrom >= 0 ? values[indexFrom].value : null;
		const toValue = indexTo >= 0 ? values[indexTo].value : null;

		await this.setState({
			valueIdFrom: indexFrom,
			valueIdTo: indexTo,
			setFromValue: values[indexFrom],
			setToValue: values[indexTo],
			filter: {
				type: this.state.filter.type,
				value: { from: fromValue, to: toValue },
			},
		});
		this.updateFilterLabel();
	};

	sliderChange = async (index: number): Promise<void> => {
		// object destructing assignment
		const { values } = this.props;

		const newValue = index >= 0 ? values[index].value : null;

		await this.setState({
			valueIdFrom: index,
			valueIdTo: -1,
			setFromValue: values[index],
			setToValue: values[-1],
			filter: {
				type: this.state.filter.type,
				value: { from: newValue, to: null },
			},
		});
		this.updateFilterLabel();
	};

	handleRadioBtnChange = (event: FormEvent<HTMLInputElement>): void => {
		const value = parseInt(event.target['id'].slice(-1)) as FilterStepMode;
		if (value !== FilterStepMode.ByValue && value !== FilterStepMode.ByRange) return;
		this.setState({ mode: value });
	};

	handleMultiSelect = async (selected?: ValueType<OptionType> | OptionType[] | null): Promise<void> => {
		let newValue = null;
		let setMultiValue = null;
		if (selected !== undefined && selected !== null) {
			const value = selected as OptionType;
			if (Array.isArray(value)) {
				if (value.length === 0) {
					newValue = null;
				} else {
					newValue = (selected as OptionType[]).map((elem) => elem.value);
					setMultiValue = selected as OptionType[];
				}
			} else {
				newValue = (selected as OptionType).value;
				setMultiValue = selected as OptionType;
			}
		}
		await this.setState({
			filter: { type: this.state.filter.type, value: newValue },
			setMultiSelectValue: setMultiValue,
		});
		this.emitChange({ type: this.state.filter.type, value: newValue });
		this.updateFilterLabel();
	};

	updateFilterLabel = (): void => {
		const value = this.state.filter.value;
		let newLabel = '';
		if (value === null || value === undefined) {
			newLabel = '*';
		} else if (this.state.mode === FilterStepMode.ByValue) {
			if (Array.isArray(value)) {
				if (value.length === 0) {
					newLabel = '*';
				}
				// showing more than 4 values gets crowded
				for (let i = 0; i < value.length && i <= 3; i++) {
					if (i > 0) {
						if (i % 2 === 1) {
							newLabel += ', ';
						}
						newLabel += '\n';
					}
					newLabel += value[i];
				}
				if (value.length > 4) {
					newLabel += ' ...';
				}
			} else {
				newLabel = value.toString();
			}
		} else if (this.state.mode === FilterStepMode.ByRange) {
			const from = (value as RangeFilter<Value>).from;
			const to = (value as RangeFilter<Value>).to;

			if (from === null && to === null) {
				newLabel = '*';
			} else if (from === to) {
				newLabel = from.toString();
			} else if (from !== null && to === null) {
				newLabel = from.toString();
			} else if (to !== null && from === null) {
				newLabel = to.toString();
			} else {
				newLabel = from.toString() + ' : ' + to.toString();
			}
		}
		this.setState({ filterLabel: newLabel });
	};

	rotateArrow = (): void => {
		this.props.onExpand(this.props.id);
	};

	/**
	 * Renders tooltip with custom message.
	 * @param message The tooltip message.
	 */
	renderTooltip = (message: string): JSX.Element => <Tooltip id="button-tooltip">{message}</Tooltip>;

	radioButtons = (): JSX.Element[] => {
		const radioButtons = [];
		this.state.radios.forEach((radio, idx) => {
			radioButtons.push(
				<Form.Check
					onChange={(e) => this.handleRadioBtnChange(e)}
					inline
					checked={this.state.mode === radio.value}
					name={`button-group-${this.props.id}`}
					label={radio.name}
					type="radio"
					key={`radio-${this.props.id}-${idx}`}
					id={`radio-${this.props.id}-${idx}`}
					disabled={this.props.disableLooseFiltering}
				/>,
			);
		});
		return radioButtons;
	};

	render(): React.ReactNode {
		const { values } = this.props;
		return (
			<Card id={this.props.id.toString()} className="overflow-visible">
				<Card.Header className="filter-header">
					<Row>
						<OverlayTrigger
							placement="top"
							delay={{ show: 250, hide: 400 }}
							overlay={this.renderTooltip("Expand dimension's value selection")}
						>
							<Accordion.Toggle
								className="arrow-button"
								as={Button}
								variant="link"
								eventKey={'' + this.props.id}
								onClick={this.rotateArrow}
							>
								<ExpandArrow
									size={25}
									opacity={this.props.disabled ? 0.4 : 1}
									expanded={this.props.expanded}
								/>
							</Accordion.Toggle>
						</OverlayTrigger>
						<div className="step-number">{this.props.stepnumber}.</div>
						<Col xs={4}>
							<OverlayTrigger
								placement="top"
								delay={{ show: 250, hide: 400 }}
								overlay={this.renderTooltip('Select dimension')}
							>
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
							</OverlayTrigger>
						</Col>
						<Col xs={4}>
							<h6 className="text-center filter-text">{this.state.filterLabel}</h6>
						</Col>
						<Col xs={3}>
							<OverlayTrigger
								placement="top"
								delay={{ show: 250, hide: 250 }}
								overlay={this.renderTooltip('Delete step')}
							>
								<Button className="float-right step-btn" variant="link" onClick={this.notifyDelete}>
									<ImCross size="18" color="red" opacity={this.props.disabled ? 0.4 : 1} />
								</Button>
							</OverlayTrigger>
							<OverlayTrigger
								placement="top"
								delay={{ show: 250, hide: 250 }}
								overlay={this.renderTooltip('Hide or show this step')}
							>
								<Button className="float-right step-btn" variant="link" onClick={this.notifyEyeClick}>
									<FaRegEye size="24" opacity={this.props.disabled ? 0.4 : 1} />
								</Button>
							</OverlayTrigger>
						</Col>
					</Row>
				</Card.Header>
				<Accordion.Collapse eventKey={this.props.id.toString()}>
					<Card.Body className="filter-body">
						{this.radioButtons()}
						<div className={this.state.mode === FilterStepMode.ByRange ? '' : 'hide-filter-step'}>
							<Row>
								<Col>
									<Form.Group>
										<Form.Label>From</Form.Label>
										<Select
											options={values}
											value={this.state.setFromValue}
											isSearchable={true}
											isClearable={true}
											onChange={this.handleFromChange}
											placeholder={'*'}
										/>
									</Form.Group>
								</Col>
								<Col>
									<Form.Group>
										<Form.Label>To</Form.Label>
										<Select
											options={values}
											value={this.state.setToValue}
											isSearchable={true}
											isClearable={true}
											onChange={this.handleToChange}
											placeholder={'*'}
										/>
									</Form.Group>
								</Col>
							</Row>
							<Range
								value={[this.state.valueIdFrom, this.state.valueIdTo]}
								min={-1}
								max={values.length - 1}
								tipFormatter={(index) =>
									index >= 0 && index < values.length ? values[index].label : '*'
								}
								onChange={this.handleSliderChange}
								onAfterChange={() => this.emitChange()}
								allowCross={true}
							/>
						</div>
						<div className={this.state.mode === FilterStepMode.ByValue ? '' : 'hide-filter-step'}>
							<Form.Group>
								<Form.Label>Select</Form.Label>
								<Select
									value={this.state.setMultiSelectValue}
									isMulti={!this.props.disableLooseFiltering}
									options={values}
									isSearchable={true}
									isClearable={!this.props.disableLooseFiltering}
									onChange={this.handleMultiSelect}
									placeholder={'*'}
								/>
							</Form.Group>
						</div>
					</Card.Body>
				</Accordion.Collapse>
			</Card>
		);
	}
}
