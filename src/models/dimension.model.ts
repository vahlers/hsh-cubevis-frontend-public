import { CellTypes } from '../enums/cellTypes.enum';

interface Dimension {
	type: CellTypes;
	range: Array<number>;
	label: string;
	values: Array<number>;
	visible: boolean;
	constraintrange: Array<number>;
}

interface NominalDimension extends Dimension {
	tickvals: Array<number>;
	ticktext: Array<string>;
	map: Record<string, number>;
}

type OrdinalDimension = NominalDimension;
type NumericDimension = Dimension;

/** Currently, nominal dimensions and numeric dimensions have the same format.
 * This is a subject to change, so it makes sense to always use the proper interface
 * type right now. */

export type { Dimension, NominalDimension, NumericDimension, OrdinalDimension };
