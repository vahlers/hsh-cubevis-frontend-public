import { FilterParameter } from '../../models/filter.model';

type ParallelCoordsProps = {
	data: Array<Record<string, number | string>>;
	metadata: { [id: string]: { key: string; label: string; type: string } };
	filters: FilterParameter;
};

export type { ParallelCoordsProps };
