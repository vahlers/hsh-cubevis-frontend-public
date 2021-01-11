import { Value } from '../models/filter.model';

export class CommonHelper {
	public static isNullOrUndefined(elem: Value): boolean {
		return elem === null || elem === undefined;
	}
}
