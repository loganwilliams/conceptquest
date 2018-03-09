import React, { Component } from 'react';

class CardText extends Component {
  render() {
    var lineClass = "";
    if (this.props.item.style === "theme") {
      lineClass = "Card-line Card-noindent Card-theme";
    } else if (this.props.item.style === "indent") {
      lineClass = "Card-line Card-indent";
    } else if (this.props.item.style === "strong") {
      lineClass = "Card-line Card-strong Card-indent";
    } else {
      lineClass = "Card-line Card-noindent";
    }

    let linetext = [];

    for (let i = 0; i < this.props.item.text.length; i++) {
      if (this.props.item.text[i].type === "plain") {
        linetext.push(<span className="CardText-normal" key={this.props.item.edge + i}>{this.props.item.text[i].value}</span>);
      } else if (this.props.item.text[i].type === "link") {
        linetext.push(<a href={"#" + this.props.keyValue} onClick={this.props.item.text[i].callback} key={this.props.item.edge + i}>{this.props.item.text[i].value}</a>);
      } else if (this.props.item.text[i].type === "strong") {
        linetext.push(<span className="CardText-strong" key={this.props.item.edge + i}>{this.props.item.text[i].value}</span>);
      }
    }

    return <div className={lineClass}>{linetext}</div>;
  }
}

export default CardText;
