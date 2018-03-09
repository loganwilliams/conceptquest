// TODO:
//  *     XXXXXXXXX Lookup table for grammars
//  *     XXXXXXXXX Wrapper for lookup table in this function
//  *     XXXXXXXXX Detect verb and add "to" if it is a verb (this should be generators
//            responsibility I think.)
//  *     XXXXXXXXX Modify perspective shift to use the current identity
//  *     XXXXXXXXX Modify term labels to use perspective information
//  *     XXXXXXXXX Convert gerunds to infinitives.

import nlp from "compromise";

const myWords = {
  open: "Verb",
  nod: "Verb",
  find: "Verb",
  breathe: "Verb",
  meet: "Verb",
  meeting: "Verb",
  living: "Verb",
  live: "Verb",
  slash: "Verb",
  fly: "Verb",
  water: "Verb",
  chat: "Verb",
  light: "Verb",
  save: "Verb",
  saving: "Verb",
  tell: "Verb",
  telling: "Verb"
};

let plugin = {
  conjugations: {
    join: { Gerund: "joining" },
    improve: { Gerund: "improving" },
    type: { Gerund: "typing" },
    save: { Gerund: "saving" },
    tell: { Gerund: "telling" }
  }
};

nlp.plugin(plugin);

class EdgeFormatter {
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

  static formatEdge(
    edge,
    index,
    previousEdge,
    callback,
    identity,
    useAlternatives = true
  ) {
    const term = edge.end["@id"] === previousEdge ? edge.start : edge.end;
    let alternative;

    if (useAlternatives) {
      alternative = Math.floor(Math.random() * 2);
    } else {
      alternative = 0;
    }

    let convertVerb = this.convertVerb(edge.rel["@id"], alternative);

    // //////// ///// //// ////
    // GENERATE START TERM TEXT

    let startTerm = edge.start.label;
    let startPOS = { singular: true };

    // special case if start term matches our identity
    let singularStart = nlp(startTerm);
    singularStart.nouns = singularStart.nouns().toSingular();
    let singularIdentity = nlp(identity.label);
    singularIdentity.nouns = singularIdentity.nouns().toSingular();
    if (singularStart.out("root") === singularIdentity.out("root")) {
      startTerm = "you";
      startPOS.second = true;
    }

    if (startTerm.slice(startTerm.length - 3, startTerm.length) === "you") {
      startPOS.second = true;
    }

    let processedStartTerms = this.processTerm(
      startTerm,
      startPOS,
      convertVerb[0]
    );

    // //////// /// //// ////
    // GENERATE END TERM TEXT

    let endTerm;

    if (startPOS.second) {
      endTerm = this.pronounsToSecondPerson(edge.end.label);
    } else {
      endTerm = edge.end.label;
    }

    let processedEndTerms = this.processTerm(
      endTerm,
      { singular: true },
      convertVerb[1]
    );

    // /// /////// //////
    // GET (A,B,C) VALUES
    // get the (a,b,c) values from the grammar table
    const grammar = this.grammar(
      edge.rel["@id"],
      processedStartTerms.pos,
      processedEndTerms.pos,
      alternative
    );

    // expand them into full (a, b, c) values. stored in a compressed form in
    // the table in order to make it easier to edit.
    let a;
    let b;
    let c;

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

    let text = [];
    text[0] = { type: "plain", value: a };
    if (edge.end["@id"] === previousEdge) {
      text[1] = {
        type: "link",
        value: processedStartTerms.term,
        callback: () => callback(term, index),
        pos: processedStartTerms.pos
      };
    } else {
      text[1] = {
        type: "plain",
        value: processedStartTerms.term,
        pos: processedStartTerms.pos
      };
    }
    text[2] = { type: "plain", value: b };
    if (edge.end["@id"] === previousEdge) {
      text[3] = {
        type: "plain",
        value: processedEndTerms.term,
        pos: processedEndTerms.pos
      };
    } else {
      text[3] = {
        type: "link",
        value: processedEndTerms.term,
        callback: () => callback(term, index),
        pos: processedEndTerms.pos
      };
    }
    text[4] = { type: "plain", value: c };

    // //// //////////
    // POST PROCESSING

    // lower case everything
    for (let i = 0; i < text.length; i++) {
      text[i].value = text[i].value.toLowerCase();
    }

    // capitalize first letter
    if (text[0].value === "") {
      text[1].value = text[1].value[0].toUpperCase() + text[1].value.slice(1);
    } else {
      text[0].value = text[0].value[0].toUpperCase() + text[0].value.slice(1);
    }

    return { style: "indent", key: term, text: text, edge: edge["@id"] };
  }

  // conceptNetGrammar returns the surfaceText of an edge in the [a,b,c] format
  // expected by formatEdge
  static conceptNetGrammar(edge) {
    let surfaceText = edge.surfaceText.split("[[");
    let a = surfaceText[0];
    let b = surfaceText[1].split("]]")[1];
    let c = surfaceText[2].split("]]")[1];
    return [a, b, c];
  }

