import React from 'react';
import { FaChartBar } from 'react-icons/fa';
import { InfoMessageProps } from './messages/InfoMessageProps';

/**
 * This component is useful to display that there is no data for the requested filters.
 */
class ChartsNotAvailableMessage extends React.Component<InfoMessageProps> {
	render(): JSX.Element {
		return (
			<div className={this.props.className}>
				<FaChartBar size={80} />
				<h2>No Data</h2>
				<h5>{this.props.message}</h5>
			</div>
		);
	}
}

export default ChartsNotAvailableMessage;
