import { DataServiceHelper } from '../../helpers/dataService.helper';
import { FilterParameter, Value } from '../../models/filter.model';
import { RangeFilter } from '../../models/rangeFilter.model';

export class ChartsViewUtils {
	/** Retrieve loose dimension count from FilterParameter object.
	 * Loose means:
	 * 		Filter value is null -> wildcard / *
	 * 		Filter is an Array with at least 2 values
	 * 		Filter is a Range filter with from != to
	 */
	static getLooseDimensionsCount = (filters: FilterParameter): number => {
		return filters
			.getOrderedFilters()
			.filter(
				(f) =>
					f.filter === null ||
					(Array.isArray(f.filter) && (f.filter as Array<Value>).length > 1) ||
					((f.filter as RangeFilter<Value>).from &&
						(f.filter as RangeFilter<Value>).to &&
						!DataServiceHelper.equals(
							(f.filter as RangeFilter<Value>).from,
							(f.filter as RangeFilter<Value>).to,
						)),
			).length;
	};
}