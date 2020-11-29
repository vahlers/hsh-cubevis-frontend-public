import React, { Component } from 'react';
import { Accordion, Button, Card, Col, Form, Row } from 'react-bootstrap';
import './FilterStep.css';
import { FaAngleRight, FaRegEye } from 'react-icons/fa';
import { ImCross } from 'react-icons/im';
import Select, { ValueType } from 'react-select';
import { Filter } from '../../models/filter.model';
import { CellTypes } from '../../enums/cellTypes.enum';
import { Dimension, DimensionValue, OptionType } from './Filters';

export interface FilterStepProps {
	id: number;
	dimensions: Dimension[];
	values: OptionType[];
	onChange: (id: number, event: Filter) => void;
	onEyeClick: (id: number) => void;
	onDelete: (event: number) => void;
	metadata: { [p: string]: { key: string; label: string; type: string } };
	disabled: boolean;
}

export class FilterStep extends Component<FilterStepProps, Filter> {
	constructor(props: FilterStepProps) {
		super(props);

		this.state = {
			type: this.props.dimensions[0].value,
			value: null,
		};

		// trigger the onChange to register the default selection as a filter
		this.props.onChange(this.props.id, this.state);

		this.changeDimension = this.changeDimension.bind(this);
		this.changeValue = this.changeValue.bind(this);
		this.notifyEyeClick = this.notifyEyeClick.bind(this);
		this.notifyDelete = this.notifyDelete.bind(this);
		this.getDims = this.getDims.bind(this);
	}

	notifyEyeClick(_event: React.MouseEvent<HTMLElement, MouseEvent>): void {
		this.props.onEyeClick(this.props.id);
	}

	// Unused Parameter 'event', Jetbrains IDE doesn't recognize standard underscore notation
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	notifyDelete(_event: React.MouseEvent<HTMLElement, MouseEvent>): void {
		this.props.onDelete(this.props.id);
	}

	changeDimension(event: React.ChangeEvent<HTMLSelectElement>): void {
		// first set the state by casting the event value to an enum

		const newType: CellTypes = parseInt(event.currentTarget.value);

		this.setState({ type: newType, value: null });
		console.log('filter ' + this.props.id, newType);
		// then publish the state to the onChange
		this.props.onChange(this.props.id, { type: newType, value: null });
	}

	changeValue(selected?: ValueType<DimensionValue> | DimensionValue[] | null): void {
		if (selected === null || selected === undefined) {
			this.setState({ value: null });
			return;
		}
		const value = (selected as DimensionValue).value;
		if (Array.isArray(value)) {
			// we don't allow multi selection, so this should never happen
			throw new Error('Unexpected type passed to ReactSelect onChange handler');
		} else {
			this.setState({ value: value });
		}
		this.props.onChange(this.props.id, { type: this.state.type, value: value });
	}

	getDims(): OptionType[] {
		const options = this.props.dimensions;
		const selfOption = this.props.metadata[this.state.type];

		// If option for current CellType is already present just return
		for (let i = 0; i < options.length; i++) {
			if (options[i].value === this.state.type) {
				return options;
			}
		}
		// Otherwise insert our option at index: this.state.type
		options.splice(this.state.type, 0, { label: selfOption.label, value: this.state.type });
		return options;
	}

	render(): React.ReactNode {
		return (
			//TODO workaround if only letting the user select valid dimensions is impossible: bg={this.props.invalidState}
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
									{this.getDims().map((dim) => (
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
							<h5 className="text-center filter-text">
								{this.state.value !== null ? this.state.value : '*'}
							</h5>
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
						<Select
							options={this.props.values}
							isSearchable={true}
							isClearable={true}
							onChange={this.changeValue}
							placeholder={'*'}
						/>
					</Card.Body>
				</Accordion.Collapse>
			</Card>
		);
	}
}
