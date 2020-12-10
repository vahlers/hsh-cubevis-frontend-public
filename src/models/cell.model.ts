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

export function compareCubeCells(a: CubeCellModel, b: Record<string, number | string | Ip>): boolean {
	let aKeys = Object.keys(a);
	const irrelevantKeys = ['anomalyScore', 'count', 'countMean', 'countStandardDeviation'];
	aKeys = aKeys.filter((key) => !irrelevantKeys.includes(key));
	const result = aKeys
		.map((key) => {
			const aval = a[key];
			const bval = b[key];
			if (aval instanceof Ip && bval instanceof Ip) return aval.toString() === bval.toString();
			else return a[key] === b[key];
		})
		.reduce((accu, current) => accu && current);

	return result;
}
