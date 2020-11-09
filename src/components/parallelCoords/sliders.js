import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

// *******************************************************
// RAIL
// *******************************************************
const railOuterStyle = {
	width: '100%',
};

const railInnerStyle = {
	position: 'absolute',
	width: '100%',
	height: 14,
	transform: 'translate(0%, -50%)',
	borderRadius: 7,
	pointerEvents: 'none',
	backgroundColor: '#F8F8F8',
};

export function SliderRail({ getRailProps }) {
	return (
		<Fragment>
			<div style={railOuterStyle} {...getRailProps()} />
			<div style={railInnerStyle} />
		</Fragment>
	);
}

SliderRail.propTypes = {
	getRailProps: PropTypes.func.isRequired,
};

// *******************************************************
// HANDLE COMPONENT
// *******************************************************
export function Handle({ domain: [min, max], handle: { id, value, percent }, disabled, getHandleProps }) {
	return (
		<Fragment>
			<div
				style={{
					left: `${percent}%`,
					position: 'absolute',
					transform: 'translate(-50%, -50%)',
					zIndex: 5,
					width: 28,
					height: 42,
					cursor: 'pointer',
					// border: '1px solid white',
					backgroundColor: 'none',
				}}
				{...getHandleProps(id)}
			/>
			<div
				role="slider"
				aria-valuemin={min}
				aria-valuemax={max}
				aria-valuenow={value}
				style={{
					left: `${percent}%`,
					position: 'absolute',
					transform: 'translate(-50%, -50%)',
					zIndex: 2,
					width: 24,
					height: 24,
					borderRadius: '50%',
					boxShadow: '1px 1px 1px 1px rgba(0, 0, 0, 0.3)',
					backgroundColor: '#3CA4D9',
				}}
			/>
		</Fragment>
	);
}

Handle.propTypes = {
	domain: PropTypes.array.isRequired,
	handle: PropTypes.shape({
		id: PropTypes.string.isRequired,
		value: PropTypes.number.isRequired,
		percent: PropTypes.number.isRequired,
	}).isRequired,
	getHandleProps: PropTypes.func.isRequired,
	disabled: PropTypes.bool,
};

Handle.defaultProps = {
	disabled: false,
};

// *******************************************************
// KEYBOARD HANDLE COMPONENT
// Uses a button to allow keyboard events
// *******************************************************
export function KeyboardHandle({ domain: [min, max], handle: { id, value, percent }, disabled, getHandleProps }) {
	return (
		<button
			role="slider"
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={value}
			style={{
				left: `${percent}%`,
				position: 'absolute',
				transform: 'translate(-50%, -50%)',
				zIndex: 2,
				width: 24,
				height: 24,
				borderRadius: '50%',
				boxShadow: '1px 1px 1px 1px rgba(0, 0, 0, 0.3)',
			}}
			{...getHandleProps(id)}
		/>
	);
}

KeyboardHandle.propTypes = {
	domain: PropTypes.array.isRequired,
	handle: PropTypes.shape({
		id: PropTypes.string.isRequired,
		value: PropTypes.number.isRequired,
		percent: PropTypes.number.isRequired,
	}).isRequired,
	getHandleProps: PropTypes.func.isRequired,
	disabled: PropTypes.bool,
};

KeyboardHandle.defaultProps = {
	disabled: false,
};

// *******************************************************
// TRACK COMPONENT
// *******************************************************
export function Track({ source, target, getTrackProps, disabled }) {
	return (
		<div
			style={{
				position: 'absolute',
				transform: 'translate(0%, -50%)',
				height: 14,
				zIndex: 1,
				backgroundColor: '#BABABA',
				borderRadius: 7,
				cursor: 'pointer',
				left: `${source.percent}%`,
				width: `${target.percent - source.percent}%`,
			}}
			{...getTrackProps()}
		/>
	);
}

Track.propTypes = {
	source: PropTypes.shape({
		id: PropTypes.string.isRequired,
		value: PropTypes.number.isRequired,
		percent: PropTypes.number.isRequired,
	}).isRequired,
	target: PropTypes.shape({
		id: PropTypes.string.isRequired,
		value: PropTypes.number.isRequired,
		percent: PropTypes.number.isRequired,
	}).isRequired,
	getTrackProps: PropTypes.func.isRequired,
	disabled: PropTypes.bool,
};

Track.defaultProps = {
	disabled: false,
};
