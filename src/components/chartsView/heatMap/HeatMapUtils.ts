interface HeatMapSelection {
	x1: number;
	x2: number;
	y1: number;
	y2: number;
}

/** This utility class contains helper functions for emitting filter events
 *  after selecting a range in the HeatMap by rectangle.
 * 	Since the Plotly event only provides x/y coordinates in the selection event
 *  payload, it is a little hacky to retrieve the actual information.
 */
export class HeatMapUtils {
	/** Round lower coordinate to next integer number.
	 *  For example, passing 1.05 becomes 2.
	 */
	static _handleLowerCoordinate = (num: number): number => {
		if (num <= 0.0) return 0;
		return Math.ceil(num);
	};

	/** Round upper coordinate to the previous integer number.
	 * For example, passing 3.75 returns 3.
	 */
	static _handleUpperCoordinate = (num: number): number => {
		if (num < 1.0) return 0;
		return num >> 0;
	};

	/** This function retrieves the bounding box coordinates from selection
	 *  and rounds it in a way it makes sense to the user.
	 * 	@returns The bounding rect with x1 (lower left), x2 (upper right), y1, y2
	 */
	static getCoordinatesFromSelection(event): HeatMapSelection {
		if (!event || !event.range) return null;

		const x1 = HeatMapUtils._handleLowerCoordinate(event.range.x[0]);
		const x2 = HeatMapUtils._handleUpperCoordinate(event.range.x[1]);
		const y1 = HeatMapUtils._handleLowerCoordinate(event.range.y[0]);
		const y2 = HeatMapUtils._handleUpperCoordinate(event.range.y[1]);

		return {
			x1,
			x2,
			y1,
			y2,
		};
	}
}
