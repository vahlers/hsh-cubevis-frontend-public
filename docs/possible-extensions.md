# Possible Extensions

This documents features a few possible extensions to the project after CubeVis master project.

## Add hierarchies within dimensions

In a dimension there could be internal hierarchies that group values of a dimension by some kind. A very obvious example would be to group IPs by their bits. A more sophisticated idea, that also needs additional data is the grouping of IPs by their origin, for example a country or state. Given these hierarchies, there could be filters applied to the data in respect to the internal groups. Since these hierarchies are not present in the data yet it was not in the scope of the final product.

## Display all entries of all cubes in parallel coordinates

In regards to the issue stated in the [comparison of the data with our without the iceberg model](parcoords-comparison.md) there was the idea by Felix Heine to display all entries of all cuboids in the parallel coordinates diagram in order to provide the maximum amount of information. Since this approach is not yet verified by GLACIER it was not in the scope of the final product.

## Use a 3D Scatter Plot

To allow even more dimensions to be shown a 3D scatter plot could be implemented. This would allow the user to set a range of values or no filtering at all for the last three steps in the step view. Since it is not very easily to read it was not in the scope of the final product.

## Use state management

When propagating filter events from ChartsView up to the App component and then down to the Filters component, using a state management system for filters seems more appropiate. Since this was the only occourence in the project where state management it was not worth it to include it in the final product.