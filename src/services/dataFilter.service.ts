import { CellTypes } from '../enums/cellTypes.enum';
import { SortType } from '../enums/sortType.enum';
import { CubeCellModel } from '../models/cell.model';

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
		cellTypes: { type: CellTypes; value: number | string }[],
	): CubeCellModel[] {
		return cellModel.filter((v) => {
			let filtered = false;
			cellTypes.forEach((w) => {
				switch (w.type) {
					case CellTypes.DESTINATION_IP:
						filtered = w.value === v.destinationIp;
						break;
					case CellTypes.DESTINATION_PORT:
						filtered = w.value === v.destinationPort;
						break;
					case CellTypes.SOURCE_IP:
						filtered = w.value === v.sourceIp;
						break;
					case CellTypes.SOURCE_PORT:
						filtered = w.value === v.sourcePort;
						break;
					case CellTypes.ARGUS_TRANSACTION_STATE:
						filtered = w.value === v.argusTransaction;
						break;
					case CellTypes.NETWORK_PROTOCOL:
						filtered = w.value === v.networkProtocol;
						break;
					case CellTypes.NETWORK_TRANSPORT:
						filtered = w.value === v.networkTransport;
						break;
				}
			});
			return filtered;
		});
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
				valueA = a.destinationIp;
				valueB = b.destinationIp;
				break;
			case CellTypes.DESTINATION_PORT:
				valueA = a.destinationPort;
				valueB = b.destinationPort;
				break;
			case CellTypes.SOURCE_IP:
				valueA = a.sourceIp;
				valueB = b.sourceIp;
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
