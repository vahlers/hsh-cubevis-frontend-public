interface Dimension {
	range: Array<number>;
	label: string;
	values: Array<number>;
	visible: boolean;
	constraintrange: Array<number>;
}
interface NominalDimension extends Dimension {
	tickvals: Array<number>;
	ticktext: Array<string>;
}

type NumericDimension = Dimension;

export type { Dimension, NominalDimension, NumericDimension };
