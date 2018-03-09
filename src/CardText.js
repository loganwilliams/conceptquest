import React, { Component } from "react";
import "./CardText.css";

class CardText extends Component {
  render() {
    let lineClass = "CardText-line";

    switch (this.props.item.style) {
      case "theme":
        lineClass += " Card-noindent Card-theme";
        break;
      case "indent":
        lineClass += " Card-indent";
        break;
      case "strong":
        lineClass += " Card-strong Card-indent";
        break;
      default:
        lineClass += " Card-noindent";
    }

    const linetext = this.props.item.text.map((text, i) => {
      switch (text.type) {
        case "plain":
          return (
            <span className="CardText-normal" key={text.value + i}>
              {text.value}
            </span>
          );
        case "link":
          return (
            <button onClick={text.callback} key={text.value + i}>
              {text.value}
            </button>
          );
        case "strong":
          return (
            <span className="CardText-strong" key={text.value + i}>
              {text.value}
            </span>
          );
        default:
          return <span />;
      }
    });

    return <div className={lineClass}>{linetext}</div>;
  }
}

export default CardText;
