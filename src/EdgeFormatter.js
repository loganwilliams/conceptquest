// TODO:
//  *     XXXXXXXXX Lookup table for grammars
//  *     XXXXXXXXX Wrapper for lookup table in this function
//  *     XXXXXXXXX Detect verb and add "to" if it is a verb (this should be generators
//            responsibility I think.)
//  *     XXXXXXXXX Modify perspective shift to use the current identity
//  *     XXXXXXXXX Modify term labels to use perspective information
//  *     XXXXXXXXX Convert gerunds to infinitives.

import nlp from 'compromise';

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

  static formatEdge(edge, index, previousEdge, callback, identity) {
    var myWords={
      'open':'Verb',
      'nod':'Verb'
    }

    var term = (edge.end['@id'] === previousEdge) ? edge.start : edge.end;

    // //////// ///// //// ////
    // GENERATE START TERM TEXT

    var startTerm = edge.start.label;
    var startPOS = {singular: true};

    // special case if start term matches our identity
    if (nlp(startTerm).nouns().toSingular().out('root') === nlp(identity.label).nouns().toSingular().out('root')) {
      startTerm = "you";
      startPOS.second = true;
    }

    if (startTerm.slice(startTerm.length - 3, startTerm.length) === "you") {
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

    var endTerm;
    if (startPOS.second) {
      endTerm = this.pronounsToSecondPerson(edge.end.label);
    } else {
      endTerm = edge.end.label;
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
      text[1] = {type: "link", value: startTerm, callback: () => callback(term, index), pos: startPOS};
    } else {
      text[1] = {type: "plain", value: startTerm, pos: startPOS};
    }
    text[2] = {type: "plain", value: b};
    if ((edge.end['@id'] === previousEdge)) {
      text[3] = {type: "plain", value: endTerm, pos: endPOS};
    } else {
      text[3] = {type: "link", value: endTerm, callback: () => callback(term, index), pos: endPOS};
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

    console.log(text);
    return {type: "indent", key: term, text: text, edge: edge['@id']};
  }

  // conceptNetGrammar returns the surfaceText of an edge in the [a,b,c] format
  // expected by formatEdge
  static conceptNetGrammar(edge) {
    let surfaceText = edge.surfaceText.split('[[')
    let a = surfaceText[0];
    let b = surfaceText[1].split(']]')[1];
    let c = surfaceText[2].split(']]')[1];
    return [a, b, c];
  }

  static grammar(relation, startTerm, endTerm) {
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
        switch (r) {
          case 0:
          case 1:
            return (startTerm.second ? " could go to " : " could be in ");
          case 2:
          default:
            return (startTerm.second ? " might be able to go to " : " might be in ");
        }
      case '/r/HasA':
        return (conj ? " have " : " has ");
      case '/r/HasProperty':
        return (conj ? " are " : " is ");
      case '/r/ReceivesAction':
        return " can be ";
      case '/r/HasSubevent':
        return ["Something that might happen when you ", " is ", "."];
        // return ["When you ", (startTerm.second || !endTerm.verb) ? " " : " you ", "."];
      case '/r/HasPrerequisite':
        return ["If you want to ", ", then you should " + (endTerm.verb ? "" : "have "), "."];
      case '/r/UsedFor':
        switch (r) {
          case 0:
            return ["Is " + (startTerm.verb ? "" : "a "), startTerm.verb ? " a way to " : (startTerm.singular ? " used to " : " used to ") + (endTerm.verb ? "" : "have "), "."];
          case 1:
            return ["You remember that ", startTerm.verb ? " is a way to " : (startTerm.singular ? " is used to " : " are used to ") + (endTerm.verb ? "" : "have "), "."];
          case 2:
          default:
            return ["You prefer to " + (startTerm.verb ? "" :  "use a "), " to ", "." ];
        }
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
        return ["You want to ", " because " + (endTerm.verb ? "" : "you want "), "."];
      case '/r/DistinctFrom':
        return (conj ? " are not " : " is not ");
      case '/r/MadeOf':
        return (conj ? " are made of " : " is made of ");
      case '/r/HasLastSubevent':
        return ["The last thing you do when " + startTerm.second ? "" : "you ", " is ", "."];
      case '/r/NotCapableOf':
        return " can not ";
      case '/r/CausesDesire':
        return (startTerm.singular ? " makes" : " make") + " you want " + (endTerm.verb ? "to " : "");
      default:
        return " " + relation + " ";
    }
  }

  // converts the first verb in gerund form to a verb in infinitive form.
  // does not affect non-verb words.
  static gerundToInfinitive(text) {

    var s = nlp(text);

    if (s.terms().data()[0].tags.includes("Gerund")) {
      s.verbs().list[0] = s.verbs().toInfinitive().list[0];
    }

    // s.verbs = v.toInfinitive();
    return s.out('text');
  }

  static pronounsToSecondPerson(text) {
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
}

export default EdgeFormatter;