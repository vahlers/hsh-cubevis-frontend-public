import { CellTypes } from '../enums/cellTypes.enum';
import { SortType } from '../enums/sortType.enum';
import { DataServiceHelper } from '../helpers/dataService.helper';
import { CubeCellModel } from '../models/cell.model';
import { FilterParameter, Value } from '../models/filter.model';
import { Ip } from '../models/ip.modell';
import { RangeFilter } from '../models/rangeFilter.model';

export class DataFilterService {
	public static getSortedCells(
		cellModel: CubeCellModel[],
		cellTypes: { type: CellTypes; sorting?: SortType }[],
	): CubeCellModel[] {
		const sortedCellModel: CubeCellModel[] = cellModel;
		sortedCellModel.sort((a: CubeCellModel, b: CubeCellModel) => {
			let result = this.sortFunction(cellTypes[0].sorting, a, b, cellTypes[0].type);
			cellTypes.slice(1).forEach((v) => {
				result = result || this.sortFunction(v.sorting, a, b, v.type);
			});
			return result;
		});
		return sortedCellModel;
	}

	public static getFilteredCells(cellModel: CubeCellModel[], filterParameter: FilterParameter): CubeCellModel[] {
		return cellModel.filter((cell) => {
			let filtered = 0;
			const cellTypes = filterParameter.getAllCelltypes();
			cellTypes.forEach((filter) => {
				// We'll add 1 to the filtered variable if atleast one of the filters for each celltype is true.
				// There can be multiple filters for one celltype.
				const propertyValue = DataServiceHelper.getParameterForCelltype(cell, filter);
				filtered += this.evaluateFilter(filterParameter.getFiltersByCelltype(filter), propertyValue) ? 1 : 0;
			});
			// If all available celltypes have atleast one filter which returns true,
			// the whole filter is valid and the cell won't get removed.
			return filtered === cellTypes.length;
		});
	}

	private static evaluateFilter(
		filterValues: (Value | RangeFilter<Value>)[],
		cellValue: number | string | Ip,
	): boolean {
		// only filter if the value isn't empty
		if (filterValues !== undefined && filterValues !== null && filterValues.length > 0) {
			let filterResult = false;
			filterValues.forEach((filterValue) => {
				if (filterValue !== null && filterValue !== undefined && filterValue !== '') {
					if (filterValue instanceof Ip) {
						if (cellValue.toString() === filterValue.toString()) filterResult = true;
					} else if (typeof filterValue === 'number' || typeof filterValue === 'string') {
						if (cellValue === filterValue || cellValue?.toString() === filterValue) filterResult = true;
					} else if (<RangeFilter<number | string | Ip>>filterValue !== undefined) {
						const tempValue = <RangeFilter<number | string | Ip>>filterValue;
						if (tempValue.from instanceof Ip && tempValue.to instanceof Ip) {
							// We check bit for bit for evaluating ranges
							if (
								(cellValue as Ip).getFirstBit() >= (tempValue.from as Ip).getFirstBit() &&
								(cellValue as Ip).getFirstBit() <= (tempValue.to as Ip).getFirstBit() &&
								(cellValue as Ip).getSecondBit() >= (tempValue.from as Ip).getSecondBit() &&
								(cellValue as Ip).getSecondBit() <= (tempValue.to as Ip).getSecondBit() &&
								(cellValue as Ip).getThirdBit() >= (tempValue.from as Ip).getThirdBit() &&
								(cellValue as Ip).getThirdBit() <= (tempValue.to as Ip).getThirdBit() &&
								(cellValue as Ip).getFourthBit() >= (tempValue.from as Ip).getFourthBit() &&
								(cellValue as Ip).getFourthBit() <= (tempValue.to as Ip).getFourthBit()
							)
								filterResult = true;
						}
						if (cellValue >= tempValue.from && cellValue <= tempValue.to) filterResult = true;
					}
				} else {
					filterResult = true;
				}
			});
			return filterResult;
		}
		// If there are no values, nothing will get filtered
		return true;
	}

	private static sortFunction(sorting: SortType, a: CubeCellModel, b: CubeCellModel, type: CellTypes) {
		const sortBy: SortType = sorting !== undefined ? sorting : SortType.ASC;
		const result = DataServiceHelper.mapTypeToValue(a, b, type);
		if (sorting === SortType.SCORE_ASC) {
			return a.anomalyScore - b.anomalyScore;
		} else if (sorting === SortType.SCORE_DESC) {
			return b.anomalyScore - a.anomalyScore;
		} else if (typeof result.valueA === 'string' && typeof result.valueB === 'string') {
			if (sortBy === SortType.ASC) {
				return result.valueA.localeCompare(result.valueB);
			} else if (sortBy === SortType.DESC) {
				return result.valueA.localeCompare(result.valueB) * -1;
			}
		} else if (typeof result.valueA === 'number' && typeof result.valueB === 'number') {
			if (sortBy === SortType.ASC) {
				return result.valueA - result.valueB;
			} else if (sortBy === SortType.DESC) {
				return result.valueB - result.valueA;
			}
		} else if (result.valueA instanceof Ip && result.valueB instanceof Ip) {
			if (sortBy === SortType.ASC) {
				return result.valueA.valueOf() - result.valueB.valueOf();
			} else if (sortBy === SortType.DESC) {
				return result.valueB.valueOf() - result.valueA.valueOf();
			}
		}
	}
}
