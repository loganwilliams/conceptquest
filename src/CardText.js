import React, { Component } from 'react';

class CardText extends Component {
  render() {
    let linetext = []
    for (let i = 0; i < this.props.text.length; i++) {
      if (this.props.text[i].type === "plain") {
        linetext.push(<span className="CardText-normal" key={this.props.keyValue + i}>{this.props.text[i].value}</span>);
      } else if (this.props.text[i].type === "link") {
        linetext.push(<a href={"#" + this.props.keyValue} onClick={this.props.text[i].callback} key={this.props.keyValue + i}>{this.props.text[i].value}</a>);
      } else if (this.props.text[i].type === "strong") {
        linetext.push(<span className="CardText-strong" key={this.props.keyValue + i}>{this.props.text[i].value}</span>);
      }
    }

    return <div className={this.props.lineClass}>{linetext}</div>;
  }
}

export default CardText;
