import React, { Component } from 'react';
import { Accordion, Button, Card, Col, Form, Row } from 'react-bootstrap';
import './FilterStep.css';
import { FaAngleRight, FaRegEye } from 'react-icons/fa';
import { ImCross } from 'react-icons/im';
import Select, { ValueType } from 'react-select';

export interface FilterStepProps {
	onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
	onDelete: (event: number) => void;
	id: number;
}

type StepState = {
	dimension: string;
	value: string;
};

type OptionType = {
	value: string;
	label: string;
};

const dimensions: OptionType[] = [
	{
		value: 'source_ip',
		label: 'Source IP',
	},
	{
		value: 'source_port',
		label: 'Source Port',
	},
	{
		value: 'destination_ip',
		label: 'Destination IP',
	},
	{
		value: 'destination_port',
		label: 'Destination Port',
	},
	{
		value: 'network_protocol',
		label: 'Network Protocol',
	},
	{
		value: 'network_transport',
		label: 'Network Transport',
	},
	{
		value: 'Argus_transaction_state',
		label: 'Argus Transaction State',
	},
];
const dim_values: OptionType[] = [
	{
		value: 'a',
		label: 'a',
	},
	{
		value: 'b',
		label: 'b',
	},
];

export class FilterStep extends Component<FilterStepProps, StepState> {
	constructor(props: FilterStepProps) {
		super(props);
		this.state = {
			dimension: 'source_ip',
			value: '*',
		};
		this.changeDimension = this.changeDimension.bind(this);
		this.changeValue = this.changeValue.bind(this);
		this.notifyDelete = this.notifyDelete.bind(this);
	}

	// Unused Parameter 'event', Jetbrains IDE doesn't recognize standard underscore notation
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	notifyDelete(_event: React.MouseEvent<HTMLElement, MouseEvent>): void {
		this.props.onDelete(this.props.id);
	}

	changeDimension(event: React.ChangeEvent<HTMLSelectElement>): void {
		this.setState({ dimension: event.currentTarget.value });
		this.props.onChange(event);
	}

	changeValue(selected?: ValueType<OptionType> | OptionType[] | null): void {
		const value = (selected as OptionType).value;
		if (value === null || value === undefined) {
			this.setState({ value: '*' });
		} else if (Array.isArray(value)) {
			// we don't allow multi selection, so this should never happen
			throw new Error('Unexpected type passed to ReactSelect onChange handler');
		} else {
			this.setState({ value: value });
		}
	}

	render(): React.ReactNode {
		return (
			<Card id={this.props.id.toString()} className="overflow-visible">
				<Card.Header className="filter-header">
					<Row>
						<Col xs={2}>
							<Accordion.Toggle as={Button} variant="link" eventKey={'' + this.props.id}>
								<FaAngleRight size="20" />
							</Accordion.Toggle>
						</Col>
						<Col xs={4}>
							<Form>
								<Form.Control as="select">
									{dimensions.map((dim) => (
										<option key={dim.value} value={dim.value}>
											{dim.label}
										</option>
									))}
								</Form.Control>
							</Form>
						</Col>
						<Col xs={3}>
							<h5 className="text-center filter-text">{this.state.value}</h5>
						</Col>
						<Col xs={3}>
							<Button variant="link">
								<FaRegEye size="24" />
							</Button>
							<Button variant="link" onClick={this.notifyDelete}>
								<ImCross size="18" color="red" />
							</Button>
						</Col>
					</Row>
				</Card.Header>
				<Accordion.Collapse eventKey={'' + this.props.id}>
					<Card.Body className="filter-body">
						<Select options={dim_values} isSearchable={true} onChange={this.changeValue} />
					</Card.Body>
				</Accordion.Collapse>
			</Card>
		);
	}
}
