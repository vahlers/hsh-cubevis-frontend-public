import React from 'react';
import * as d3 from 'd3';
import { COLOR_SCALE, SCORE_MIN, SCORE_MAX } from '../../helpers/constants';
import './Colorbar.css';

class Colorbar extends React.Component<unknown> {
	state = {
		gradientStyle: null,
	};

	componentDidMount(): void {
		let gradientStyle = 'linear-gradient(90deg';

		COLOR_SCALE.forEach(([step, hex]) => {
			const stepValue: any = step;
			gradientStyle += `, ${hex} ${stepValue * 100}%`;
		});

		gradientStyle += ')';

		this.setState({ gradientStyle });
	}

	render(): JSX.Element {
		return (
			<div className="color-bar-container" style={{ background: this.state.gradientStyle }}>
				<div>{SCORE_MIN}</div>
				<div>{SCORE_MAX}</div>
			</div>
		);
	}
}

export default Colorbar;
