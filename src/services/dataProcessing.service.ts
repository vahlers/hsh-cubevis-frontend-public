import { CsvRetrievalService, CsvRetrievalServiceFactory } from './csvRetrieval.service';
import { CellTypes } from '../enums/cellTypes.enum';
import { SortType } from '../enums/sortType.enum';
import { DataType } from '../enums/dataType.enum';

import { CubeCellModel } from '../models/cell.model';
import { DataFilterService } from './dataFilter.service';
import { Ip } from '../models/ip.modell';
import { FilterParameter } from '../models/filter.model';
import { DataServiceHelper } from '../helpers/dataService.helper';

export class DataProcessingService {
	private csvService: CsvRetrievalService;
	private static singleton: DataProcessingService;

	/**
	 * Returns Singleton instance of DataProcessingServic
	 * Unzipped .csv files must be place in public/data and "_" must be Symbol for cubed Dimensions
	 * @example public/data/estimates/epoch_0/full_anomaly_cube/(_, _, _, _, _, _, _).csv
	 */
	public static instance(): DataProcessingService {
		if (DataProcessingService.singleton === undefined)
			DataProcessingService.singleton = new DataProcessingService();

		return DataProcessingService.singleton;
	}

	private constructor() {
		this.csvService = CsvRetrievalServiceFactory.create();
	}

	/**
	 * Returns a Promise which contains a Cuboid of data.
	 * @param dimensions An array of Objects defining the cubed dimensions of the result.
	 * @param dimension[].type Dimension that is cubed.
	 * @param dimension[].sorting Sorting order of this dimension. Is optional.
	 * @param filter An object of class "FilterParameter" providing all filter information. Is optional.
	 * @example //logs Cuboid of SourceIp and SourcePort sorted by SourceIp ascending and filtered for port 2048.
	 * 			getCuboid(
	 * 			[{ type: CellTypes.SOURCE_IP, sorting: SortType.ASC }, { type: CellTypes.SOURCE_PORT }],
	 * 			new FilterParameter(),
	 * 			)
	 * 			.then((v) => console.log(v));
	 * @returns Returns a promise with an object of type CubeCellModel.
	 * @remarks Numeric attributevalues are 'Infinity' for question marks and 'NaN' for undefined values.
	 */
	public getCuboid(
		dimensions: { type: CellTypes; sorting?: SortType }[],
		filter?: FilterParameter,
	): Promise<CubeCellModel[]> {
		const cellTypes: CellTypes[] = dimensions.map((v) => v.type);
		return this.csvService.getAnomalyData(cellTypes).then((v) => {
			let sortedCuboid: CubeCellModel[] = DataFilterService.getSortedCells(v, dimensions);
			if (filter) {
				sortedCuboid = DataFilterService.getFilteredCells(sortedCuboid, filter);
			}
			return sortedCuboid;
		});
	}
	/**
	 * Returns a Promise which contains a Cuboid of data. Only the countMean and countStandardDeviation fields are filled with this function.
	 * @param dimensions An array of Objects defining the cubed dimensions of the result.
	 * @param dimension[].type Dimension that is cubed.
	 * @param dimension[].sorting Sorting order of this dimension. Is optional.
	 * @param filter An object of class "FilterParameter" providing all filter information. Is optional.
	 * @example //logs Cuboid of SourceIp and SourcePort sorted by SourceIp ascending and filtered for port 2048.
	 * 			getCuboid(
	 * 			[{ type: CellTypes.SOURCE_IP, sorting: SortType.ASC }, { type: CellTypes.SOURCE_PORT }],
	 * 			new FilterParameter(),
	 * 			)
	 * 			.then((v) => console.log(v));
	 * @returns Returns an Promise with an Object of Type CubeCellModel.
	 * @remarks Numeric attributevalues are 'Infinity' for question marks and 'NaN' for undefined values.
	 */
	public getCuboidWithCount(
		dimensions: { type: CellTypes; sorting?: SortType }[],
		filter?: FilterParameter,
	): Promise<CubeCellModel[]> {
		const cellTypes: CellTypes[] = dimensions.map((v) => v.type);
		return this.csvService.getCounterData(cellTypes).then((v) => {
			let sortedCuboid: CubeCellModel[] = DataFilterService.getSortedCells(v, dimensions);
			if (filter) {
				sortedCuboid = DataFilterService.getFilteredCells(sortedCuboid, filter);
			}
			return sortedCuboid;
		});
	}

	/**
	 * Returns all available attribute values for a dimension
	 * @param dimensions An array of CellTypes defining the cubed dimensions.
	 * @param filter An object of class "FilterParameter" providing all filter information. Is optional.
	 * @example //Logs available Ip's for Cubeoid of SourceIp and SourcePort.
	 * 			getAvailableValues([CellTypes.SOURCE_IP, CellTypes.SOURCE_PORT])
	 * 				.then((v) => console.log(v[CellType.SourceIP]))
	 * @returns An Promise with an Object Containing Pairs of Dimension and Attributevalues
	 */
	public getAvailableValues(
		dimension: CellTypes[],
		filter?: FilterParameter,
	): Promise<{ [id: string]: (string | number | Ip)[] }> {
		return this.csvService.getAnomalyData(dimension).then((anomaly) => {
			let filtered: CubeCellModel[];
			if (filter) filtered = DataFilterService.getFilteredCells(anomaly, filter);
			else filtered = anomaly;

			const result: { [id: string]: (string | number | Ip)[] } = {};

			dimension.forEach((dim) => {
				let array = filtered.map((item) => item[DataServiceHelper.getModelKeyName(dim)]);
				//Remove Duplicates
				array = array.filter((item, index) => DataServiceHelper.indexOf(array, item) === index);
				//Sort Ascending
				array = array.sort((a, b) => {
					if (typeof a === 'number') return a - b;
					if (typeof a === 'string') return a < b ? -1 : 1;
					if (a instanceof Ip) return a.valueOf() - b.valueOf();
					return 0;
				});
				result[dim] = array;
			});

			return result;
		});
	}

	/**
	 * Returns an Dictionary with MetaData for all dimensions
	 * @example //Log label and Type of Dimension SourcePort
	 * 			const mdata = service.getMetadata();
	 *			console.log(mdata[CellTypes.SOURCE_PORT].label);
	 *			//output here is the value of DataType enum
	 *			console.log(mdata[CellTypes.SOURCE_PORT].type);
	 */
	public getMetadata(): { [id: string]: { key: string; label: string; type: DataType } } {
		const result = {};
		Array.from(Array(CellTypes.CELLTYPE_CNT).keys()).forEach((key) => {
			result[key] = {
				key: DataServiceHelper.getModelKeyName(key),
				label: DataServiceHelper.getDimLabel(key),
				type: DataServiceHelper.getTypeForDimension(key),
			};
		});
		return result;
	}
}