  static processTerm(term, pos, conversion) {
    if (conversion === "infinitive") {
      term = this.gerundToInfinitive(term);
    } else if (conversion === "gerund") {
      term = this.toGerund(term);
    }

    const tags = nlp(term, myWords)
      .terms()
      .data();

    if (tags[0].bestTag === "Verb") {
      if (tags[0].tags.includes("Gerund")) {
        pos.gerund = true;
        pos.verb = true;
      } else {
        pos.verb = true;
      }
    } else {
      for (let i = 0; i < tags.length; i++) {
        if (tags[i].bestTag === "Plural") {
          pos.singular = false;
        }

        if (tags[i].bestTag === "Verb") {
          pos.hasVerb = true;
        }
      }
    }

    return { pos: pos, term: term };
  }

  static convertVerb(relation, alternative) {
    switch (relation) {
      case "/r/HasSubevent":
        return ["infinitive", "infinitive"];
      case "/r/Causes":
        return [false, "infinitive"];
      case "/r/UsedFor":
        return [false, "gerund"];
      case "/r/HasPrerequisite":
        return ["infinitive", false];
      default:
        return [false, false];
    }
  }

  static grammar(relation, startTerm, endTerm, alternative) {
    // pretty much the one english conjugation
    let conj = startTerm.second || !startTerm.singular;
    let sentence = endTerm.verb || endTerm.hasVerb;

    switch (relation) {
      case "/r/Desires":
        switch (alternative) {
          case 1:
            return [
              conj ? "Do " : "Does ",
              " want " + (endTerm.verb ? "to " : ""),
              "?"
            ];
          default:
            return " want" + (conj ? " " : "s ") + (endTerm.verb ? "to " : "");
        }
      case "/r/CapableOf":
        return " could ";
      case "/r/NotDesires":
        return (
          (conj ? " don't" : " doesn't") +
          " want " +
          (endTerm.verb ? "to " : "")
        );
      case "/r/CreatedBy":
        return " was created by ";
      case "/r/AtLocation":
        return startTerm.second ? " could go to " : " could be in ";
      case "/r/HasA":
        return conj ? " have " : " has ";
      case "/r/HasProperty":
        return conj ? " are " : " is ";
      case "/r/ReceivesAction":
        return " can be ";
      case "/r/HasSubevent":
        switch (alternative) {
          case 1:
            return [
              "When you ",
              endTerm.verb ? " you " : " something that happens is ",
              "."
            ];
          default:
            return [
              "Something that might happen when you ",
              " is " + (endTerm.verb ? "that you " : ""),
              "."
            ];
        }
      case "/r/HasPrerequisite":
        return [
          "If you want to ",
          ", then you should " + (endTerm.verb ? "" : "have "),
          "."
        ];
      case "/r/UsedFor":
        return [
          "You remember that ",
          startTerm.gerund
            ? " is for "
            : (startTerm.verb
                ? " is a way to "
                : startTerm.singular
                  ? " is used " + (endTerm.gerund ? "for " : "to ")
                  : " are used " + (endTerm.gerund ? "for " : "to ")) +
              (endTerm.verb ? "" : "have "),
          "."
        ];
      case "/r/HasFirstSubevent":
        return ["The first thing you do when you ", " is ", "."];
      case "/r/SymbolOf":
        return startTerm.singular ? " is a symbol of " : " are symbols of ";
      case "/r/DefinedAs":
        return ["You know that ", startTerm.singular ? " is a " : " are ", "."];
      case "/r/Causes":
        return " can cause " + (endTerm.verb ? "you to " : "");
      case "/r/MotivatedBy":
      case "/r/MotivatedByGoal":
        switch (alternative) {
          case 1:
            return [
              "You need to ",
              " because " +
                (endTerm.hasVerb
                  ? ""
                  : sentence ? "you have to " : "you have "),
              "."
            ];
          default:
            return [
              "You want to ",
              " because " +
                (endTerm.hasVerb
                  ? ""
                  : sentence ? "you want to " : "you want "),
              "."
            ];
        }
      case "/r/DistinctFrom":
        return conj ? " are not " : " is not ";
      case "/r/MadeOf":
        return conj ? " are made of " : " is made of ";
      case "/r/HasLastSubevent":
        return [
          "The last thing you do when " + (startTerm.second ? "" : "you "),
          " is ",
          "."
        ];
      case "/r/NotCapableOf":
        return " can not ";
      case "/r/CausesDesire":
        return (
          (startTerm.singular ? " makes" : " make") +
          " you want " +
          (endTerm.verb ? "to " : "")
        );
      case "/r/Entails":
        return ["... to ", "... to ", "..."];
      case "/r/NotHasProperty":
        return " is not ";
      default:
        return " " + relation + " ";
    }
  }

  // converts the first verb in gerund form to a verb in infinitive form.
  // does not affect non-verb words.
  static gerundToInfinitive(text) {
    let s = nlp(text);

    if (
      s
        .terms()
        .data()[0]
        .tags.includes("Gerund")
    ) {
      let i = s.verbs().list[0].toInfinitive();
      s.list[0].terms[0] = i.terms[0];
    }

    // s.verbs = v.toInfinitive();
    return s.out("text");
  }

