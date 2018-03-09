import React, { Component } from "react";
import CardText from "./CardText.js";
import "./Card.css";

class Card extends Component {
  render() {
    // add a class to trigger the CSS fade out animation if we need to
    let cardClass = "Card-container ";
    if (this.props.fading) {
      cardClass += "Card-fade-out";
    } else {
      cardClass += "Card-fade-in";
    }

    if (this.props.items) {
      return (
        <div className={cardClass}>
          <div className="Card">
            {this.props.items.map(i => <CardText key={i.edge} item={i} />)}
          </div>
        </div>
      );
    } else {
      return <div />;
    }
  }
}

export default Card;
