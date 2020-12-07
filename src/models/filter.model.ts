import { CellTypes } from '../enums/cellTypes.enum';
import { Ip } from './ip.modell';
import { RangeFilter } from './rangeFilter.model';
import { CsvRetrievalService } from '../services/csvRetrieval.service';
import * as cloneDeep from 'lodash/cloneDeep';

type Value = number | string | Ip;
type Filter = { type: CellTypes; value: Value };

export type { Filter, Value };

/**
 * This class wraps all possible parameters for filters
 */
export class FilterParameter {
	private valueDict: { [id: number]: Value[] };
	private rangeDict: { [id: number]: RangeFilter<Value>[] };
	private counter = 0;
	private countReferences: {
		index: number;
		type: CellTypes;
		filter: Value | Value[] | RangeFilter<Value> | RangeFilter<Value>[];
	}[] = [];

	/**
	 * Construct a new FilterParameter wrapper
	 */
	public constructor() {
		this.valueDict = {};
		this.rangeDict = {};
		for (let i = 0; i < CellTypes.CELLTYPE_CNT; i++) {
			this.valueDict[i] = [];
			this.rangeDict[i] = [];
		}
	}

	/**
	 * Creates a deep copy of the object.
	 */
	public clone(): FilterParameter {
		return cloneDeep(this);
	}

	/**
	 * Returns an array of all Value filters for a specific dimension.
	 * Value filters can be of types : string, number, IP
	 * @param type dimension for filters of enum CellTypes
	 */
	public getValuesByCelltype(type: CellTypes): Value[] {
		let values: Value[] = [];
		for (const key in this.valueDict) {
			if (Number.parseInt(key) === type) {
				values = values.concat(this.valueDict[key]);
			}
		}
		return values;
	}

	/**
	 * Returns an array of all Range filters for a specific dimension.
	 * @param type dimension for filters of enum CellTypes
	 */
	public getRangesByCelltype(type: CellTypes): RangeFilter<Value>[] {
		let values: RangeFilter<Value>[] = [];
		for (const key in this.rangeDict) {
			if (Number.parseInt(key) === type) {
				values = values.concat(this.rangeDict[key]);
			}
		}
		return values;
	}

	/**
	 * Returns an array of all filters for a specific dimension.
	 * @param type dimension for filters of enum CellTypes
	 */
	public getFiltersByCelltype(type: CellTypes): (Value | RangeFilter<Value>)[] {
		let values: (RangeFilter<Value> | Value)[] = [];
		for (const key in this.rangeDict) {
			if (Number.parseInt(key) === type) {
				values = values.concat(this.rangeDict[key]);
			}
		}
		for (const key in this.valueDict) {
			if (Number.parseInt(key) === type) {
				values = values.concat(this.valueDict[key]);
			}
		}
		return values;
	}

	/**
	 * Return all CellTypes that have an defined filter
	 */
	public getAllCelltypes(): CellTypes[] {
		const cellTypes: Set<CellTypes> = new Set<CellTypes>();
		for (const key in this.valueDict) {
			if (this.valueDict[key].length > 0) cellTypes.add(Number.parseInt(key));
		}
		for (const key in this.rangeDict) {
			if (this.rangeDict[key].length > 0) cellTypes.add(Number.parseInt(key));
		}
		return Array.from(cellTypes);
	}

	/**
	 * Returns an array with each type, filter and their index. It can be used to ascertain their order.
	 */
	public getOrderedFilters(): {
		index: number;
		type: CellTypes;
		filter: Value | Value[] | RangeFilter<Value> | RangeFilter<Value>[];
	}[] {
		return this.countReferences;
	}

	/**
	 * Set all filterparameters of an old filterobject to this new Class
	 * @param oldFilter Object of old Filtersyntax
	 */
	public setOldFilter(oldFilter: { type: CellTypes; value: Value | RangeFilter<Value> }[]): void {
		oldFilter.forEach((it) => {
			if (it.value !== null && it.value !== undefined) {
				this.addSingleFilter(it.type, it.value);
			}
		});
	}

	/**
	 * Return an old filter object
	 * Only implemented for compatibillity reasons
	 * @warn Usage may lead to loss of filter information
	 */
	public toOldFilter(): { type: CellTypes; value: Value | RangeFilter<Value> }[] {
		const filter: { type: CellTypes; value: Value | RangeFilter<Value> }[] = [];
		for (const key in this.valueDict) {
			// for some reason key is typed as a string (even if its an integer) so we have to parse it
			if (this.valueDict[key].length > 0)
				this.valueDict[key].forEach((filterValue) => {
					filter.push({ type: Number.parseInt(key), value: filterValue });
				});
		}
		for (const key in this.rangeDict) {
			if (this.rangeDict[key].length > 0)
				this.rangeDict[key].forEach((filterValue) => {
					filter.push({ type: Number.parseInt(key), value: filterValue });
				});
		}
		return filter;
	}

	private checkType(ct: CellTypes, value: Value): void {
		const expected = CsvRetrievalService.expectedType(ct);
		if ((expected !== 'ip' || (expected === 'ip' && !(value instanceof Ip))) && expected !== typeof value) {
			console.warn('Typemissmatch in FilterParameterModel!');
			console.warn('Expected: ' + expected + ' Got: ' + value + ' as ' + typeof value);
		}
	}

	/**
	 * Add filterparameter(s) to new filterparameter wrapper
	 * @param type dimension for filter of enum CellTypes
	 * @param value Values for filter can be of type string,number,Ip,Range. To add multiple values an array can be used aswell.
	 */
	public addFilter(type: CellTypes, value: Value): void;
	public addFilter(type: CellTypes, value: Value[]): void;
	public addFilter(type: CellTypes, value: RangeFilter<Value>): void;
	public addFilter(type: CellTypes, value: RangeFilter<Value>[]): void;
	public addFilter(type: CellTypes, value: Value | Value[] | RangeFilter<Value> | RangeFilter<Value>[]): void {
		this.countReferences.push({ index: this.counter, type: type, filter: value });
		if (Array.isArray(value)) {
			value.forEach((it) => this.addSingleFilter(type, it));
		} else {
			this.addSingleFilter(type, value);
		}
		this.counter++;
	}

	private addSingleFilter(type: CellTypes, value: Value | RangeFilter<Value>): void {
		if (value !== null && value !== undefined && value !== '') {
			if (typeof value === 'string' || typeof value === 'number' || value instanceof Ip) {
				this.checkType(type, value);
				this.valueDict[type].push(value);
			} else {
				this.checkType(type, value.from);
				this.checkType(type, value.to);
				this.rangeDict[type].push(value);
			}
		} else {
			this.valueDict[type].push(null);
		}
	}
}
