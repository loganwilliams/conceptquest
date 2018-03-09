// TODO:
//  * XXXXXXXX filtering so that nodes without many distinct children won't appear
//  * XXXXXXXX      OR: automatic history stack popping to achieve this
//  * XXXXXXXX detect when we have popped to parent multiple times in a row and pop to parents parent
//  * -------- opportunities to change identity, better tests of identity
//  * XXXXXXXX changing color backgrounds
//  * background music
//  * -------- smooth transitions of clicked item -> theme
//  * XXXXXXXX improve animation when game is starting
//  * XXXXXXXX enable deep linking by detecting URL
//  * XXXXXXXX add destination node/victory condition
//  * XXXXXXXX Add "narrativeHistory"
//  * XXXXXXXX Create end-game screen
//  * XXXXXXXX Make victory screen a separate component
//  * XXXXXXXX Animate end game screen
//  * XXXXXXXX Fade colors as the game progresses
//  * XXXXXXXX Add stored "achieved victory" state
//  * XXXXXXXX Make a response to achieving victory.
//  * XXXXXXXX Use victory state in final screen
//  * XXXXXXXX Create score calculator
//  * XXXXXXXX Make number of turns variable

import React, { Component } from "react";
import _ from "underscore";
import "./Conceptquest.css";
import Card from "./Card.js";
import EdgeFormatter from "./EdgeFormatter.js";
import { commonTerms } from "./commonTerms.js";
import Progress from "./Progress.js";
import * as consts from "./consts.js";

class Conceptquest extends Component {
  constructor() {
    super();

    let goal = commonTerms[Math.floor(Math.random() * commonTerms.length)];
    console.log(goal);

    this.state = {
      // gameState can be "intro", "playing", "warning", "victory", or "endgame"
      gameState: "intro",
      // identity is currently unused
      identity: {
        "@id": "/c/en/person",
        label: "a person"
      },
      // settings this to true fades out the current card
      fadingOut: false,
      // the user's target state
      goal: goal,
      // the current score
      score: 0,
      // whether or not the user has reached their victory state
      victory: false,
      // every state the user has reached
      history: [],
      // what point will the game go back to if the user hits a dead end
      backupPointer: -1,
      // the text used to introduce the game (stored here because it is generated with random variants)
      introText: EdgeFormatter.generateIntroText(goal, this.beginGame)
    };
  }

  resetGame = () => {
    let goal = commonTerms[Math.floor(Math.random() * commonTerms.length)];
    console.log(goal);

    this.setState({
      gameState: "intro",
      goal,
      introText: EdgeFormatter.generateIntroText(goal, this.beginGame),
      fadingOut: false,
      score: 0,
      victory: false,
      history: [],
      backupPointer: -1
    });
  };

  getCard = lastEdge => {
    this.fetchEdges(lastEdge.key["@id"], json =>
      this.applyCard(json, lastEdge)
    );
  };

  fetchEdges = (node, action) => {
    fetch("http://api.conceptnet.io/" + node + "?limit=2000&offset=0")
      .then(result => result.json())
      .then(json => action(json));
  };

