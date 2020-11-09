import React, { Component } from 'react';
import { Slider, Rail, Handles, Tracks } from 'react-compound-slider';
import { SliderRail, Handle, Track } from './sliders.js'; // example render components - source below

import PropTypes from 'prop-types';
const sliderStyle = {
	position: 'relative',
	width: '100%',
};

const defaultValues = [0, 65535];
class MySlider extends Component {
	state = {
		domain: [0, 65535],
		values: defaultValues.slice(),
		update: defaultValues.slice(),
		reversed: false,
	};

	onUpdate = (update) => {
		this.setState({ update }, () => {
			this.props.action(update);
		});
	};

	onChange = (values) => {
		this.setState({ values }, () => {
			this.props.action(values);
		});
	};

	setDomain = (domain) => {
		this.setState({ domain });
	};

	render() {
		const {
			state: { domain, values, update, reversed },
		} = this;

		return (
			<div style={{ width: '20vh', margin: '12px auto 36px auto' }}>
				<Slider
					style={{ width: 'inherit' }}
					mode={2}
					step={1}
					domain={domain}
					reversed={reversed}
					rootStyle={sliderStyle}
					onUpdate={this.onUpdate}
					onChange={this.onChange}
					values={values}
				>
					<Rail>{({ getRailProps }) => <SliderRail getRailProps={getRailProps} />}</Rail>
					<Handles>
						{({ handles, getHandleProps }) => (
							<div className="slider-handles">
								{handles.map((handle) => (
									<Handle
										key={handle.id}
										handle={handle}
										domain={domain}
										getHandleProps={getHandleProps}
									/>
								))}
							</div>
						)}
					</Handles>
					<Tracks left={false} right={false}>
						{({ tracks, getTrackProps }) => (
							<div className="slider-tracks">
								{tracks.map(({ id, source, target }) => (
									<Track key={id} source={source} target={target} getTrackProps={getTrackProps} />
								))}
							</div>
						)}
					</Tracks>
				</Slider>
			</div>
		);
	}
}

MySlider.propTypes = {
	action: PropTypes.func,
};

export default MySlider;
