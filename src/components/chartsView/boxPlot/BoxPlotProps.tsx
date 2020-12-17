import { FilterParameter } from '../../../models/filter.model';
import { CubeCellModel } from '../../../models/cell.model';

type PlotProps = {
	data: CubeCellModel[];
	filters: FilterParameter;
	metadata: { [id: string]: { key: string; label: string; type: string } };
};

export type { PlotProps };
