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

interface FilterStepState {
	filter: Filter;
	setValue: OptionType;
}

export class FilterStep extends Component<FilterStepProps, FilterStepState> {
	constructor(props: FilterStepProps) {
		super(props);

		this.state = {
			filter: {
				type: this.props.dimensions[0].value,
				value: null,
			},
			setValue: null,
		};
	}

	notifyEyeClick = (): void => {
		this.props.onEyeClick(this.props.id);
	};

	notifyDelete = (): void => {
		this.props.onDelete(this.props.id);
	};

	changeDimension = (event: React.ChangeEvent<HTMLSelectElement>): void => {
		// first set the state by casting the event value to an enum

		const newType: CellTypes = parseInt(event.currentTarget.value);

		this.setState({ filter: { type: newType, value: null }, setValue: null });

		console.log('filter ' + this.props.id, newType);
		// then publish the state to the onChange
		this.props.onChange(this.props.id, { type: newType, value: null });
	};

	changeValue = async (selected?: ValueType<DimensionValue> | DimensionValue[] | null): Promise<void> => {
		if (selected === null || selected === undefined) {
			await this.setState({ filter: { type: this.state.filter.type, value: null }, setValue: null });
			this.props.onChange(this.props.id, { type: this.state.filter.type, value: null });
		} else {
			const value = (selected as DimensionValue).value;
			if (Array.isArray(value)) {
				// we don't allow multi selection, so this should never happen
				throw new Error('Unexpected type passed to ReactSelect onChange handler');
			} else {
				this.setState({
					filter: { type: this.state.filter.type, value: value },
					setValue: { value: value.toString(), label: value.toString() },
				});
			}
			this.props.onChange(this.props.id, { type: this.state.filter.type, value: value });
		}
	};

	render(): React.ReactNode {
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
							<h5 className="text-center filter-text">
								{this.state.filter.value !== null ? this.state.filter.value : '*'}
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
							value={this.state.setValue}
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
