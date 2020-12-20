import React from 'react';
import { GiMagnifyingGlass } from 'react-icons/gi';
import { InfoMessageProps } from './InfoMessageProps';

class UserInfoMessage extends React.Component<InfoMessageProps> {
	constructor(props: InfoMessageProps) {
		super(props);
	}

	// of the charts view
	render(): JSX.Element {
		return (
			<div className={this.props.className}>
				<GiMagnifyingGlass size={80} />
				<h2>No Data</h2>
				<h5> {this.props.message}</h5>
			</div>
		);
	}
}

export default UserInfoMessage;
