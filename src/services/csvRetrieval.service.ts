import { CellTypes } from '../enums/cellTypes.enum';
import { compareCubeCells, CubeCellModel } from '../models/cell.model';
import { csv } from 'd3';
import { Ip } from '../models/ip.modell';
import { DataServiceHelper } from '../helpers/dataService.helper';

export enum CsvLibrary {
	D3 /*,
	Node,
	other Technology*/,
}

export class CsvRetrievalServiceFactory {
	static create(lib: CsvLibrary = CsvLibrary.D3): CsvRetrievalService {
		switch (lib) {
			case CsvLibrary.D3:
				return new D3CsvRetrievalService();
			default:
				throw new Error('Undefined CsvLibrary.');
		}
	}
}

export abstract class CsvRetrievalService {
	public abstract getAnomalyData(dimensions: CellTypes[]): Promise<CubeCellModel[]>;
	public abstract getCounterData(dimensions: CellTypes[]): Promise<CubeCellModel[]>;
}

class D3CsvRetrievalService extends CsvRetrievalService {
	public getAnomalyData(dimensions: CellTypes[]): Promise<CubeCellModel[]> {
		const result = csv(DataServiceHelper.getAnomalyFilePath() + DataServiceHelper.getFileName(dimensions))
			.then((data) => {
				const models: CubeCellModel[] = [];
				data.forEach((row) => {
					const model: Record<string, unknown> = {}; //Dont know how to initialize types in typescript
					dimensions.forEach((dim: CellTypes) => {
						const e = row[DataServiceHelper.getDimName(dim)];
						if (DataServiceHelper.getExpectedType(dim) === 'number') {
							if (e === '?') model[DataServiceHelper.getModelKeyName(dim)] = Infinity;
							else model[DataServiceHelper.getModelKeyName(dim)] = parseInt(e);
						} else if (DataServiceHelper.getExpectedType(dim) === 'ip')
							model[DataServiceHelper.getModelKeyName(dim)] = new Ip(e);
						else model[DataServiceHelper.getModelKeyName(dim)] = e;
					});
					model.anomalyScore = parseFloat(row['count_z_score'].replace('[', '').replace(']', ''));
					model.count = null;
					models.push(model as CubeCellModel);
				});
				return models;
			})
			.catch((error) => {
				console.error(
					'Cannot read csv-file "' +
						DataServiceHelper.getFileName(dimensions) +
						'" from "' +
						DataServiceHelper.getAnomalyFilePath() +
						'".',
					error,
				);
				return [];
			});

		return result;
	}
	public getCounterData(dimensions: CellTypes[]): Promise<CubeCellModel[]> {
		// DOes only have two files and I think cell_models is the correct one.
		const filename = DataServiceHelper.getCountFileName();

		//This loads the file containing Mean and Standard dev
		const result = csv(DataServiceHelper.getCountFilePath() + filename)
			.then(async (data) => {
				let models: CubeCellModel[] = [];
				const hashTable: { [id: string]: CubeCellModel } = {};
				//Filter stars expression
				const expr = (type: CellTypes) => {
					if (dimensions.includes(type)) return (x: string) => x !== '*';
					else return (x: string) => x === '*';
				};

				data.forEach((row) => {
					const model: Record<string, unknown> = {}; //Dont know how to initialize types in typescript

					let addToModel = true;
					for (let i = 0; i < CellTypes.CELLTYPE_CNT; i++) {
						addToModel = addToModel && expr(i)(row[DataServiceHelper.getDimName(i)]);
					}

					dimensions.forEach((dim: CellTypes) => {
						const e = row[DataServiceHelper.getDimName(dim)];
						if (DataServiceHelper.getExpectedType(dim) === 'number') {
							if (e === '?') model[DataServiceHelper.getModelKeyName(dim)] = Infinity;
							else model[DataServiceHelper.getModelKeyName(dim)] = parseInt(e);
						} else if (DataServiceHelper.getExpectedType(dim) === 'ip')
							model[DataServiceHelper.getModelKeyName(dim)] = new Ip(e);
						else model[DataServiceHelper.getModelKeyName(dim)] = e;
					});
					model.count = null;
					model.countMean = parseFloat(row['count_z_score_mean']);
					model.countStandardDeviation = parseFloat(row['count_z_score_standard_deviation']);
					if (addToModel) {
						const typedModel = model as CubeCellModel;
						models.push(typedModel);
						const hashString: string = this.convertModelToHash(typedModel).toString();
						hashTable[hashString] = typedModel;
					}
				});

				//This loads the file that contains the validation count
				const singleCountData = await csv(
					DataServiceHelper.getSingleCountFilePath() + DataServiceHelper.getFileName(dimensions),
				);
				singleCountData.forEach((row) => {
					const model: Record<string, string | number | Ip> = {};
					dimensions.forEach((dim: CellTypes) => {
						const e = row[DataServiceHelper.getDimName(dim)];
						if (DataServiceHelper.getExpectedType(dim) === 'number') {
							if (e === '?') model[DataServiceHelper.getModelKeyName(dim)] = Infinity;
							else model[DataServiceHelper.getModelKeyName(dim)] = parseInt(e);
						} else if (DataServiceHelper.getExpectedType(dim) === 'ip')
							model[DataServiceHelper.getModelKeyName(dim)] = new Ip(e);
						else model[DataServiceHelper.getModelKeyName(dim)] = e;
					});
					const hashString: string = this.convertModelToHash(model as CubeCellModel).toString();
					//find corresponding cubecell in existing model
					const result = hashTable[hashString];
					//Drop results with no corresponding mean and standard dev
					if (result !== undefined) result.count = parseFloat(row['count'].replace('[', '').replace(']', ''));
				});

				//loading anomaly data
				const anomalyModel = await this.getAnomalyData(dimensions);
				models.forEach((row) => {
					const result = anomalyModel.find((anomalyCell) => compareCubeCells(anomalyCell, row));
					if (result !== undefined) row.anomalyScore = result.anomalyScore;
				});

				//Drop results with no corresponding count or anomaly score
				models = models.filter((cell) => cell.count !== null);
				models = models.filter((cell) => cell.anomalyScore !== null);
				return models;
			})
			.catch((error) => {
				console.error(
					'Cannot read csv-file "' + filename + '" from "' + DataServiceHelper.getCountFilePath() + '".',
					error,
				);
				return [];
			});
		return result;
	}

	private convertModelToHash(model: CubeCellModel) {
		const modelString: string =
			model?.destinationPort?.toString() +
			model?.argusTransaction +
			model?.destinationIp?.toString() +
			model?.sourcePort?.toString() +
			model?.sourceIp?.toString() +
			model?.networkProtocol +
			model?.networkTransport;

		let hash = 0;
		if (modelString.length === 0) {
			return hash;
		}
		for (let i = 0; i < modelString.length; i++) {
			const char = modelString.charCodeAt(i);
			hash = (hash << 5) - hash + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return hash;
	}
}
