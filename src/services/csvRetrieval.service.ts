import { CellTypes } from '../enums/cellTypes.enum';
import { DataType } from '../enums/dataType.enum';
import { compareCubeCells, CubeCellModel } from '../models/cell.model';
import { csv } from 'd3';
import { Ip } from '../models/ip.modell';

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
	private static groupedSymbol = '_';

	protected static dimName(dim: CellTypes): string {
		switch (dim) {
			case CellTypes.SOURCE_IP:
				return 'source.ip';
			case CellTypes.DESTINATION_IP:
				return 'destination.ip';
			case CellTypes.SOURCE_PORT:
				return 'source.port';
			case CellTypes.DESTINATION_PORT:
				return 'destination.port';
			case CellTypes.NETWORK_PROTOCOL:
				return 'network.protocol';
			case CellTypes.NETWORK_TRANSPORT:
				return 'network.transport';
			case CellTypes.ARGUS_TRANSACTION_STATE:
				return 'Argus.transaction.state';
			default: {
				console.error('Invalid CellType as argument.');
				return '';
			}
		}
	}
	public static modelKeyName(dim: CellTypes): string {
		switch (dim) {
			case CellTypes.SOURCE_IP:
				return 'sourceIp';
			case CellTypes.DESTINATION_IP:
				return 'destinationIp';
			case CellTypes.SOURCE_PORT:
				return 'sourcePort';
			case CellTypes.DESTINATION_PORT:
				return 'destinationPort';
			case CellTypes.NETWORK_PROTOCOL:
				return 'networkProtocol';
			case CellTypes.NETWORK_TRANSPORT:
				return 'networkTransport';
			case CellTypes.ARGUS_TRANSACTION_STATE:
				return 'argusTransaction';
		}
	}

	public static expectedType(dim: CellTypes): string {
		const dataType = CsvRetrievalService.typeForDimension(dim);
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

	public static typeForDimension(ct: CellTypes): DataType {
		switch (ct) {
			case CellTypes.SOURCE_IP:
				return DataType.IP;
			case CellTypes.DESTINATION_IP:
				return DataType.IP;
			case CellTypes.SOURCE_PORT:
				return DataType.ORDINAL;
			case CellTypes.DESTINATION_PORT:
				return DataType.ORDINAL;
			case CellTypes.NETWORK_PROTOCOL:
				return DataType.NOMINAL;
			case CellTypes.NETWORK_TRANSPORT:
				return DataType.NOMINAL;
			case CellTypes.ARGUS_TRANSACTION_STATE:
				return DataType.NOMINAL;
			default: {
				console.error('Invalid CellType as argument.');
				return DataType.NOMINAL;
			}
		}
	}

	public static dimLabel(dim: CellTypes): string {
		switch (dim) {
			case CellTypes.SOURCE_IP:
				return 'Source Ip';
			case CellTypes.DESTINATION_IP:
				return 'Destination Ip';
			case CellTypes.SOURCE_PORT:
				return 'Source Port';
			case CellTypes.DESTINATION_PORT:
				return 'Destination Port';
			case CellTypes.NETWORK_PROTOCOL:
				return 'Network Protocol';
			case CellTypes.NETWORK_TRANSPORT:
				return 'Network Transport';
			case CellTypes.ARGUS_TRANSACTION_STATE:
				return 'Argus Transaction State';
			default: {
				console.error('Invalid CellType as argument.');
				return '';
			}
		}
	}

	protected fileName(dimensions: CellTypes[]): string {
		const isGrouped = (dim: CellTypes) => {
			if (dimensions.includes(dim)) return CsvRetrievalService.dimName(dim);
			else return CsvRetrievalService.groupedSymbol;
		};

		return encodeURI(
			`(${isGrouped(CellTypes.SOURCE_IP)}, ` +
				`${isGrouped(CellTypes.DESTINATION_IP)}, ` +
				`${isGrouped(CellTypes.SOURCE_PORT)}, ` +
				`${isGrouped(CellTypes.DESTINATION_PORT)}, ` +
				`${isGrouped(CellTypes.NETWORK_PROTOCOL)}, ` +
				`${isGrouped(CellTypes.NETWORK_TRANSPORT)}, ` +
				`${isGrouped(CellTypes.ARGUS_TRANSACTION_STATE)}).csv`,
		);
	}

	protected anomalyFilePath(): string {
		return './data/estimates/epoch_0/full_anomaly_cube/';
	}

	protected countFilePath(): string {
		return '/data/checkpoints/epoch_0/';
	}

	protected singleCountFilePath(): string {
		return '/data/validation_data/epoch_0/batch_0/item_0_sub_item_0/';
	}

	public abstract getAnomalyData(dimensions: CellTypes[]): Promise<CubeCellModel[]>;
	public abstract getCounterData(dimensions: CellTypes[]): Promise<CubeCellModel[]>;
}

