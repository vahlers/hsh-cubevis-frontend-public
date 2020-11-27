import { CellTypes } from '../enums/cellTypes.enum';
import { Ip } from './ip.modell';

type Filter = { type: CellTypes; value: number | string | Ip };

export type { Filter };
