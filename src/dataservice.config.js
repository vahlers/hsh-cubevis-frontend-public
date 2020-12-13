import { CellTypes } from './enums/cellTypes.enum';
import { DataType } from './enums/dataType.enum';

export const configDataMapping = [
	{
		cellProperty: 'destinationIp',
		cellType: CellTypes.DESTINATION_IP,
		dimLabel: 'Destination Ip',
		modelKeyName: 'destinationIp',
		dimName: 'destination.ip',
		dataType: DataType.IP,
		orderInFile: 1,
	},
	{
		cellProperty: 'sourceIp',
		cellType: CellTypes.SOURCE_IP,
		dimLabel: 'Source Ip',
		modelKeyName: 'sourceIp',
		dimName: 'source.ip',
		dataType: DataType.IP,
		orderInFile: 0,
	},
	{
		cellProperty: 'sourcePort',
		cellType: CellTypes.SOURCE_PORT,
		dimLabel: 'Source Port',
		modelKeyName: 'sourcePort',
		dimName: 'source.port',
		dataType: DataType.ORDINAL,
		orderInFile: 2,
	},
	{
		cellProperty: 'destinationPort',
		cellType: CellTypes.DESTINATION_PORT,
		dimLabel: 'Destination Port',
		modelKeyName: 'destinationPort',
		dimName: 'destination.port',
		dataType: DataType.ORDINAL,
		orderInFile: 3,
	},
	{
		cellProperty: 'networkProtocol',
		cellType: CellTypes.NETWORK_PROTOCOL,
		dimLabel: 'Network Protocol',
		modelKeyName: 'networkProtocol',
		dimName: 'network.protocol',
		dataType: DataType.NOMINAL,
		orderInFile: 4,
	},
	{
		cellProperty: 'networkTransport',
		cellType: CellTypes.NETWORK_TRANSPORT,
		dimLabel: 'Network Transport',
		modelKeyName: 'networkTransport',
		dimName: 'network.transport',
		dataType: DataType.NOMINAL,
		orderInFile: 5,
	},
	{
		cellProperty: 'argusTransaction',
		cellType: CellTypes.ARGUS_TRANSACTION_STATE,
		dimLabel: 'Argus Transaction State',
		modelKeyName: 'argusTransaction',
		dimName: 'Argus.transaction.state',
		dataType: DataType.NOMINAL,
		orderInFile: 6,
	},
];

export const filePathPattern = {
	prefix: '(',
	appendix: ').csv',
	separator: ', ',
	notIncludedFlag: '_',
};

export const filePaths = {
	countFilePath: '/data/checkpoints/epoch_0/',
	countFileName: 'cell_models.csv',
	anomalyFilePath: './data/estimates/epoch_0/full_anomaly_cube/',
	singleCountFilePath: './data/validation_data/epoch_0/batch_0/item_0_sub_item_0/',
};
