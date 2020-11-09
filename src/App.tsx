import React from 'react';
import './App.css';

import ParallelCoords from './components/parallelCoords/ParallelCoords';
import Filters from './components/filters/Filters';
import ChartsView from './components/chartsView/ChartsView';

function App(): JSX.Element {
	return (
		<div className="App">
			<div className="row bg-primary w-75 align-items-center">
				<div className="col bg-primary">
					<div className="row">
						<Filters></Filters>
						<ChartsView></ChartsView>
					</div>
					<div className="row">
						<ParallelCoords></ParallelCoords>
					</div>
				</div>
			</div>
		</div>
	);
}
export default App;
