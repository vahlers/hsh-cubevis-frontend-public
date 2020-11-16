import { Ip } from './ip.modell';

export type CubeCellModel = {
	sourceIp?: Ip;
	destinationIp?: Ip;
	sourcePort?: number;
	destinationPort?: number;
	networkProtocol?: string;
	networkTransport?: string;
	argusTransaction?: string;
	anomalyScore: number;
	count: number;
	countMean?: number;
	countStandardDeviation?: number;
};
