/**
 * This file contains the interface definition of the type Dimension.
 * This data structure is required to create an axis in the parallel coordinate plot.
 * An important aspect to mention is that plotly needs a numerical mapping for each
 * value of a nominal attribute.
 *
 * Example:
 *		network_transport dimension has the nominal values 'tcp', 'udp' and 'arp'.
 *		So plotly needs a mapping from [tcp, udp, arp] to [0, 1, 2].
 */

import { CellTypes } from '../enums/cellTypes.enum';

/**
 * @property {CellTypes} type: The type of the dimension.
 * @property {Array<number>} range: Min/max value for axis (mapped integer, see file header comment)
 * @property {string} label: The axis label, e.g. "Source IP"
 * @property {Array<number>} values: The values to display (mapped integers, see file header comments)
 * @property {boolean} visible: Set this to true to hide an axis temporarily.
 * @property {Array<number>} constraintrange:
 * 		Array of mapped integers that specify the range of values to be highlighted. Other values are grayed out.
 */
interface Dimension {
	type: CellTypes;
	range: Array<number>;
	label: string;
	values: Array<number>;
	visible: boolean;
	constraintrange: Array<number>;
}

/**
 * Extension of dimension type for nominal columns.
 * @property {Array<number>} tickvals:
 * 		Values of the axis. So if a nominal axis has [tcp, udp, arp] as values, the tickvals
 * 		integer array is [0, 1, 2].
 * @property {Array<string>} ticktext:
 *		The actual string values that belong to the mapped integers. Make sure the order is correct,
 *		so when tickvals is set to [0, 1, 2], ticktext must be set to [tcp, udp, arp].
 * @property {Record<string, number>} map:
 * 		Not required for visualization, but for post-processing of e.g. filters.
 * 		Each ticktext is mapped to its tickval within the map.
 */
interface NominalDimension extends Dimension {
	tickvals: Array<number>;
	ticktext: Array<string>;
	map: Record<string, number>;
}

/** Currently, nominal dimensions and numeric dimensions have the same format.
 * This is a subject to change, so it makes sense to always use the proper interface
 * type right now. */
type OrdinalDimension = NominalDimension;
type NumericDimension = Dimension;

export type { Dimension, NominalDimension, NumericDimension, OrdinalDimension };
