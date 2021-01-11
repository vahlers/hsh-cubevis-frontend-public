import { CommonHelper } from '../../helpers/common.helper';
import { DataServiceHelper } from '../../helpers/dataService.helper';
import { FilterParameter, SingleFilter, Value } from '../../models/filter.model';
import { RangeFilter } from '../../models/rangeFilter.model';

export class ChartsViewUtils {
	/** Retrieve loose dimension count from FilterParameter object.
	 * Loose means:
	 * 		Filter value is null -> wildcard / *
	 * 		Filter is an Array with at least 2 values
	 * 		Filter is a Range filter with from != to
	 */
	public static getLooseDimensionsCount = (filters: FilterParameter): number => {
		return ChartsViewUtils.getLooseDimensions(filters).length;
	};

	public static getLooseDimensions = (filters: FilterParameter): SingleFilter[] => {
		return filters
			.getOrderedFilters()
			.filter(
				(f) =>
					f.filter === null ||
					(Array.isArray(f.filter) && (f.filter as Array<Value>).length > 1) ||
					(!CommonHelper.isNullOrUndefined((f.filter as RangeFilter<Value>).from) &&
						!CommonHelper.isNullOrUndefined((f.filter as RangeFilter<Value>).to) &&
						!DataServiceHelper.equals(
							(f.filter as RangeFilter<Value>).from,
							(f.filter as RangeFilter<Value>).to,
						)),
			);
	};
}
