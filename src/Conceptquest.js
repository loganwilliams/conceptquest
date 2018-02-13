// TODO:
//  * XXXXXXXX filtering so that nodes without many distinct children won't appear
//  *       OR: automatic history stack popping to achieve this
//  * XXXXXXXX detect when we have popped to parent multiple times in a row and pop to parents parent
//  * opportunities to change identity, better tests of identity
//  * XXXXXXXX changing color backgrounds
//  * background music
//  * smooth transitions of clicked item -> theme
//  * improve animation when game is starting
//  * XXXXXXXX enable deep linking by detecting URL
//  * text distortion/decay feature

import React, { Component } from 'react';
import _ from 'underscore';
import './Conceptquest.css';
import Card from './Card.js';
import EdgeFormatter from './EdgeFormatter.js';

class Conceptquest extends Component {
  constructor() {
      super();
      this.state = { 
        choices: [],
        identity: {
          '@id': '/c/en/person',
          'label': 'a person' },
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
            edges.push(EdgeFormatter.formatEdge(e, edges.length, node, this.transition.bind(this), this.state.identity));
          }
        }

        if (edges.length > 2) {
          this.history.push({edge: lastEdge.edge, node: node});
          if (firstTry) {
            this.deadends = 0;
          }

         this.animateTransitionTo(edges);

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

  animateTransitionTo(edges) {
     this.setState({items: edges});
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

    this.fetchNextCard('/c/en/person', EdgeFormatter.makePlain(this.state.items[0]), true);
  }

  transition(to, index) {
    this.fetchNextCard(to['@id'], EdgeFormatter.makePlain(this.state.items[index]), true);
  }

  componentWillMount() {
    // get the current position

    let edge = window.location.hash.slice(1, window.location.hash.length);

    if (edge.length > 1) {
      let location = edge.slice(4, window.location.hash.length-2).split(',')[1];
      this.setState({
        intro: false,
        fadingOut: false
      });

      fetch('http://api.conceptnet.io/' + edge) 
        .then(result => result.json())
        .then((resultJson) => {
          console.log(resultJson);
          let previousEdge = EdgeFormatter.makePlain(EdgeFormatter.formatEdge(resultJson, 0, "", this.transition.bind(this), this.state.identity));
          this.fetchNextCard(location, previousEdge, true);
      });
    }
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

export default Conceptquest;