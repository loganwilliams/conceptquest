// TODO:
//  * formatting TODOs below
//  * XXXXXXXX filtering so that nodes without many distinct children won't appear
//  *       OR: automatic history stack popping to achieve this
//  * detect when we have popped to parent multiple times in a row and pop to parents parent
//  * opportunities to change identity, better tests of identity
//  * XXXXXXXX changing color backgrounds
//  * background music
//  * smooth transitions of clicked item -> theme

import React, { Component } from 'react';
import _ from 'underscore';
import './App.css';
import nlp from 'compromise';

class CardText extends Component {
  render() {
    let linetext = []
    for (let i = 0; i < this.props.text.length; i++) {
      if (this.props.text[i].type === "plain") {
        linetext.push(<span className="CardText-normal" key={this.props.keyValue + i}>{this.props.text[i].value}</span>);
      } else if (this.props.text[i].type === "link") {
        linetext.push(<a href={"#" + this.props.keyValue} onClick={this.props.text[i].callback} key={this.props.keyValue + i}>{this.props.text[i].value}</a>);
      }
    }

    return <div className={this.props.lineClass}>{linetext}</div>;
  }
}

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

          return <CardText key={i.edge} keyValue={i.edge} text={i.text} lineClass={lineClass}/>;

        })}
      </div>
    );
  }
}

class App extends Component {
  constructor() {
      super();
      this.state = { 
        choices: [],
        identity: {
          '@id': '/c/en/person',
          'label': 'a person' },
        trueHistory: [],
        fadingOut: false,
        intro: true,
        items: [{type: "theme", edge: "intro-text", text: [{type: "plain", value: "You are a person."}]},
          {type: "indent", edge: "intro-text-1", text: [{type: "plain", value: "That's what you're told."}]},
          {type: "noindent", edge: "intro-text-2", text: [{type: "plain", value: "But you don't know what to do."}]},
          {type: "indent", edge:"begin", text: [{type: "plain", value: "You need to "}, {type: "link", value:"practice", callback: this.beginGame.bind(this)}, {type: "plain", value:"."}]}]
      };

      this.history = [];
      this.deadends = 0;
  }

  fetchNextCard(node, lastEdge, firstTry) {
    var randomColor = "#000000".replace(/00/g,() => (((~~(Math.random()*3)).toString(16)) + ((~~(Math.random()*16)).toString(16))));
    document.body.style.backgroundColor = randomColor;


    fetch('http://api.conceptnet.io/' + node + '?limit=2000&offset=0') 
      .then(result => result.json())
      .then((resultJson) => {
        let allEdges = _.shuffle(resultJson.edges);

        lastEdge.type = "theme";
        let edges = [lastEdge];
        while ((edges.length < 4) && (allEdges.length > 0)) {
          let e = allEdges.pop();

          if (this.filterResponse(e, lastEdge.edge)) {
            edges.push(this.formatEdge(e, edges.length, node));
          }
        }

        if (edges.length > 2) {
          this.history.push({edge: lastEdge.edge, node: node});
          if (firstTry) {
            this.deadends = 0;
          }
          this.setState({items: edges});
        } else {
          this.deadends += 1;

          let parent = this.history.pop();
          if (this.deadends >= 2 && this.history.length >= 1) {
            parent = this.history.pop();
          }

          this.fetchNextCard(parent.node, lastEdge, false);
        }

      });
  }

