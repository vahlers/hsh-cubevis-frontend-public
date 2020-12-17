import { FilterParameter } from '../../../models/filter.model';
import { CubeCellModel } from '../../../models/cell.model';

type HeatMapProps = {
	data: CubeCellModel[];
	filters: FilterParameter;
	metadata: { [id: string]: { key: string; label: string; type: string } };
	onSelection;
};

export type { HeatMapProps };
