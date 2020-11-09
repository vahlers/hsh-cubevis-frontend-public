import { CellTypes } from '../enums/cellTypes.enum';
import { CubeCellModel } from '../models/cell.model';
import { csv } from 'd3';
import { platform } from 'os';
import { Type } from 'typescript';

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
		}
		throw new Error('Undefined CsvLibrary.');
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
		switch (dim) {
			case CellTypes.SOURCE_IP:
				return 'string';
			case CellTypes.DESTINATION_IP:
				return 'string';
			case CellTypes.SOURCE_PORT:
				return 'number';
			case CellTypes.DESTINATION_PORT:
				return 'number';
			case CellTypes.NETWORK_PROTOCOL:
				return 'string';
			case CellTypes.NETWORK_TRANSPORT:
				return 'string';
			case CellTypes.ARGUS_TRANSACTION_STATE:
				return 'string';
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

	public abstract getAnomalyData(dimensions: CellTypes[]): Promise<CubeCellModel[]>;
	public abstract getCounterData(dimensions: CellTypes[]): Promise<CubeCellModel[]>;
}

class D3CsvRetrievalService extends CsvRetrievalService {
	public getAnomalyData(dimensions: CellTypes[]): Promise<CubeCellModel[]> {
		const result = csv(this.anomalyFilePath() + this.fileName(dimensions)).then((data) => {
			const models: CubeCellModel[] = [];
			data.forEach((row) => {
				const model: Record<string, unknown> = {}; //Dont know how to initialize types in typescript
				dimensions.forEach(
					(dim: CellTypes) =>
						(model[CsvRetrievalService.modelKeyName(dim)] = row[CsvRetrievalService.dimName(dim)]),
				);
				model.anomalyScore = parseFloat(row['count_z_score'].replace('[', '').replace(']', ''));
				model.count = null;
				models.push(<CubeCellModel>model);
			});
			return models;
		});

		return result;
	}
	public getCounterData(dimensions: CellTypes[]): Promise<CubeCellModel[]> {
		throw new Error('Unsupported operation. Come back later.');
	}
}
