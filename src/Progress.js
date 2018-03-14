import React, { Component } from "react";
import "./Progress.css";
import * as consts from "./include/consts.js";

// Renders a game progress overlay. It is an unobtrusive progress bar during
// play, and a descriptive score overlay when the game is over.
class Progress extends Component {
  render() {
    if (this.props.final) {
      return (
        <div className="Progress Progress-final">
          <ul>
            <li>{"> Training... 3 / 3 epochs completed"}</li>
            <li>{">"}</li>
            <li>{"> " + this.props.goalText[0].value}</li>
            <li>{">"}</li>
            {this.props.history
              .slice(1, this.props.history.length)
              .map((h, i) => {
                return <li key={i}>{">  * " + h.text[0].value}</li>;
              })}
            <li>{">"}</li>
            {/* reformat the score as "training loss" (for fun) */}
            <li>
              {"> "}<span className="Progress-score">{"Training loss: " + (400.0 / this.props.score).toFixed(4)}</span>
            </li>
            <li>{"> "}</li>
            <li>{"> "}Background sound effects by <a href="https://kowalskiroom.bandcamp.com/album/aberrations">Kowalski Room</a> under a Creative Commons license.</li>
            <li>{"> "}Concepts and relations from the <a href="http://conceptnet.io/">ConceptNet</a> project under a Creative Commons license.</li>
            <li>{">"}</li>
            <li>
              {"> "}
              <button onClick={this.props.reset}>Play again?</button>
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
          {"> Training... " +
            (3 * this.props.history.length / consts.numTurns).toPrecision(2) +
            " / 3 epochs completed "}
        </div>
      );
    }
  }
}

export default Progress;
