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

	private parseType(ct: CellTypes, value: Value): Value {
		const expected = CsvRetrievalService.expectedType(ct);

		switch (expected) {
			case 'ip':
				if (value instanceof Ip) return value;
				else if (typeof value === 'string') return new Ip(value);
				break;
			case 'number':
				if (typeof value === 'number') return value;
				else if (typeof value === 'string') return parseFloat(value);
				break;
			case 'string':
				if (typeof value === 'string') return value;
				else if (typeof value === 'number') return value.toString();
				else if (value instanceof Ip) return value.toString();
				break;
		}

		console.warn('Typemissmatch in FilterParameterModel');
		console.warn('Expected: ' + expected + ' Got: ' + value + ' as ' + typeof value);
		console.warn('Autoparsing not possible');
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
				this.valueDict[type].push(this.parseType(type, value));
			} else {
				value.from = this.parseType(type, value.from);
				value.to = this.parseType(type, value.to);
				this.rangeDict[type].push(value);
			}
		} else {
			this.valueDict[type].push(null);
		}
	}
}
