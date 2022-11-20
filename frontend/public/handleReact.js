// 'use strict';
//
// // const React = require("react");
// // const ReactDOM = require("react-dom/createRoot");
// const e = React.createElement;
//
// class LikeButton extends React.Component {
// 	constructor(props) {
// 		super(props);
// 		this.state = { liked: false };
// 	}
//
// 	render() {
// 		if (this.state.liked) {
// 			return 'You liked this.';
// 		}
//
// 		return e(
// 			'button',
// 				{ onClick: () => this.setState({ liked: true }) },
// 			'Like'
// 		);
//
//
// 		// input rooms
//
// 		// return roomSelection(
// 		// 	<form onSubmit={this.handleSubmit}>
// 		// 		<label>
// 		// 			Name:
// 		// 			<input type="text" value={this.state.value} onChange={this.handleChange} />
// 		// 		</label>
// 		// 		<input type="submit" value="Submit" />
// 		// 	</form>
// 		// )
//
//
//
//
// 	}
// }
//
// const domContainer = document.querySelector('#like_button_container');
// const root = ReactDOM.createRoot(domContainer);
// root.render(e(LikeButton));