  grammar(relation, startTerm, endTerm) {
    let r = Math.floor(Math.random() * 4);
    // pretty much the one english conjugation
    let conj = (startTerm.second || !startTerm.singular);

    switch (relation) {
      case '/r/Desires':
        return ' want' + (conj ? " " : "s ") + (endTerm.verb ? "to " : "");
      case '/r/CapableOf':
        switch (r) {
          case 0:
            return ' could ';
          case 1:
            return ['Could ', ' ', '?'];
          case 2:
            return ' can ';
          default:
            return ' could ';
        }
      case '/r/NotDesires':
        return (conj ? " don't" : " doesn't") + " want " + (endTerm.verb ? "to " : "");
      case '/r/CreatedBy':
        return ' was created by ';
      case '/r/AtLocation':
        return (startTerm.second ? " could go to " : " could be in ");
      case '/r/HasA':
        return (conj ? " have " : " has ");
      case '/r/HasProperty':
        return (conj ? " are " : " is ");
      case '/r/ReceivesAction':
        return " can be ";
      case '/r/HasSubevent':
        return ["When you ", " you ", "."];
      case '/r/HasPrerequisite':
        return ["If you want to ", ", then you should " + (endTerm.verb ? "" : "have "), "."];
      case '/r/UsedFor':
        return ["You remember that ", startTerm.verb ? " is a way to " : (startTerm.singular ? " is used to " : " are used to ") + (endTerm.verb ? "" : "have "), "."];
      case '/r/HasFirstSubevent':
        return ['The first thing you do when you ', ' is ', '.'];
      case '/r/SymbolOf':
        return (startTerm.singular ? " is a symbol of " : " are symbols of ");
      case '/r/DefinedAs':
        return ["You know that ", (startTerm.singular ? " is a " : " are "), "."];
      case '/r/Causes':
        switch (r) {
          case 0:
            return ' can cause ' + (endTerm.verb ? "you to " : "");
          case 1:
            return ['Could ', ' have caused ' + (endTerm.verb ? "you to " : ""), '?'];
          case 2:
            return ' might have caused ' + (endTerm.verb ? "you to " : "");
          default:
            return ' could cause ' + (endTerm.verb ? "you to " : "");
        }
      case '/r/MotivatedBy':
      case '/r/MotivatedByGoal':
        return ["You want to ", " because ", "."];
      case '/r/DistinctFrom':
        return (conj ? " are not " : " is not ");
      case '/r/MadeOf':
        return (conj ? " are made of " : " is made of ");
      case '/r/HasLastSubevent':
        return ["The last thing you do when you ", " is ", "."];
      case '/r/NotCapableOf':
        return " can not ";
      case '/r/CausesDesire':
        return (startTerm.singular ? " makes" : " make") + " you want " + (endTerm.verb ? "to " : "");
      default:
        return " " + relation + " ";
    }
  }

  // converts all verbs in gerund form to verbs in infinitive form.
  // does not affect non-verb words.
  // TODO: make this do something
  gerundToInfinitive(text) {
    return text;
  }

  // this is an important function and needs a lot of work
  //    listen more to whether or not the node is at the beginning or end.

  // Every sentence fits into the pattern 
  //    a {term} b {term} c.
  // Each term has a few properties (obtained with Compromise), including:
  //    noun, plural
  // Each grammar generates a set of (a, b, c) values using only the
  //    relation information from that edge. It can generate multiple
  //    versions, including, e.g. a second person version. It returns
  //    them all. It's really more of a lookup table.
  //      (maybe this also needs the plurality/noun-ness of each term?)
  // The formatEdge function decides which variant of the grammar to use,
  //    and how to format/process each of the terms. It also applies any
  //    final transformations, for example punctuation and capitalization.
  // TODO:
  //  *     XXXXXXXXX Lookup table for grammars
  //  *     XXXXXXXXX Wrapper for lookup table in this function
  //  *     XXXXXXXXX Detect verb and add "to" if it is a verb (this should be generators
  //            responsibility I think.)
  //  *     XXXXXXXXX Modify perspective shift to use the current identity
  //  *     XXXXXXXXX Modify term labels to use perspective information
  //  * Convert gerunds to infinitives.
  formatEdge(edge, index, previousEdge) {
    var myWords={
      'open':'Verb'
    }

    var term = (edge.end['@id'] === previousEdge) ? edge.start : edge.end;

    // //////// ///// //// ////
    // GENERATE START TERM TEXT

    var startTerm = edge.start.label;
    var startPOS = {singular: true};

    // special case if start term matches our identity
    if (nlp(startTerm).nouns().toSingular().out('root') === nlp(this.state.identity.label).nouns().toSingular().out('root')) {
      startTerm = "you";
      startPOS.second = true;
    }

    startTerm = this.gerundToInfinitive(startTerm);
    var startTags = nlp(startTerm, myWords).terms().data();

    if (startTags[0].bestTag === "Verb") {
      startPOS.verb = true;
    } else {
      for (let i = 0; i < startTags.length; i++) {
        if (startTags[i].bestTag === "Plural") {
          startPOS.singular = false;
        }
      }
    }

    // //////// /// //// ////
    // GENERATE END TERM TEXT

    if (startPOS.second) {
      var endTerm = this.pronounsToSecondPerson(edge.end.label);
    } else {
      var endTerm = edge.end.label;
    }

    endTerm = this.gerundToInfinitive(endTerm);
    var endTags = nlp(endTerm, myWords).terms().data();

    var endPOS = {singular: true};
    if (endTags[0].bestTag === "Verb") {
      endPOS.verb = true;
    } else {
      for (let i = 0; i < endTags.length; i++) {
        if (endTags[i].bestTag === "Plural") {
          endPOS.singular = false;
        }
      }
    }

    // /// /////// //////
    // GET (A,B,C) VALUES

    // get the (a,b,c) values from the grammar table
    var grammar = this.grammar(edge.rel['@id'], startPOS, endPOS);

    // expand them into full (a, b, c) values. stored in a compressed form in
    // the table in order to make it easier to edit.
    var a;
    var b;
    var c;

    if (typeof grammar === "string") {
      a = "";
      b = grammar;
      c = ".";
    } else {
      a = grammar[0];
      b = grammar[1];
      c = grammar[2];
    }

    // /// // /// ////////
    // PUT IT ALL TOGETHER

    var text = [];
    text[0] = {type: "plain", value: a};
    if ((edge.end['@id'] === previousEdge)) {
      text[1] = {type: "link", value: startTerm, callback: () => this.transition(term, index)};
    } else {
      text[1] = {type: "plain", value: startTerm};
    }
    text[2] = {type: "plain", value: b};
    if ((edge.end['@id'] === previousEdge)) {
      text[3] = {type: "plain", value: endTerm};
    } else {
      text[3] = {type: "link", value: endTerm, callback: () => this.transition(term, index)};
    }
    text[4] = {type: "plain", value: c};

    // //// //////////
    // POST PROCESSING

    // lower case everything
    for (let i = 0; i < text.length; i++) {
      text[i].value = text[i].value.toLowerCase();
    }

    // capitalize first letter
    if (text[0].value === '') {
      text[1].value = text[1].value[0].toUpperCase() + text[1].value.slice(1);
    } else {
      text[0].value = text[0].value[0].toUpperCase() + text[0].value.slice(1);
    }

    return {type: "indent", key: term, text: text, edge: edge['@id']};
  }

