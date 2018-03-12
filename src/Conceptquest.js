import React, { Component } from "react";
import _ from "underscore";
import "./Conceptquest.css";
import Card from "./Card.js";
import * as EdgeFormatter from "./include/EdgeFormatter.js";
import { commonTerms } from "./include/commonTerms.js";
import Progress from "./Progress.js";
import * as consts from "./include/consts.js";

// The main component that keeps track of game state and renders every 
// other component.
class Conceptquest extends Component {
  constructor() {
    super();

    const goal = commonTerms[Math.floor(Math.random() * commonTerms.length)];

    this.state = {
      // gameState can be "intro", "playing", "warning", "victory", or "endgame"
      gameState: "intro",
      // identity is currently a constant
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
      // the text used to introduce the game (stored here because it is 
      // generated with random variants)
      introText: EdgeFormatter.generateIntroText(goal, this.beginGame)
    };
  }

  // Resets the game. Essentially to the state constructed in this.constructor()
  resetGame = () => {
    const goal = commonTerms[Math.floor(Math.random() * commonTerms.length)];
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

  // Fetch, filter, and apply the next set of choices ("card") that the
  // ConceptNet API gives us using a particular edge as the starting point.
  getCard = lastEdge => {
    this.fetchEdges(lastEdge.key["@id"], json =>
      this.applyCard(json, lastEdge)
    );
  };

  // Fetch the card from the ConceptNet API and call action(json) on the result.
  fetchEdges = (node, action) => {
    fetch("http://api.conceptnet.io/" + node + "?limit=2000&offset=0")
      .then(result => result.json())
      .then(json => action(json));
  };

  // takes an API response and:
  //  FILTERS
  //   * filters response to select suitable edges (formattedValidEdges())
  //  VALIDATES
  //   * determines if set of filtered edges ("card") is suitable
  //  APPLIES
  //   * updates player score
  //   * updates current card display
  //   * updates player history
  //  UNLESS INVALID
  //   * calls this.getCard() again on the parent edge (previous visited)
  //     of lastEdge. if we have recently visited the parent edge, go to
  //     the parent's parent edge (and so on).
  applyCard = (json, lastEdge) => {
    const edges = this.formattedValidEdges(json, lastEdge);

    if (edges.length > 2) {
      // calculate the score
      const score = Math.sqrt(1000.0 / json.edges.length) + this.state.score;

      // set the new backup pointer to be the previous edge
      let newPointer = this.state.history.length;

      // unless we have already visited this edge, in which case the backup
      // pointer does not change!
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

      // decrement the backup pointer so that if we have to do this again,
      // we'll go back one farther
      this.setState({
        backupPointer:
          this.state.backupPointer === 0 ? 0 : this.state.backupPointer - 1
      });
    }
  };

  // Generates a list of valid edges (not the same as the last edge, not
  // with an excluded relation) from a ConceptNet API response.
  formattedValidEdges = (apiJson, lastEdge) => {
    let allEdges = _.shuffle(apiJson.edges);

    let edges = [lastEdge];

    while (edges.length < 4 && allEdges.length > 0) {
      let e = allEdges.pop();

      if (this.filterResponse(e, lastEdge.edge)) {
        const index = edges.length;

        edges.push(
          EdgeFormatter.formatEdge(
            e,
            lastEdge.key["@id"],
            (term) => this.transition(term, index),
            this.state.identity
          )
        );
      }
    }

    return edges;
  };

  // Checks to see if "edge" is an edge that we want to use.
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

  // Starts the game by running the first transition.
  beginGame = () => {
    this.setState({
      fadingOut: true
    });

    window.setTimeout(() => {
      this.setState({ fadingOut: false, gameState: "playing" });
    }, consts.fadeDelay);

    this.getCard({
      ...EdgeFormatter.makePlain(this.state.introText[consts.firstTheme]),
      key: { "@id": "/c/en/person" }
    });
  };

  // Transition to a node called "to," from line "index" of the previous card.
  transition = (to, index) => {
    // if we have achieved victory, we want a special card transition, and some
    // bonus points
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
      }, consts.fadeDelay);

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
      }, consts.fadeDelay);

      // otherwise, we have a completely normal transition
    } else {
      this.getCard(EdgeFormatter.makePlain(this.state.items[index]));

      // unless, of course, the game is over
      if (this.state.history.length === consts.numTurns - 1) {
        this.setState({ gameState: "endgame", fadingOut: true });
      }
    }
  };

  // Return to playing the game after an insterstitial card was presented.
  continueGame = () => {
    // fade out interstitial card
    this.setState({
      fadingOut: true
    });

    // after CSS transition is completed, fade in a normal game card.
    window.setTimeout(() => {
      this.setState({
        gameState: "playing",
        fadingOut: false
      });
    }, consts.fadeDelay);
  };

  // Generates a background color ambiance for the game, based on the player's
  // current progress.
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
    let items = this.state.items;

    // Depending on game state, we may displasy special cards.
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
            text: EdgeFormatter.formatGoal(this.state.goal.label, "past", true)
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
            text: [{ type: "plain", value: "Warning: your training session is half over." }]
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
          goalText={EdgeFormatter.formatGoal(
            this.state.goal.label,
            "past",
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