class D3CsvRetrievalService extends CsvRetrievalService {
	public getAnomalyData(dimensions: CellTypes[]): Promise<CubeCellModel[]> {
		const result = csv(this.anomalyFilePath() + this.fileName(dimensions))
			.then((data) => {
				const models: CubeCellModel[] = [];
				data.forEach((row) => {
					const model: Record<string, unknown> = {}; //Dont know how to initialize types in typescript
					dimensions.forEach((dim: CellTypes) => {
						const e = row[CsvRetrievalService.dimName(dim)];
						if (CsvRetrievalService.expectedType(dim) === 'number') {
							if (e === '?') model[CsvRetrievalService.modelKeyName(dim)] = Infinity;
							else model[CsvRetrievalService.modelKeyName(dim)] = parseInt(e);
						} else if (CsvRetrievalService.expectedType(dim) === 'ip')
							model[CsvRetrievalService.modelKeyName(dim)] = new Ip(e);
						else model[CsvRetrievalService.modelKeyName(dim)] = e;
					});
					model.anomalyScore = parseFloat(row['count_z_score'].replace('[', '').replace(']', ''));
					model.count = null;
					models.push(<CubeCellModel>model);
				});
				return models;
			})
			.catch((error) => {
				console.error(
					'Cannot read csv-file "' + this.fileName(dimensions) + '" from "' + this.anomalyFilePath() + '".',
					error,
				);
				return [];
			});

		return result;
	}
	public getCounterData(dimensions: CellTypes[]): Promise<CubeCellModel[]> {
		// DOes only have two files and I think cell_models is the correct one.
		const filename = 'cell_models.csv';

		//This loads the file containing Mean and Standard dev
		const result = csv(this.countFilePath() + filename)
			.then(async (data) => {
				let models: CubeCellModel[] = [];
				//Filter stars expression
				const expr = (type: CellTypes) => {
					if (dimensions.includes(type)) return (x: string) => x !== '*';
					else return (x: string) => x === '*';
				};

				data.forEach((row) => {
					const model: Record<string, unknown> = {}; //Dont know how to initialize types in typescript

					let addToModel = true;
					for (let i = 0; i < CellTypes.CELLTYPE_CNT; i++) {
						addToModel = addToModel && expr(i)(row[CsvRetrievalService.dimName(i)]);
					}

					dimensions.forEach((dim: CellTypes) => {
						const e = row[CsvRetrievalService.dimName(dim)];
						if (CsvRetrievalService.expectedType(dim) === 'number') {
							if (e === '?') model[CsvRetrievalService.modelKeyName(dim)] = Infinity;
							else model[CsvRetrievalService.modelKeyName(dim)] = parseInt(e);
						} else if (CsvRetrievalService.expectedType(dim) === 'ip')
							model[CsvRetrievalService.modelKeyName(dim)] = new Ip(e);
						else model[CsvRetrievalService.modelKeyName(dim)] = e;
					});
					model.count = null;
					model.countMean = parseFloat(row['count_z_score_mean']);
					model.countStandardDeviation = parseFloat(row['count_z_score_standard_deviation']);
					if (addToModel) models.push(<CubeCellModel>model);
				});

				//This loads the file that contains the validation count
				const singleCountData = await csv(this.singleCountFilePath() + this.fileName(dimensions));
				singleCountData.forEach((row) => {
					const model: Record<string, string | number | Ip> = {};
					dimensions.forEach((dim: CellTypes) => {
						const e = row[CsvRetrievalService.dimName(dim)];
						if (CsvRetrievalService.expectedType(dim) === 'number') {
							if (e === '?') model[CsvRetrievalService.modelKeyName(dim)] = Infinity;
							else model[CsvRetrievalService.modelKeyName(dim)] = parseInt(e);
						} else if (CsvRetrievalService.expectedType(dim) === 'ip')
							model[CsvRetrievalService.modelKeyName(dim)] = new Ip(e);
						else model[CsvRetrievalService.modelKeyName(dim)] = e;
					});

					//find corresponding cubecell in existing model
					const result = models.find((cubecell) => compareCubeCells(cubecell, model));

					//Drop results with no corresponding mean and standard dev
					if (result !== undefined) result.count = parseFloat(row['count'].replace('[', '').replace(']', ''));
				});

				//Drop results with no corresponding count
				models = models.filter((cell) => cell.count !== null);
				return models;
			})
			.catch((error) => {
				console.error('Cannot read csv-file "' + filename + '" from "' + this.countFilePath() + '".', error);
				return [];
			});

		return result;
	}
}
