import React from 'react';
import * as d3 from 'd3';
import { COLOR_SCALE, SCORE_MIN, SCORE_MAX } from '../../helpers/constants';
import './Colorbar.css';

type ColorbarProps = {
	width: number;
	height: number;
};

class Colorbar extends React.Component<ColorbarProps, unknown> {
	constructor(props: ColorbarProps) {
		super(props);
	}

	componentDidMount(): void {
		const width = `${this.props.width}px`;
		const height = `${this.props.height}px`;
		const div = d3.select('#color-bar-svg'),
			svg = div.append('svg');

		const ctxProps = this.props;
		svg.attr('width', width).attr('height', height).style('border', '1px solid black');

		const svgDefs = svg.append('defs');

		const mainGradient = svgDefs.append('linearGradient').attr('id', 'mainGradient');

		COLOR_SCALE.forEach((c) => {
			mainGradient.append('stop').attr('style', `stop-color: ${c[1]};`).attr('offset', `${c[0]}`);
		});

		const offset = 8;

		svg.append('rect').classed('filled', true).attr('width', '100%').attr('height', height);
		svg.append('text')
			.attr('x', offset)
			.attr('y', ctxProps.height / 2)
			.attr('dy', '.35em')
			.text(SCORE_MIN.toFixed(1).toString());
		svg.append('text')
			.attr('x', ctxProps.width - offset)
			.attr('text-anchor', 'end')
			.attr('y', ctxProps.height / 2)
			.attr('dy', '.35em')
			.text(SCORE_MAX.toFixed(1).toString());
	}

	render(): JSX.Element {
		return (
			<div className="color-bar-container">
				<div id="color-bar-svg"></div>
			</div>
		);
	}
}

export default Colorbar;
