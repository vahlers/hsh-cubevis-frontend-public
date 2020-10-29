import React, { Component } from 'react';

class TestComponent extends Component {
	render(): JSX.Element {
		// Use bootstrap classes
		return <h2 className="badge badge-primary">This is a TestComponent</h2>;
	}
}

export default TestComponent; // Don’t forget to use export default!
