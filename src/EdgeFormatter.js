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
      'nod':'Verb',
      'find': 'Verb',
      'breathe': 'Verb',
      'meet': 'Verb',
      'meeting': 'Verb',
      'living': 'Verb',
      'live': 'Verb',
      'slash': 'Verb'
    }

    var term = (edge.end['@id'] === previousEdge) ? edge.start : edge.end;

    // //////// ///// //// ////
    // GENERATE START TERM TEXT

    var startTerm = edge.start.label;
    var startPOS = {singular: true};

    // special case if start term matches our identity
    let singularStart = nlp(startTerm);
    singularStart.nouns = singularStart.nouns().toSingular();
    let singularIdentity = nlp(identity.label);
    singularIdentity.nouns = singularIdentity.nouns().toSingular();
    if (singularStart.out('root') === singularIdentity.out('root')) {
      startTerm = "you";
      startPOS.second = true;
    }

    if (startTerm.slice(startTerm.length - 3, startTerm.length) === "you") {
      startPOS.second = true;
    }

    if (this.convertVerb(edge.rel['@id'])[0] === 'infinitive') {
      startTerm = this.gerundToInfinitive(startTerm);

    } else if (this.convertVerb(edge.rel['@id'])[0] === 'gerund') {
      startTerm = this.toGerund(startTerm);

    }

    var startTags = nlp(startTerm, myWords).terms().data();

    if (startTags[0].bestTag === "Verb") {
      startPOS.verb = true;
    } else {
      for (let i = 0; i < startTags.length; i++) {
        if (startTags[i].bestTag === "Plural") {
          startPOS.singular = false;
        }

        if (startTags[i].bestTag === "Verb") {
          startPOS.hasVerb = true;
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


    if (this.convertVerb(edge.rel['@id'])[1] === 'infinitive') {
      endTerm = this.gerundToInfinitive(endTerm);
    } else if (this.convertVerb(edge.rel['@id'])[1] === 'gerund') {
      endTerm = this.toGerund(endTerm);
    }

    var endTags = nlp(endTerm, myWords).terms().data();

    var endPOS = {singular: true};
    if ((endTags[0].bestTag === "Verb")) {
      endPOS.verb = true;
    } else {
      for (let i = 0; i < endTags.length; i++) {
        if (endTags[i].bestTag === "Plural") {
          endPOS.singular = false;
        }

        if (endTags[i].bestTag === "Verb") {
          endPOS.hasVerb = true;
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

  static convertVerb(relation) {
    switch (relation) {
      case '/r/HasSubevent':
        return ['infinitive', 'infinitive'];
      case '/r/Causes':
        return [false, 'infinitive'];
      case '/r/UsedFor':
        return [false, 'infinitive'];
      case '/r/HasPrerequisite':
        return ['infinitive', false];
      default:
        return [false, false];
    }
  }

  static grammar(relation, startTerm, endTerm) {
    // pretty much the one english conjugation
    let conj = (startTerm.second || !startTerm.singular);

    switch (relation) {
      case '/r/Desires':
        return ' want' + (conj ? " " : "s ") + (endTerm.verb ? "to " : "");
      case '/r/CapableOf':
        return ' could ';
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
        return ["Something that might happen when you ", " is " + (endTerm.verb ? "that you " : ""), "."];
      case '/r/HasPrerequisite':
        return ["If you want to ", ", then you should " + (endTerm.verb ? "" : "have "), "."];
      case '/r/UsedFor':
        return ["You remember that ", (startTerm.verb ? " is a way to " : (startTerm.singular ? " is used to " : " are used to ")) + (endTerm.verb ? "" : "have "), "."];
      case '/r/HasFirstSubevent':
        return ['The first thing you do when you ', ' is ', '.'];
      case '/r/SymbolOf':
        return (startTerm.singular ? " is a symbol of " : " are symbols of ");
      case '/r/DefinedAs':
        return ["You know that ", (startTerm.singular ? " is a " : " are "), "."];
      case '/r/Causes':
        return ' can cause ' + (endTerm.verb ? "you to " : "");
      case '/r/MotivatedBy':
      case '/r/MotivatedByGoal':
        return ["You want to ", " because " + (endTerm.hasVerb ? "" : ((endTerm.verb || endTerm.hasVerb) ? "you want to " : "you want ")), "."];
      case '/r/DistinctFrom':
        return (conj ? " are not " : " is not ");
      case '/r/MadeOf':
        return (conj ? " are made of " : " is made of ");
      case '/r/HasLastSubevent':
        return ["The last thing you do when " + (startTerm.second ? "" : "you "), " is ", "."];
      case '/r/NotCapableOf':
        return " can not ";
      case '/r/CausesDesire':
        return (startTerm.singular ? " makes" : " make") + " you want " + (endTerm.verb ? "to " : "");
      case '/r/Entails':
        return ['... to ', '... to ', '...'];
      case '/r/NotHasProperty':
        return ' is not ';
      default:
        return " " + relation + " ";
    }
  }

  // converts the first verb in gerund form to a verb in infinitive form.
  // does not affect non-verb words.
  static gerundToInfinitive(text) {

    var s = nlp(text);

    if (s.terms().data()[0].tags.includes("Gerund")) {
      let i = s.verbs().list[0].toInfinitive();
      s.list[0].terms[0] = i.terms[0];
    }

    // s.verbs = v.toInfinitive();
    return s.out('text');
  }

  static toGerund(text) {

    var s = nlp(text);

    if (s.terms().data()[0].tags.includes("Verb")) {
      let g = s.verbs().list[0].conjugate().Gerund;
      s.list[0].terms[0] = nlp(g).list[0].terms[0];
    }

    // s.verbs = v.toInfinitive();
    return s.out('text');
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
    for (var i = 0; i < cardItem.text.length; i++) {
      newText += cardItem.text[i].value;
    }

    cardItem.text = [{type: "plain", value: newText}];
    return cardItem;
  }

}

export default EdgeFormatter;