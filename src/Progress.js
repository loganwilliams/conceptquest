import React, { Component } from 'react';
import './Progress.css';
import {numTurns} from './consts.js';

class Progress extends Component {
	render() {
		if (this.props.final) {
			return (
	          <div className="progress final">
	            <ul>
	              <li>{"> training... 3 / 3 epochs completed"}</li>
	              <li>{">"}</li>
	              {this.props.history.slice(1, this.props.history.length).map((h, i) => {
	                return <li key={i}>{">  * " + h.text[0].value}</li>
	              })} 
	              <li>{">"}</li>
	              <li>{"> score: " + this.props.score.toFixed(2)}</li>
	              <li>{"> training loss: " + (1000.0/this.props.score).toFixed(4)}</li>
	              <li>{">"}</li>
	              <li>{"> "}<a href="#" onClick={this.props.reset}>play again?</a></li>
	            </ul>
	          </div>
	        );
		} else {
			return (
				<div className="progress" style={{width: this.props.history.length*(100/numTurns) + "%"}}>
          			{"> training... " + (3 * this.props.history.length/numTurns).toPrecision(2) + " / 3 epochs completed "}
          		</div>);
		}
	}
}

export default Progress;