  pronounsToSecondPerson(text) {
    text = text.replace(/\btheir\b/g, "your");
    text = text.replace(/\bhimself\b/g, "yourself");
    text = text.replace(/\bherself\b/g, "yourself");
    text = text.replace(/\bone's\b/g, "your");
    text = text.replace(/\bthey\b/g, "you");
    text = text.replace(/\bhis\b/g, "your");
    text = text.replace(/\bher\b/g, "your");
    text = text.replace(/\bthem\b/g, "you");
    text = text.replace(/\bhim\b/g, "you");
    text = text.replace(/\bhe\b/g, "you");
    text = text.replace(/\bshe\b/g, "you");
    return text;
  }

  filterResponse(edge, previousEdgeId) {
    let excluded_relations = ['/r/Synonym', '/r/ExternalURL', '/r/RelatedTo', '/r/HasContext',
                      '/r/FormOf', '/r/DerivedFrom', '/r/EtymologicallyRelatedTo', 
                      '/r/IsA', '/r/SimilarTo', '/r/Antonym', '/r/Synonym',
                     '/r/dbpedia/genre', '/r/TranslationOf', '/r/MannerOf', '/r/PartOf'];

    if ((excluded_relations.indexOf(edge.rel['@id']) < 0) &&    // not an excluded relation
      (edge.surfaceText) && (previousEdgeId !== edge['@id'])){  // has surface text
        return true;
    }

    return false;
  }

  makePlain(cardItem) {
    let newText = "";
    for (var i = 0; i < cardItem.text.length; i++) {
      newText += cardItem.text[i].value;
    }

    cardItem.text = [{type: "plain", value: newText}];
    return cardItem;
  }

  beginGame() {
    this.setState({
      fadingOut: true
    });

    window.setTimeout(() => {
      this.setState({fadingOut: false, intro: false});
    }, 1500);

    // TODO
    // okay, i need to make some kind of promise that is fulfilled after a window timeout so that 
    // these things happen simultaneously

    this.fetchNextCard('/c/en/person', this.makePlain(this.state.items[0]), true);
  }

  transition(to, index) {
    this.fetchNextCard(to['@id'], this.makePlain(this.state.items[index]), true);
  }

  render() {
    var cardClass;
    if (this.state.fadingOut) {
      cardClass = "Card-container Card-fade-out";
    } else {
      cardClass = "Card-container";
    }

    if (this.state.intro) {
      return (
        <div className={cardClass}>
          <Card key="intro-card" items={this.state.items} />
        </div>
      );
    } else {
      return (
        <div className={cardClass}>
          <Card key={"play-card"} items={this.state.items} />
        </div>
      );
    }

  }
}

export default App;