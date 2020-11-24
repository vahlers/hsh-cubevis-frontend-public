interface Dimension {
	range: Array<number>;
	label: string;
	values: Array<number>;
	visible: boolean;
	constraintrange: Array<number>;
	tickvals: Array<number>;
	ticktext: Array<string>;
	map: Record<string, number>;
}

/** Currently, nominal dimensions and numeric dimensions have the same format.
 * This is a subject to change, so it makes sense to always use the proper interface
 * type right now. */
type NominalDimension = Dimension;
type NumericDimension = Dimension;

export type { Dimension, NominalDimension, NumericDimension };
