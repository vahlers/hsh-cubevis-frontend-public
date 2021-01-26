import { CellTypes } from './enums/cellTypes.enum';
import { DataType } from './enums/dataType.enum';

export const CONFIG_DATA_MAPPING = [
	{
		cellProperty: 'destinationIp',
		cellType: CellTypes.DESTINATION_IP,
		dimLabel: 'Destination Ip',
		dimName: 'destination.ip',
		dataType: DataType.IP,
		orderInFile: 1,
	},
	{
		cellProperty: 'sourceIp',
		cellType: CellTypes.SOURCE_IP,
		dimLabel: 'Source Ip',
		dimName: 'source.ip',
		dataType: DataType.IP,
		orderInFile: 0,
	},
	{
		cellProperty: 'sourcePort',
		cellType: CellTypes.SOURCE_PORT,
		dimLabel: 'Source Port',
		dimName: 'source.port',
		dataType: DataType.ORDINAL,
		orderInFile: 2,
	},
	{
		cellProperty: 'destinationPort',
		cellType: CellTypes.DESTINATION_PORT,
		dimLabel: 'Destination Port',
		dimName: 'destination.port',
		dataType: DataType.ORDINAL,
		orderInFile: 3,
	},
	{
		cellProperty: 'networkProtocol',
		cellType: CellTypes.NETWORK_PROTOCOL,
		dimLabel: 'Network Protocol',
		dimName: 'network.protocol',
		dataType: DataType.NOMINAL,
		orderInFile: 4,
	},
	{
		cellProperty: 'networkTransport',
		cellType: CellTypes.NETWORK_TRANSPORT,
		dimLabel: 'Network Transport',
		dimName: 'network.transport',
		dataType: DataType.NOMINAL,
		orderInFile: 5,
	},
	{
		cellProperty: 'argusTransaction',
		cellType: CellTypes.ARGUS_TRANSACTION_STATE,
		dimLabel: 'Argus Transaction State',
		dimName: 'Argus.transaction.state',
		dataType: DataType.NOMINAL,
		orderInFile: 6,
	},
];

export const FILE_PATH_PATTERN = {
	prefix: '(',
	appendix: ').csv',
	separator: ', ',
	notIncludedFlag: '_',
};

export const FILE_PATHS = {
	countFilePath: '/data/checkpoints/epoch_0/',
	countFileName: 'cell_models.csv',
	anomalyFilePath: './data/estimates/epoch_0/full_anomaly_cube/',
	singleCountFilePath: './data/validation_data/epoch_0/batch_0/item_0_sub_item_0/',
};

export const SCORE_KEY = 'anomalyScore';

export const SCORE_MIN = 0.0;

export const SCORE_MAX = 10.0;

export const COLOR_SCALE = [
	['0.0', '#00ff00'],
	['0.33', '#FBFF31'],
	['0.66', '#EB9A65'],
	['1.0', '#ff0000'],
];

export const COLOR_PPRIMARY = '#007bff';
