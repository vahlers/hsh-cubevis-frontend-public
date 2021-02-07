import { Ip } from '../models/ip.modell';

export class FilterOutOfRangeError extends Error {
	/**
	 * FilterOutOfRangeError. Has to be thrown if the filter that has to be applied is not in the current data.
	 * @param value Value that is not in the data.
	 * @param dimension Dimension which is affected.
	 */
	constructor(value: number | string | Ip, dimension: string) {
		super(
			`The requested filter value '${value}' of dimension '${dimension}' is not in the data. None of the records match!`,
		);
	}
}
