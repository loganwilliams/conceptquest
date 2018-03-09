// TODO:
//  * XXXXXXXX filtering so that nodes without many distinct children won't appear
//  * XXXXXXXX      OR: automatic history stack popping to achieve this
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
//  * XXXXXXXX Make victory screen a separate component
//  * XXXXXXXX Animate end game screen
//  * Fade colors as the game progresses
//  * XXXXXXXX Add stored "achieved victory" state
//  * Make a response tot he 
//  * Use victory state in final screen
//  * XXXXXXXX Create score calculator
//  * Make number of turns variable

import React, { Component } from 'react';
import _ from 'underscore';
import './Conceptquest.css';
import Card from './Card.js';
import EdgeFormatter from './EdgeFormatter.js';
import {commonTerms} from './commonTerms.js';
import Progress from './Progress.js';
import {numTurns, firstTheme} from './consts.js';

class Conceptquest extends Component {

  constructor() {
      super();

      let goal = commonTerms[Math.floor(Math.random() * commonTerms.length)];
      console.log(goal);

      this.state = { 
        // identity is currently unused
        gameState: 'intro',
        identity: {
          '@id': '/c/en/person',
          'label': 'a person' },
        // settings this to true fades out the current card
        fadingOut: false,
        goal,
        score: 0,
        victory: false,
        history: [],
        backupPointer: -1,
        introText: EdgeFormatter.generateIntroText(goal, this.beginGame)
      };
  }

  resetGame = () => {
    let goal = commonTerms[Math.floor(Math.random() * commonTerms.length)];
    console.log(goal);

    this.setState({
      gameState: 'intro',
      goal,
      introText: EdgeFormatter.generateIntroText(goal, this.beginGame),
      fadingOut: false,
      score: 0,
      victory: false,
      history: [],
      backupPointer: -1
    });
  }

  getCard = (lastEdge) => {
    this.fetchEdges(lastEdge.key['@id'], (json) => this.applyCard(json, lastEdge));
  }

  fetchEdges = (node, action) => {
    fetch('http://api.conceptnet.io/' + node + '?limit=2000&offset=0') 
      .then(result => result.json())
      .then(json => action(json));
  }

  applyCard = (json, lastEdge) => {
    const edges = this.formattedValidEdges(json, lastEdge);

    if (edges.length > 2) {
      // calculate the score
      const score = Math.sqrt(1000.0 / json.edges.length) + this.state.score;

      // set the new backup pointer to be the previous edge
      let newPointer = this.state.history.length;

      // unless we have already visited this edge, in which case the backup pointer does not change!
      if (this.state.history.map(h => h.key['@id']).includes(lastEdge.key['@id'])) {
        newPointer = this.state.backupPointer;
      }

      this.setState({
        items: edges,
        history: [...this.state.history, lastEdge],
        backupPointer: newPointer,
        score
      });

    } else {
      // this node didn't have enough edges, so we need to back up
      this.getCard({...lastEdge, key: this.state.history[this.state.backupPointer].key});

      // decrement the backup pointer so that if we have to do this again, we'll go back one farther
      this.setState({
        backupPointer: this.state.backupPointer === 0 ? 0 : this.state.backupPointer - 1
      })
    }
  }

  formattedValidEdges = (apiJson, lastEdge) => {
    let allEdges = _.shuffle(apiJson.edges);

    let edges = [lastEdge];

    while ((edges.length < 4) && (allEdges.length > 0)) {
      let e = allEdges.pop();

      if (this.filterResponse(e, lastEdge.edge)) {
        edges.push(EdgeFormatter.formatEdge(e, edges.length, lastEdge.key['@id'], this.transition, this.state.identity));
      }
    }

    console.log(edges);
    return edges;
  }

  filterResponse = (edge, previousEdgeId) => {
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

  beginGame = () => {
    this.setState({
      fadingOut: true
    });

    window.setTimeout(() => {
      this.setState({fadingOut: false, gameState: 'playing'});
    }, 2000);


    this.getCard({...EdgeFormatter.makePlain(this.state.introText[firstTheme]), key: {'@id': '/c/en/person'}} );
  }

  transition = (to, index) => {
    if (to['@id'] === this.state.goal['@id']) {
      // the player has won
      this.setState({
        victory: true,
        score: this.state.score + 10000
      });

      console.log('victory achieved');
    }
      
    this.getCard(EdgeFormatter.makePlain(this.state.items[index]));

    if (this.state.history.length === numTurns - 1) {
      this.setState({gameState: 'endgame', fadingOut: true});
    }
  }

  render = () => {
    console.log('Render history', this.state.history, 'backup pointer', this.state.backupPointer);

    return (
      <div id="main">
        <Progress history={this.state.history} final={this.state.gameState === 'endgame'} score={this.state.score} reset={this.resetGame} />
        <Card items={this.state.gameState === "intro" ? this.state.introText : this.state.items} fading={this.state.fadingOut}/>
      </div>
    );
  }
}

export default Conceptquest;