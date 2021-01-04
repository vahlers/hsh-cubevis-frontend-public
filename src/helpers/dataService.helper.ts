import { configDataMapping, filePathPattern, filePaths } from '../dataservice.config';
import { CellTypes } from '../enums/cellTypes.enum';
import { DataType } from '../enums/dataType.enum';
import { CubeCellModel } from '../models/cell.model';
import { Value } from '../models/filter.model';
import { Ip } from '../models/ip.modell';

export class DataServiceHelper {
	private static dataMapping: {
		cellType: CellTypes;
		dataType: DataType;
		cellProperty: string;
		dimLabel: string;
		dimName: string;
		orderInFile: number;
	}[] = configDataMapping;

	public static getParameterForCelltype(cell: CubeCellModel, type: CellTypes): Value {
		const propertyString = this.dataMapping.find((entries) => entries.cellType == type).cellProperty;
		return cell[propertyString];
	}

	public static getDimName(dim: CellTypes): string {
		return this.dataMapping.find((value) => value.cellType === dim).dimName;
	}

	public static getModelKeyName(dim: CellTypes): string {
		return this.dataMapping.find((value) => value.cellType === dim).cellProperty;
	}

	public static getTypeForDimension(dim: CellTypes): string {
		return this.dataMapping.find((value) => value.cellType === dim).dataType;
	}

	public static getDimLabel(dim: CellTypes): string {
		return this.dataMapping.find((value) => value.cellType === dim).dimLabel;
	}

	public static getExpectedType(dim: CellTypes): string {
		const dataType = DataServiceHelper.getTypeForDimension(dim);
		switch (dataType) {
			case DataType.IP:
				return 'ip';
			case DataType.NUMERIC:
			case DataType.ORDINAL:
				return 'number';
			case DataType.NOMINAL:
				return 'string';
			default: {
				console.error('Invalid CellType as argument.');
				return 'string';
			}
		}
	}

	public static mapTypeToValue(
		a: CubeCellModel,
		b: CubeCellModel,
		type: CellTypes,
	): { valueA: string | number | Ip; valueB: string | number | Ip } {
		const propertyString = this.dataMapping.find((value) => value.cellType === type).cellProperty;
		const valueA = a[propertyString];
		const valueB = b[propertyString];
		return { valueA, valueB };
	}

	public static getFileName(dimensions: CellTypes[]): string {
		const isGrouped = (dim: CellTypes) => {
			if (dimensions.includes(dim)) return DataServiceHelper.getDimName(dim);
			else return filePathPattern.notIncludedFlag;
		};

		const sortedData = this.dataMapping.sort((a, b) => a.orderInFile - b.orderInFile);
		let uriString = filePathPattern.prefix;

		// Get the last order count
		const lastEntryCount = sortedData[sortedData.length - 1].orderInFile;
		sortedData.forEach((entry) => {
			// Add name and seperator to the uri. The last element doesn't have separator.
			uriString +=
				isGrouped(entry.cellType) + (entry.orderInFile !== lastEntryCount ? filePathPattern.separator : '');
		});
		uriString += filePathPattern.appendix;

		return uriString;
	}

	public static getCountFileName(): string {
		return filePaths.countFileName;
	}

	public static getAnomalyFilePath(): string {
		return filePaths.anomalyFilePath;
	}

	public static getCountFilePath(): string {
		return filePaths.countFilePath;
	}

	public static getSingleCountFilePath(): string {
		return filePaths.singleCountFilePath;
	}

	/**
	 * Performing a===b but using numeric representation for Ip Adresses
	 * @param a Comparison Parameter of Type number, string, or Ip
	 * @param b Comparison Parameter of Type number, string, or Ip
	 * @example equals('192.168.178.1'new Ip('192.168.178.1')) returns false because a and b have different types
	 */
	public static typedEquals(a: number | string | Ip, b: number | string | Ip): boolean {
		if (a instanceof Ip) {
			//if a is Ip than b also must be Ip
			if (!(b instanceof Ip)) return false;
			else return a.valueOf() === b.valueOf();
		}
		return a === b;
	}

	/**
	 * Performing a==b but using numeric or string representation for Ip Adresses
	 * @param a Comparison Parameter of Type number, string, or Ip
	 * @param b Comparison Parameter of Type number, string, or Ip
	 * @example equals('192.168.178.1', new Ip('192.168.178.1')) returns true because a equals string representation of b
	 */
	public static equals(a: number | string | Ip, b: number | string | Ip): boolean {
		if (a instanceof Ip) {
			if (typeof b === 'string') a = a.toString();
			else a = a.valueOf();
		}
		if (b instanceof Ip) {
			if (typeof a === 'string') b = b.toString();
			else b = b.valueOf();
		}
		return a == b;
	}

	public static indexOf(arr: Array<number | string | Ip>, o: number | string | Ip): number {
		return arr.findIndex((elem) => DataServiceHelper.equals(elem, o));
	}
}
