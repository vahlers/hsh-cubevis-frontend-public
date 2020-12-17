import { COLOR_SCALE, SCORE_MIN, SCORE_MAX } from '../../../helpers/constants';
import { BoxPlotData } from './BoxPlotData';

export class BoxPlotUtils {
	static createBoxTrace(data: BoxPlotData) {
		return {
			type: 'box',
			name: data.dimension,
			q1: [data.firstQuartile],
			median: [data.meanValue],
			mean: [data.meanValue],
			q3: [data.thirdQuartile],
			lowerfence: [data.lowerFence],
			upperfence: [data.upperFence],
			y: [data.dimension],
			orientation: 'h',
			sd: data.stdDeviation,
			showlegend: false,
			hoverinfo: 'none',
			marker: {
				color: '#007bff',
			},
		};
	}

	static createHoverTrace(data: BoxPlotData) {
		return {
			type: 'bar',
			x: [data.meanValue],
			y: [data.dimension],
			orientation: 'h',
			showlegend: false,
			opacity: 0,
			// setting the hovertemplate for the whole boxplot
			hovertemplate:
				data.dimension.toString() +
				'<br>expected: ' +
				data.meanValue +
				'<br>+/- ' +
				data.stdDeviation +
				'<br>counted: ' +
				data.countValue +
				'<extra></extra>',
			hoverlabel: {
				bgcolor: '#007bff',
				align: 'auto',
			},
		};
	}

	static createScoreMarker(data: BoxPlotData) {
		return {
			x: [data.countValue],
			y: [data.dimension],
			showlegend: false,
			hoverinfo: 'none',
			name: data.dimension,
			marker: {
				// Setting the color depending on the anomaly score
				color: [data.anomalyScore],
				showscale: false,
				colorscale: COLOR_SCALE,
				cmin: SCORE_MIN,
				cmax: SCORE_MAX,
				size: 8,
			},
		};
	}

	static formatBoxPlotData(data: BoxPlotData): BoxPlotData {
		// Round numbers
		data.meanValue = Math.round((data.meanValue + Number.EPSILON) * 100) / 100;
		data.stdDeviation = Math.round((data.stdDeviation + Number.EPSILON) * 100) / 100;
		data.thirdQuartile = Math.round((data.thirdQuartile + Number.EPSILON) * 100) / 100;
		data.upperFence = Math.round((data.upperFence + Number.EPSILON) * 100) / 100;

		// Round numbers and set lower or upper bound
		data.firstQuartile = data.firstQuartile > 0 ? Math.round((data.firstQuartile + Number.EPSILON) * 100) / 100 : 0;
		data.lowerFence = data.lowerFence > 0 ? Math.round((data.lowerFence + Number.EPSILON) * 100) / 100 : 0;
		data.anomalyScore = data.lowerFence < 10 ? Math.round((data.lowerFence + Number.EPSILON) * 100) / 100 : 10;

		return data;
	}
}
