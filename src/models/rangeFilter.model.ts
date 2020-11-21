import { Ip } from './ip.modell';

export type RangeFilter<T extends string | number | Ip> = {
	from: T;
	to: T;
};
