// TODO:
//  * formatting TODOs below
//  * filtering so that nodes without many distinct children won't appear
//  *   OR: automatic history stack popping to achieve this
//  * opportunities to change identity, better tests of identity
//  * XXXXXXXX changing color backgrounds
//  * background music

import React, { Component } from 'react';
import _ from 'underscore';
import './App.css';
import nlp from 'compromise';

class CardText extends Component {
  render() {
    let linetext = []
    for (let i = 0; i < this.props.text.length; i++) {
      if (this.props.text[i].type === "plain") {
        linetext.push(<span className="CardText-normal" key={i}>{this.props.text[i].value}</span>);
      } else if (this.props.text[i].type === "link") {
        linetext.push(<a href="#" onClick={this.props.text[i].callback} key={i}>{this.props.text[i].value}</a>);
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

          return <CardText key={i.key['@id']} text={i.text} lineClass={lineClass}/>;

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
        items: [{type: "theme", key: {'@id': "intro-text"}, text: [{type: "plain", value: "You are a person."}]},
          {type: "indent", key: {'@id': "intro-text-1"}, text: [{type: "plain", value: "That's what you're told."}]},
          {type: "noindent", key: {'@id': "intro-text-2"}, text: [{type: "plain", value: "But you don't know what to do."}]},
          {type: "indent", key: {'@id': "intro-text-3"}, text: [{type: "plain", value: "You need to "}, {type: "link", value:"practice", callback: this.beginGame.bind(this)}, {type: "plain", value:"."}]}]
      };

      this.history = [this.state.identity['@id']];
  }

  fetchNextCard(term, previousEdge) {
    console.log('fetching card');
    console.log(term);

    var randomColor = "#000000".replace(/00/g,() => (((~~(Math.random()*3)).toString(16)) + ((~~(Math.random()*16)).toString(16))));
    console.log(randomColor);
    document.body.style.backgroundColor = randomColor;


    fetch('http://api.conceptnet.io/' + term + '?limit=2000&offset=0') 
      .then(result => result.json())
      .then((resultJson) => {
        console.log('results to json heres what i got');
        let allEdges = _.shuffle(resultJson.edges);

        previousEdge.type = "theme";
        let edges = [previousEdge];
        while ((edges.length < 4) && (allEdges.length > 0)) {
          let e = allEdges.pop();

          if (this.filterResponse(e)) {
            edges.push(this.formatEdge(e, edges.length));
          }
        }
        console.log('found these edges');
        console.log(edges);

        this.setState({items: edges});
      });
  }

  grammar(relation) {
    switch (relation) {
      case '/r/Desires':
        return {third: ' wants ', second: ' want '};
      case '/r/CapableOf':
        var r = Math.floor(Math.random() * 4);
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
        return {third: " doesn't want ", second: " don't want "};
      case '/r/CreatedBy':
        return ' was created by ';
      case '/r/AtLocation':
        return " could go to ";
      case '/r/HasA':
        return  " has ";
      case '/r/HasProperty':
        return " are " ;
      case '/r/ReceivesAction':
        return " can be ";
      case '/r/HasSubevent':
        return ["One of the things you do when you ", " is ", "."];
      case '/r/HasPrerequisite':
        return ["If you want to ", ", then you should ", "."];
      case '/r/UsedFor':
        return ["You remember that ", " are used to ", "."];
      case '/r/HasFirstSubevent':
        return ['The first thing you do when you ', ' is ', '.'];
      default:
        return " " + relation + " ";
    }
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
  //  * Detect verb and add "to" if it is a verb (this should be gernerators)
  //      responsibility I think.
  //  * Modify perspective shift to use the current identity
  //  * Modify term labels to use perspective information
  formatEdge(edge, index) {
    var firstIsNew = false;
    if (this.firstIsNew(edge)) {
      firstIsNew = true;
    }
    var term = firstIsNew ? edge.start : edge.end;

    // //////// ///// //// ////
    // GENERATE START TERM TEXT

    var startTerm = edge.start.label;

    // default to a third person perspective
    var perspective = "third";

    // special case of start term is "a person"
    //    this special case should be modified to make it work based on
    //    current identity state
    if (startTerm === "a person" || startTerm === "A person" || startTerm === "people" || startTerm === "person") {
      startTerm = "you";
      perspective = "second";
    }

    // //////// /// //// ////
    // GENERATE END TERM TEXT

    if (perspective === "second") {
      var endTerm = this.pronounsToSecondPerson(edge.end.label);
    } else {
      var endTerm = edge.end.label;
    }

    // /// /////// //////
    // GET (A,B,C) VALUES

    // get the (a,b,c) values from the grammar table
    var grammar = this.grammar(edge.rel['@id']);

    // expand them into full (a, b, c) values. stored in a compressed form in
    // the table in order to make it easier to edit.
    var a;
    var b;
    var c;

    if (typeof grammar === "string") {
      a = "";
      b = grammar;
      c = ".";
    } else if (typeof grammar[perspective] === "undefined") {
      a = grammar[0];
      b = grammar[1];
      c = grammar[2];
    } else {
      if (typeof grammar[perspective] === "string") {
        a = "";
        b = grammar[perspective];
        c = ".";
      } else {
        a = grammar[perspective][0];
        b = grammar[perspective][1];
        c = grammar[perspective][2];
      }
    }

    console.log(term);

    // /// // /// ////////
    // PUT IT ALL TOGETHER

    var text = [];
    text[0] = {type: "plain", value: a};
    if (firstIsNew) {
      text[1] = {type: "link", value: startTerm, callback: () => this.transition(term, index)};
    } else {
      text[1] = {type: "plain", value: startTerm};
    }
    text[2] = {type: "plain", value: b};
    if (firstIsNew) {
      text[3] = {type: "plain", value: endTerm};
    } else {
      text[3] = {type: "link", value: endTerm, callback: () => this.transition(term, index)};
    }
    text[4] = {type: "plain", value: c};

    // //// //////////
    // POST PROCESSING

    // capitalize first letter
    if (text[0].value === '') {
      text[1].value = text[1].value[0].toUpperCase() + text[1].value.slice(1);
    } else {
      text[0].value = text[0].value[0].toUpperCase() + text[0].value.slice(1);
    }

    console.log(text);

    return {type: "indent", key: term, text: text};
  }

  pronounsToSecondPerson(text) {
    text = text.replace(/\btheir\b/g, "your");
    text = text.replace(/\bhimself\b/g, "yourself");
    text = text.replace(/\bherself\b/g, "yourself");
    text = text.replace(/\bone's\b/g, "your");
    text = text.replace(/\bthey\b/g, "you");
    text = text.replace(/\bhis\b/g, "your");
    text = text.replace(/\bher\b/g, "your");
    return text;
  }

  findOther(term) {
    if (term.end['@id'] === this.state.identity['@id']) {
      return term.start;
    } else {
      return term.end;
    }
  }

  firstIsNew(term) {
    return (term.end['@id'] === this.state.identity['@id']);
  }

  findOtherWithTerm(term, notThis) {
    if (term.end['@id'] === notThis) {
      return term.start;
    } else {
      return term.end;
    }
  }

  filterResponse(edge) {
    let excluded_relations = ['/r/Synonym', '/r/ExternalURL', '/r/RelatedTo', '/r/HasContext',
                      '/r/FormOf', '/r/DerivedFrom', '/r/EtymologicallyRelatedTo', 
                      '/r/IsA', '/r/SimilarTo', '/r/Antonym', '/r/Synonym',
                     '/r/dbpedia/genre', '/r/TranslationOf', '/r/MannerOf', '/r/PartOf'];

    let term = this.findOther(edge)['@id'];
    // this.numberOfEdges(term);
    
    let historyIndex = this.history.indexOf(term);
    if ((excluded_relations.indexOf(edge.rel['@id']) < 0) &&                     // not an excluded relation
      (edge.surfaceText) &&                                                      // has surface text
      ((historyIndex === -1) || (historyIndex < (this.history.length - 2)))) { // we haven't recently visited it
        return true;
    }

    return false;
  }

  filterResponses(edges) {
    edges = edges.filter(this.filterResponse.bind(this));

    return edges;
  }

  numberOfEdges(term) {
    let promise = fetch('http://api.conceptnet.io/' + term + '?limit=5&offset=0')
      .then(result => result.json()).then(result => result.edges.length);
    return promise;
  }

  cleanSurfaceText(edge) {
    return edge.surfaceText.replace(/\[/g,"").replace(/\]/g,"");
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

    this.fetchNextCard('/c/en/person', this.makePlain(this.state.items[0]));
  }

  transition(to, index) {
    console.log("transition to: ")
    console.log(to)
    console.log(index);
    console.log(this.state.items);

    this.fetchNextCard(to['@id'], this.makePlain(this.state.items[index]));
    this.setState({identity: to});
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