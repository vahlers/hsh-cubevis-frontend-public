import { DataRecord } from '../models/datarecord.model';
import { Value } from '../models/filter.model';
import { DataServiceHelper } from './dataService.helper';

export class CommonHelper {
	/**
	 * Check if an element is null or undefined.
	 * @param elem Any element of type Value.
	 * @returns true if the element is null or undefined
	 */
	public static isNullOrUndefined(elem: Value): boolean {
		return elem === null || elem === undefined;
	}

	/**
	 * Unpack a specific attribute from the table.
	 * @param rows Array of objects, each object is a row from the file
	 * @param columName The column to extract
	 * @returns Array of objects, key is column name, value is cell value
	 */
	public static unpack = (rows: Array<DataRecord>, columName: string): Array<Value> => {
		return rows.map(function (row) {
			return row[columName];
		});
	};

	/**
	 * Unpack a specific attribute from the table and return the unique values sorted.
	 * @param rows Array of objects, each object is a row from the file
	 * @param key The column to extract.
	 */
	public static getUniqueSortedValues(rows: Array<DataRecord>, key: string): Array<Value> {
		const valuesOfColumn = CommonHelper.unpack(rows, key);
		const uniqueValuesOfColumn: Array<Value> = valuesOfColumn.filter(
			(v, i, a) => DataServiceHelper.indexOf(a, v) === i,
		);
		return uniqueValuesOfColumn.sort((a, b) => (a > b ? 1 : -1));
	}
}
