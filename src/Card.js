import React, { Component } from 'react';
import CardText from './CardText.js';

class Card extends Component {
  render() {
    return(
      <div className="Card">
        {this.props.items.map((i) => {
          var lineClass = "";
          if (i.type === "theme") {
            lineClass = "Card-line Card-noindent Card-theme";
          } else if (i.type === "indent") {
            lineClass = "Card-line Card-indent";
          } else {
            lineClass = "Card-line Card-noindent";
          }

          return <CardText key={i.edge} ref={i.edge} keyValue={i.edge} text={i.text} lineClass={lineClass}/>;

        })}
      </div>
    );
  }
}

export default Card;