  applyCard = (json, lastEdge) => {
    const edges = this.formattedValidEdges(json, lastEdge);

    if (edges.length > 2) {
      // calculate the score
      const score = Math.sqrt(1000.0 / json.edges.length) + this.state.score;

      // set the new backup pointer to be the previous edge
      let newPointer = this.state.history.length;

      // unless we have already visited this edge, in which case the backup pointer does not change!
      if (
        this.state.history
          .slice(
            Math.max(0, this.state.history.length - 5),
            this.state.history.length
          )
          .map(h => h.key["@id"])
          .includes(lastEdge.key["@id"])
      ) {
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
      this.getCard({
        ...lastEdge,
        key: this.state.history[this.state.backupPointer].key
      });

      // decrement the backup pointer so that if we have to do this again, we'll go back one farther
      this.setState({
        backupPointer:
          this.state.backupPointer === 0 ? 0 : this.state.backupPointer - 1
      });
    }
  };

  formattedValidEdges = (apiJson, lastEdge) => {
    let allEdges = _.shuffle(apiJson.edges);

    let edges = [lastEdge];

    while (edges.length < 4 && allEdges.length > 0) {
      let e = allEdges.pop();

      if (this.filterResponse(e, lastEdge.edge)) {
        edges.push(
          EdgeFormatter.formatEdge(
            e,
            edges.length,
            lastEdge.key["@id"],
            this.transition,
            this.state.identity
          )
        );
      }
    }

    return edges;
  };

  filterResponse = (edge, previousEdgeId) => {
    const excluded_relations = [
      "/r/Synonym",
      "/r/ExternalURL",
      "/r/RelatedTo",
      "/r/HasContext",
      "/r/FormOf",
      "/r/DerivedFrom",
      "/r/EtymologicallyRelatedTo",
      "/r/IsA",
      "/r/SimilarTo",
      "/r/Antonym",
      "/r/Synonym",
      "/r/dbpedia/genre",
      "/r/TranslationOf",
      "/r/MannerOf",
      "/r/PartOf"
    ];

    if (
      excluded_relations.indexOf(edge.rel["@id"]) < 0 && // not an excluded relation
      edge.surfaceText &&
      previousEdgeId !== edge["@id"]
    ) {
      // has surface text
      return true;
    }

    return false;
  };

  beginGame = () => {
    this.setState({
      fadingOut: true
    });

    window.setTimeout(() => {
      this.setState({ fadingOut: false, gameState: "playing" });
    }, 2000);

    this.getCard({
      ...EdgeFormatter.makePlain(this.state.introText[consts.firstTheme]),
      key: { "@id": "/c/en/person" }
    });
  };

  transition = (to, index) => {
    // if we have achieved victory, we want a special card transition, and some bonus points
    if (to["@id"] === this.state.goal["@id"]) {
      this.setState({
        victory: true,
        score: this.state.score + 1000,
        fadingOut: true
      });

      window.setTimeout(() => {
        this.getCard(EdgeFormatter.makePlain(this.state.items[index]));
        this.setState({
          gameState: "victory",
          fadingOut: false
        });
      }, 2000);

      console.log("victory achieved");

      // if we are halfway done, we want a special card transition
    } else if (this.state.history.length === 10 && !this.state.victory) {
      this.setState({ fadingOut: true });

      window.setTimeout(() => {
        this.getCard(EdgeFormatter.makePlain(this.state.items[index]));
        this.setState({
          gameState: "warning",
          fadingOut: false
        });
      }, 2000);

      // otherwise, we have a completely normal transition
    } else {
      this.getCard(EdgeFormatter.makePlain(this.state.items[index]));

      // unless, of course, the game is over
      if (this.state.history.length === consts.numTurns - 1) {
        this.setState({ gameState: "endgame", fadingOut: true });
      }
    }
  };

  continueGame = () => {
    this.setState({
      fadingOut: true
    });

    window.setTimeout(() => {
      this.setState({
        gameState: "playing",
        fadingOut: false
      });
    }, 2000);
  };

  getBackgroundColor = () => {
    const progress = this.state.history.length / consts.numTurns;

    if (!this.state.victory) {
      const r = Math.round(40 * progress + 40);
      const g = Math.round(40 * (1 - progress));
      const b = Math.round(40 * (1 - progress));
      return "rgba(" + r + "," + g + "," + b + ",0.5)";
    } else {
      const g = Math.round(40 * progress + 40);
      const r = Math.round(40 * (1 - progress));
      const b = Math.round(40 * (1 - progress));
      return "rgba(" + r + "," + g + "," + b + ",0.5)";
    }
  };

  render = () => {
    console.log(
      "Render history",
      this.state.history,
      "backup pointer",
      this.state.backupPointer
    );

    console.log(
      EdgeFormatter.formatGoalPast(this.state.goal.label, this.state.victory)
    );
    let items = this.state.items;

    switch (this.state.gameState) {
      case "intro":
        items = this.state.introText;
        break;
      case "victory":
        items = [
          {
            style: "theme",
            edge: "victory-theme",
            text: [{ type: "plain", value: "You achieved your goal." }]
          },
          {
            style: "indent",
            edge: "victory-goal",
            text: EdgeFormatter.formatGoalPast(this.state.goal.label, true)
          },
          {
            style: "indent",
            edge: "victory-advance",
            text: [
              {
                type: "link",
                value: "You may live the rest of your days in peace.",
                callback: this.continueGame
              }
            ]
          }
        ];
        break;
      case "warning":
        items = [
          {
            style: "theme",
            edge: "warning-theme",
            text: [{ type: "plain", value: "Warning." }]
          },
          {
            style: "indent",
            edge: "warning-warning",
            text: [
              { type: "plain", value: "Your training session is half over." }
            ]
          },
          {
            style: "indent",
            edge: "warning-advance",
            text: [
              {
                type: "link",
                value: "Has your life been what you wished?",
                callback: this.continueGame
              }
            ]
          }
        ];
        break;
      default:
    }

    return (
      <div
        id="main"
        style={{
          backgroundColor: this.getBackgroundColor()
        }}
      >
        <Progress
          history={this.state.history}
          final={this.state.gameState === "endgame"}
          goalText={EdgeFormatter.formatGoalPast(
            this.state.goal.label,
            this.state.victory
          )}
          score={this.state.score}
          reset={this.resetGame}
        />
        <Card items={items} fading={this.state.fadingOut} />
      </div>
    );
  };
}

export default Conceptquest;
