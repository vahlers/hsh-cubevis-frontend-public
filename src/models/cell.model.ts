export type CubeCellModel = {
	sourceIp?: string;
	destinationIp?: string;
	sourcePort?: number;
	destinationPort?: number;
	networkProtocol?: string;
	networkTransport?: string;
	argusTransaction?: string;
	anomalyScore: number;
	count: number;
};
