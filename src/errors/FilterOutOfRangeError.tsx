import { Ip } from '../models/ip.modell';

export class FilterOutOfRangeError extends Error {
	constructor(value: number | string | Ip, dimension: string) {
		super(
			`The requested filter value '${value}' of dimension '${dimension}' is not in the data. None of the records match!`,
		);
	}
}
