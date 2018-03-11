import React, { Component } from "react";
import "./Progress.css";
import * as consts from "./include/consts.js";

class Progress extends Component {
  render() {
    if (this.props.final) {
      return (
        <div className="Progress Progress-final">
          <ul>
            <li>{"> training... 3 / 3 epochs completed"}</li>
            <li>{">"}</li>
            <li>{"> " + this.props.goalText[0].value}</li>
            <li>{">"}</li>
            {this.props.history
              .slice(1, this.props.history.length)
              .map((h, i) => {
                return <li key={i}>{">  * " + h.text[0].value}</li>;
              })}
            <li>{">"}</li>
            <li>{"> score: " + this.props.score.toFixed(2)}</li>
            {/* reformat the score as "training loss" (for fun) */}
            <li>
              {"> training loss: " + (400.0 / this.props.score).toFixed(4)}
            </li>
            <li>{">"}</li>
            <li>
              {"> "}
              <button onClick={this.props.reset}>play again?</button>
            </li>
          </ul>
        </div>
      );
    } else {
      // display a progress bar with a width proportional to currentTurn / numTurns
      // the text displays the progress as a number out of 3 (for fun!)
      return (
        <div
          className="Progress"
          style={{
            width: this.props.history.length * (100 / consts.numTurns) + "%"
          }}
        >
          {"> training... " +
            (3 * this.props.history.length / consts.numTurns).toPrecision(2) +
            " / 3 epochs completed "}
        </div>
      );
    }
  }
}

export default Progress;
