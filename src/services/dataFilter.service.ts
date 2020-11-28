import { CellTypes } from '../enums/cellTypes.enum';
import { SortType } from '../enums/sortType.enum';
import { CubeCellModel } from '../models/cell.model';
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

	public static getFilteredCells(
		cellModel: CubeCellModel[],
		cellTypes: { type: CellTypes; value: number | string | Ip | RangeFilter<number | string | Ip> }[],
	): CubeCellModel[] {
		return cellModel.filter((cell) => {
			let filtered = 0;
			cellTypes.forEach((filter) => {
				switch (filter.type) {
					case CellTypes.DESTINATION_IP:
						filtered += this.evaluateFilter(filter.value, cell.destinationIp) ? 1 : 0;
						break;
					case CellTypes.DESTINATION_PORT:
						filtered += this.evaluateFilter(filter.value, cell.destinationPort) ? 1 : 0;
						break;
					case CellTypes.SOURCE_IP:
						filtered += this.evaluateFilter(filter.value, cell.sourceIp) ? 1 : 0;
						break;
					case CellTypes.SOURCE_PORT:
						filtered += this.evaluateFilter(filter.value, cell.sourcePort) ? 1 : 0;
						break;
					case CellTypes.ARGUS_TRANSACTION_STATE:
						filtered += this.evaluateFilter(filter.value, cell.argusTransaction) ? 1 : 0;
						break;
					case CellTypes.NETWORK_PROTOCOL:
						filtered += this.evaluateFilter(filter.value, cell.networkProtocol) ? 1 : 0;
						break;
					case CellTypes.NETWORK_TRANSPORT:
						filtered += this.evaluateFilter(filter.value, cell.networkTransport) ? 1 : 0;
						break;
				}
			});
			return filtered === cellTypes.length;
		});
	}

	private static evaluateFilter(
		filterValue: number | string | RangeFilter<number | string | Ip> | Ip,
		cellValue: number | string | Ip,
	): boolean {
		// only filter if the value isn't empty
		if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
			if (filterValue instanceof Ip) {
				return cellValue.toString() === filterValue.toString();
			} else if (typeof filterValue === 'number' || typeof filterValue === 'string') {
				return cellValue === filterValue || cellValue?.toString() === filterValue;
			} else if (<RangeFilter<number | string | Ip>>filterValue !== undefined) {
				const tempValue = <RangeFilter<number | string | Ip>>filterValue;
				if (tempValue.from instanceof Ip && tempValue.to instanceof Ip) {
					return (
						(cellValue as Ip).getFirstBit() >= (tempValue.from as Ip).getFirstBit() &&
						(cellValue as Ip).getFirstBit() <= (tempValue.to as Ip).getFirstBit() &&
						(cellValue as Ip).getSecondBit() >= (tempValue.from as Ip).getSecondBit() &&
						(cellValue as Ip).getSecondBit() <= (tempValue.to as Ip).getSecondBit() &&
						(cellValue as Ip).getThirdBit() >= (tempValue.from as Ip).getThirdBit() &&
						(cellValue as Ip).getThirdBit() <= (tempValue.to as Ip).getThirdBit() &&
						(cellValue as Ip).getFourthBit() >= (tempValue.from as Ip).getFourthBit() &&
						(cellValue as Ip).getFourthBit() <= (tempValue.to as Ip).getFourthBit()
					);
				}
				return cellValue >= tempValue.from && cellValue <= tempValue.to;
			}
		}
		// If there are no values, nothing will get filtered
		return true;
	}

	private static sortFunction(sorting: SortType, a: CubeCellModel, b: CubeCellModel, type: CellTypes) {
		const sortBy: SortType = sorting !== undefined ? sorting : SortType.ASC;
		const result = this.mapTypeToValue(a, b, type);
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
		}
	}

	private static mapTypeToValue(a: CubeCellModel, b: CubeCellModel, type: CellTypes) {
		let valueA, valueB;
		switch (type) {
			case CellTypes.DESTINATION_IP:
				valueA = a.destinationIp.toString();
				valueB = b.destinationIp.toString();
				break;
			case CellTypes.DESTINATION_PORT:
				valueA = a.destinationPort;
				valueB = b.destinationPort;
				break;
			case CellTypes.SOURCE_IP:
				valueA = a.sourceIp.toString();
				valueB = b.sourceIp.toString();
				break;
			case CellTypes.SOURCE_PORT:
				valueA = a.sourcePort;
				valueB = b.sourcePort;
				break;
			case CellTypes.ARGUS_TRANSACTION_STATE:
				valueA = a.argusTransaction;
				valueB = b.argusTransaction;
				break;
			case CellTypes.NETWORK_PROTOCOL:
				valueA = a.networkProtocol;
				valueB = b.networkProtocol;
				break;
			case CellTypes.NETWORK_TRANSPORT:
				valueA = a.networkTransport;
				valueB = b.networkTransport;
				break;
		}
		return { valueA, valueB };
	}
}
