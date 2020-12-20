# Data-Service

The data-service provides the functionality to load the data (e.g. cuboids in .csv files) as well as filter and sort mentionted data.

To ensure extensibility, the structure of the dimensions is configurable in a separate file: `dataservice.config.js`

## Config file structure

The `dataservice.config.js` currently has 3 properties: `configDataMapping, filePathPattern, filePaths`.

The structure is like this:
```javascript
export const configDataMapping = [
	{
		cellProperty: 'destinationIp',
		cellType: CellTypes.DESTINATION_IP,
		dimLabel: 'Destination Ip',
		dimName: 'destination.ip',
		dataType: DataType.IP,
		orderInFile: 0,
	},
	... // one object for each dimension
];

export const filePathPattern = {
	prefix: '(',
	appendix: ').csv',
	separator: ', ',
	notIncludedFlag: '_',
};

export const filePaths = {
	countFilePath: '/data/checkpoints/epoch_0/',
	countFileName: 'cell_models.csv',
	anomalyFilePath: './data/estimates/epoch_0/full_anomaly_cube/',
	singleCountFilePath: './data/validation_data/epoch_0/batch_0/item_0_sub_item_0/',
};
```
`configDataMapping` is an array which consists of data-mapping objects which do have the following attributes:

- `cellProperty`: the name of the cell property found in `src/models/cell.model.ts`. To add a new dimension it is necessary to add a new field with the same name in said file. So if the value in `cellProperty` is `sourceIp`, there has to be a `sourceIp` property in `cell.model.ts`.
- `cellType`: The celltype property maps the internally used enum to the dimension. To add a new dimension, an additional entry in the enum is necessary.
- `dimLabel`: The label which should appear in the application for this dimension.
- `dimName`: Name of the column in the csv file which represents this dimension.
- `dataType`: The datatype of this dimension. This is needed for differentiating in the diagrams. There are currently four data types: `NUMERIC`, `NOMINAL`, `IP`, `ORDINAL`. 
- `orderInFile`: The order when the name in filename appears starting at 0. Example filename: "(source.ip, destination.ip, source.port, destination.port, network.protocol, network.transport, Argus.transaction.state).csv" for source.ip the order would be 0, destination.ip 1 etc.

`filePathPattern` Describes the pattern how the csv files are structured (assuming there is one distinct csv file per cuboid). The following attributes are being used:

- `prefix`: The characters which the file starts with.
- `appendix`: The characters which the file ends with including the file extension.
- `separator`: Characters which separates the dimensions in the filename. Isn't applied for the last dimension.
- `notIncludedFlag`: Character which equals a *, so a not included dimension.

`filePaths` consists of different filepaths which are needed to parse the data. The data files should be located in the `public/data`-folder.

- `countFilePath`: Filepath for the folder which contains the count-values.
- `countFileName`: Name of the file which containts the count-values.
- `anomalyFilePath`: Filepath for the folder which contains the anomaly-values.
- `singleCountFilePath`: Filepath for the folder which containts the validation-data.

## How to add a new dimension

To add a new dimension to the dataservice, there are multiple files which have to be changed. Namely:
- `src/models/cell.model.ts`
- `src/enums/cellTypes.enum.ts`
- `dataservice.config.js`

First of all, the new name of the dimension has to specified in the `src/models/cell.model.ts` file as well as in here: `src/enums/cellTypes.enum.ts`, so it can be accessed as type.

The only thing left is to add a new object to the `configDataMapping` array in the `dataservice.config.js` using the schema explained above. For anomaly scores it is assumed that there is a file for each possible cuboid. The new dimensionname has to appear in the filename, so it can be parsed correctly.

If the filename-pattern changes, the `filePathPattern` property has to be adjusted as well.

And that's all! The new dimension should now appear in the application.