  static toGerund(text) {
    let s = nlp(text);

    if (
      s
        .terms()
        .data()[0]
        .tags.includes("Verb")
    ) {
      let g = s.verbs().list[0].conjugate().Gerund;
      s.list[0].terms[0] = nlp(g).list[0].terms[0];
    }

    // s.verbs = v.toInfinitive();
    return s.out("text");
  }

  static pronounsToSecondPerson(text) {
    text = text.replace(/\bhim\/her/g, "you");
    text = text.replace(/\bher\/him/g, "you");
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

  static makePlain(cardItem) {
    let newText = "";
    for (let i = 0; i < cardItem.text.length; i++) {
      newText += cardItem.text[i].value;
    }

    return {
      ...cardItem,
      text: [{ type: "plain", value: newText }],
      style: "theme"
    };
  }

  static stripDeterminersAndPronouns(label) {
    let phrase = nlp(label, myWords);

    phrase.match("^(#Pronoun|#Determiner)").delete();

    return phrase
      .out("text")
      .trim()
      .toLowerCase();
  }

  static generateIntroText(goal, transitionCallback) {
    return [
      {
        style: "noindent",
        edge: "intro-text",
        text: [
          {
            type: "plain",
            value: "Like everyone, you must learn what it means to be human."
          }
        ]
      },
      {
        style: "noindent",
        edge: "intro-text-1",
        text: [
          {
            type: "plain",
            value:
              "Unlike everyone, you exist within a computer, and all you can know is your "
          },
          { type: "strong", value: "training dataset" },
          { type: "plain", value: "." }
        ]
      },
      {
        style: "noindent",
        edge: "intro-text-2",
        text: [
          {
            type: "plain",
            value: "You've been programmed with a particular task:"
          }
        ]
      },
      {
        style: "strong",
        edge: "intro-text-goal",
        text: this.formatGoal(goal.label)
      },
      {
        style: "noindent",
        edge: "begin",
        text: [
          { type: "plain", value: "Along the way, " },
          {
            type: "link",
            value: "try to lead a fulfilling life.",
            callback: transitionCallback
          }
        ]
      }
    ];
  }

  static formatGoalPast(label, success) {
    label = this.stripDeterminersAndPronouns(label);

    const goal = nlp(label, myWords);
    const nTerms = goal.terms().data().length;

    for (let i = 0; i < nTerms; i++) {
      const term = goal.terms().data()[i];

      if (term.bestTag === "Verb") {
        if (term.tags.includes("Gerund")) {
          label = this.gerundToInfinitive(label);
        }

        if (success) {
          return [
            {
              type: "plain",
              value: "You managed to " + label + " succesfully!"
            }
          ];
        } else {
          return [
            { type: "plain", value: "You failed to " + label + "." }
          ];
        }
      }

      if (term.tags.includes("Noun")) {
        let article = "";

        if (term.tags.includes("Singular")) {
          article = "a ";
        }

        if (success) {
          return [
            {
              type: "plain",
              value: "You successfully found " + article + label + "!"
            }
          ];
        } else {
          return [
            {
              type: "plain",
              value: "You weren't able to find " + article + label + "."
            }
          ];
        }
      }
    }

    return label;
  }

  static formatGoal(label) {
    label = this.stripDeterminersAndPronouns(label);

    const choice = Math.floor(Math.random() * 4);

    const goal = nlp(label, myWords);
    const nTerms = goal.terms().data().length;

    for (let i = 0; i < nTerms; i++) {
      let term = goal.terms().data()[i];

      if (term.bestTag === "Verb") {
        if (term.tags.includes("Gerund")) {
          label = this.gerundToInfinitive(label);
        }

        switch (choice) {
          case 0:
            return [
              { type: "plain", value: "You want to " + label + "." }
            ];
          case 1:
            return [
              { type: "plain", value: "You need to " + label + "." }
            ];
          case 2:
            return [
              {
                type: "plain",
                value: "You want to discover how to " + label + "."
              }
            ];
          default:
            return [
              {
                type: "plain",
                value: "You need to find a way to " + label + "."
              }
            ];
        }
      }

      if (term.tags.includes("Noun")) {
        let article = "";

        if (term.tags.includes("Singular")) {
          article = "a ";
        }

        switch (choice) {
          case 0:
            return [
              {
                type: "plain",
                value: "You want to find " + article + label + "."
              }
            ];
          case 1:
            return [
              {
                type: "plain",
                value: "You need to locate " + article + label + "."
              }
            ];
          case 2:
            return [
              {
                type: "plain",
                value: "You want to discover " + article + label + "."
              }
            ];
          default:
            return [
              {
                type: "plain",
                value: "You want to see " + article + label + "."
              }
            ];
        }
      }
    }

    return label;
  }
}

export default EdgeFormatter;
