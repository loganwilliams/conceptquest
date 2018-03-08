// TODO:
//  * XXXXXXXX filtering so that nodes without many distinct children won't appear
//  *       OR: automatic history stack popping to achieve this
//  * XXXXXXXX detect when we have popped to parent multiple times in a row and pop to parents parent
//  * -------- opportunities to change identity, better tests of identity
//  * XXXXXXXX changing color backgrounds
//  * background music
//  * smooth transitions of clicked item -> theme
//  * XXXXXXXX improve animation when game is starting
//  * XXXXXXXX enable deep linking by detecting URL
//  * XXXXXXXX add destination node/victory condition
//  * XXXXXXXX Add "narrativeHistory"
//  * XXXXXXXX Create end-game screen
//  * Make victory screen a separate component
//  * Animate end game screen
//  * Fade colors as the game progresses
//  * Add stored "achieved victory" state
//  * Use victory state in final screen
//  * Create score calculator
//  * Make number of turns variable

import React, { Component } from 'react';
import _ from 'underscore';
import './Conceptquest.css';
import Card from './Card.js';
import EdgeFormatter from './EdgeFormatter.js';
import {commonTerms} from './commonTerms.js';

class Conceptquest extends Component {

  constructor() {
      super();

      let goal = commonTerms[Math.floor(Math.random() * commonTerms.length)];
      console.log(goal);

      this.state = { 
        choices: [],
        identity: {
          '@id': '/c/en/person',
          'label': 'a person' },
        fadingOut: false,
        intro: true,
        introText: [
          {type: "noindent", edge: "intro-text", text: [{type: "plain", value: "Like everyone, you must learn what it means to be human."}]},
          {type: "noindent", edge: "intro-text-1", text: [{type: "plain", value: "Unlike everyone, you exist within a computer, and all you can know is your "}, {type: "strong", value: "training dataset"}, {type: "plain", value: "."}]},
          {type: "noindent", edge: "intro-text-2", text: [{type: "plain", value: "You've been programmed with a particular task:"}]},
          {type: "strong", edge:"intro-text-goal", text: EdgeFormatter.formatGoal(goal.label, this.beginGame.bind(this))},
          {type: "noindent", edge:"begin", text: [{type: "plain", value: "Along the way, "}, {type: "link", value: "try to lead a fulfilling life.", callback: this.beginGame.bind(this)}]}
        ],
        goal: goal,
        turns: 0,
        endGame: false,
        score: 0,
        victory: false
      };

      // state attributes that don't need to trigger a re-render
      this.history = [];
      this.narrativeHistory = [];
      this.deadends = 0;
  }

  fetchNextCard(node, lastEdge, firstTry) {
    var randomColor = "#000000".replace(/00/g,() => (((~~(Math.random()*3)).toString(16)) + ((~~(Math.random()*16)).toString(16))));
    document.body.style.backgroundColor = randomColor;


    fetch('http://api.conceptnet.io/' + node + '?limit=2000&offset=0') 
      .then(result => result.json())
      .then((resultJson) => {
        let score = Math.sqrt(1000.0 / resultJson.edges.length);
        this.setState({score: this.state.score + score});

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
    }, 2000);

    // magic number "4" refers to the first theme (line 4 of the intro card)
    this.fetchNextCard('/c/en/person', EdgeFormatter.makePlain(this.state.introText[4]), true);
  }

  transition(to, index) {
    // console.log(this.state.items[index]);
    // console.log(EdgeFormatter.makePlain(this.state.items[index]));
    this.narrativeHistory.push(EdgeFormatter.makePlain(this.state.items[index]).text[0].value);

    if (to['@id'] === this.state.goal['@id']) {
      // the player has won
      this.setState({
        victory: true,
        score: this.state.score + 10000
      });
      
      console.log('victory achieved');
    }
      

    if (this.state.turns === 21) {
      // this.history.push({edge: this.state.items[index].edge, node: to['@id']});
      this.setState({endGame: true});
    } else {
      this.setState({turns: this.state.turns + 1});
      this.fetchNextCard(to['@id'], EdgeFormatter.makePlain(this.state.items[index]), true);
    }
  }

  componentWillMount() {
    // get the current position

    let edge = window.location.hash.slice(1, window.location.hash.length);

    if ((edge.length > 1) && (edge !== "begin")) {
      let location = edge.slice(4, window.location.hash.length-2).split(',')[1];
      this.setState({
        intro: false,
        fadingOut: false,
        items: []
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
    if (this.state.endGame) { 
      return (
        <div id="main">
          <div key="blade" className="progress final">
            <ul>
              <li>{"> training... 3 / 3 epochs completed"}</li>
              <li>{">"}</li>
              {this.narrativeHistory.map((h) => {
                return <li key={h}>{">  * " + h}</li>
              })} 
              <li>{">"}</li>
              <li>{"> score: " + this.state.score.toFixed(2)}</li>
              <li>{"> training loss: " + (1000.0/this.state.score).toFixed(4)}</li>
              <li>{">"}</li>
              <li>{"> play again?"}</li>
            </ul>
          </div>
        </div>
        );

    } else {
      var cardClass;

      if (this.state.fadingOut) {
        cardClass = "Card-container Card-fade-out";
      } else {
        cardClass = "Card-container";
      }

      return (
        <div id="main">
          <div key="blade" className="progress" style={{width: this.state.turns*4.7619047619 + "%"}}>
          {"> training... " + (this.state.turns/7.0).toPrecision(2) + " / 3 epochs completed "}
          </div>
          <div className={cardClass}>
            <Card key="intro-card" items={this.state.intro ? this.state.introText : this.state.items} />
          </div>
        </div>
      );
    }

  }
}

export default Conceptquest;