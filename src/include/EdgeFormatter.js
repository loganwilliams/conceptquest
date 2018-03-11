import nlp from "compromise";
import * as consts from "./consts.js";

nlp.plugin(consts.conjugations);

// Every sentence fits into the pattern "a {term} b {term} c".
// The formatEdge function formats the start and end term for an edge, uses
// compromiseNLP to generate POS tags, and uses those tags and the edge
// relation to obtain [a, b, c] from grammar(). Then, it assembles and
// capitalizes the final sentence. 
export const formatEdge = (
  edge,
  previousTermId,
  callback,
  identity,
  useAlternatives = true
) => {
  const term = edge.end["@id"] === previousTermId ? edge.start : edge.end;
  const alternative = useAlternatives ? Math.floor(Math.random() * 2) : 0;

  // for this relation, how do we need to conjugate verbs?
  let necessaryConjugations = convertVerb(edge.rel["@id"]);

  // if the start term matches identity, change the start term to "you"
  const startTerm =
    normalizedSingular(identity.label) === normalizedSingular(edge.start.label)
      ? "you"
      : edge.start.label;

  const processedStartTerms = conjugateTerm(
    startTerm,
    // If the startTerm ends in "you", then startTerm is second person.
    { singular: true, second: startTerm.slice(startTerm.length - 3) === "you" },
    necessaryConjugations[0]
  );

  // if the startTerm is second person, prnouns in the end term should be too.
  const endTerm = processedStartTerms.pos.second
    ? pronounsToSecondPerson(edge.end.label)
    : edge.end.label;

  // conjugate the end term.
  const processedEndTerms = conjugateTerm(
    endTerm,
    { singular: true },
    necessaryConjugations[1]
  );

  // get the (a,b,c) values from the grammar table. if they are stored in a
  // compressed form, expand them.
  const sentence = grammar(
    edge.rel["@id"],
    processedStartTerms.pos,
    processedEndTerms.pos,
    alternative
  );

  const [a, b, c] =
    typeof sentence === "string" ? ["", sentence, "."] : sentence;

  // assemble the final text output.
  let text = [];
  text[0] = { type: "plain", value: a };
  text[1] = {
    type: "plain",
    value: processedStartTerms.term,
    pos: processedStartTerms.pos
  };
  text[2] = { type: "plain", value: b };
  text[3] = {
    type: "plain",
    value: processedEndTerms.term,
    pos: processedEndTerms.pos
  };
  text[4] = { type: "plain", value: c };

  if (edge.end["@id"] === previousTermId) {
    text[1] = { ...text[1], type: "link", callback: () => callback(term) };
  } else {
    text[3] = { ...text[3], type: "link", callback: () => callback(term) };
  }

  return {
    style: "indent",
    key: term,
    text: sentenceCase(text),
    edge: edge["@id"]
  };
};

// conceptNetGrammar returns the surfaceText of an edge in the [a,b,c] format
// expected by formatEdge
export const conceptNetGrammar = edge => {
  let surfaceText = edge.surfaceText.split("[[");
  let a = surfaceText[0];
  let b = surfaceText[1].split("]]")[1];
  let c = surfaceText[2].split("]]")[1];
  return [a, b, c];
};

// convertVerb takes a relation and returns whether the [startTerm, endTerm]
// need to be conjugated, and if so, to what conjugation.
export const convertVerb = (relation) => {
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
};

// Each grammar generates a set of (a, b, c) values using the relation
// information from that edge, and the parts of speech associated with the
// start and end term.
export const grammar = (relation, startTerm, endTerm, alternative) => {
  // pretty much the one english conjugation
  const conj = startTerm.second || !startTerm.singular;
  const sentence = endTerm.verb || endTerm.hasVerb;

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
        (conj ? " don't" : " doesn't") + " want " + (endTerm.verb ? "to " : "")
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
              (endTerm.hasVerb ? "" : sentence ? "you have to " : "you have "),
            "."
          ];
        default:
          return [
            "You want to ",
            " because " +
              (endTerm.hasVerb ? "" : sentence ? "you want to " : "you want "),
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
};

// generateIntroText creates the game introduction, based on a particular goal
// passed as a parameter. It creates a link to a callback.
export const generateIntroText = (goal, transitionCallback) => {
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
      text: formatGoal(goal.label, "present")
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
};

// formatGoal takes a goal label and a tense ("past" or "future"), and returns
// a CardText style sentence with a formatted sentence.
export const formatGoal = (label, tense, useAlternatives = true) => {
  label = stripDeterminersAndPronouns(label);

  const alternative = useAlternatives ? Math.floor(Math.random() * 4) : 0;

  const goal = nlp(label, consts.myWords);
  const nTerms = goal.terms().data().length;

  for (let i = 0; i < nTerms; i++) {
    let term = goal.terms().data()[i];

    if (term.bestTag === "Verb") {
      if (term.tags.includes("Gerund")) {
        label = gerundToInfinitive(label);
      }

      return formatGoalVerb(label, tense, alternative);
    }

    if (term.tags.includes("Noun")) {
      let article = "";

      if (term.tags.includes("Singular")) {
        article = "a ";
      }

      return formatGoalNoun(label, tense, alternative, article);
    }
  }

  return label;
};

// Called by formatGoal to handle the case where the goal is a verb.
export const formatGoalVerb = (label, tense, alternative) => {
  switch (tense) {
    case "past":
      if (alternative) {
        return [
          {
            type: "plain",
            value: "You managed to " + label + " succesfully!"
          }
        ];
      } else {
        return [{ type: "plain", value: "You failed to " + label + "." }];
      }
    default:
      switch (alternative) {
        case 0:
          return [{ type: "plain", value: "You want to " + label + "." }];
        case 1:
          return [{ type: "plain", value: "You need to " + label + "." }];
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
};

// Called by formatGoal to handle the case where the goal is a noun.
export const formatGoalNoun = (label, tense, alternative, article) => {
  switch (tense) {
    case "past":
      if (alternative) {
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
    default:
      switch (alternative) {
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
};

// NLP helper functions:

// converts the first verb in gerund form to a verb in infinitive form.
// does not affect non-verb words.
export const gerundToInfinitive = text => {
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
};

export const toGerund = text => {
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
};

export const pronounsToSecondPerson = text => {
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
};

export const makePlain = cardItem => {
  let newText = "";
  for (let i = 0; i < cardItem.text.length; i++) {
    newText += cardItem.text[i].value;
  }

  return {
    ...cardItem,
    text: [{ type: "plain", value: newText }],
    style: "theme"
  };
};

export const stripDeterminersAndPronouns = label => {
  let phrase = nlp(label, consts.myWords);

  phrase.match("^(#Pronoun|#Determiner)").delete();

  return phrase
    .out("text")
    .trim()
    .toLowerCase();
};

export const conjugateTerm = (term, pos, conversion) => {
  if (conversion === "infinitive") {
    term = gerundToInfinitive(term);
  } else if (conversion === "gerund") {
    term = toGerund(term);
  }

  const tags = nlp(term, consts.myWords)
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
};

export const normalizedSingular = term => {
  let singular = nlp(term);
  singular.nouns = singular.nouns().toSingular();
  return singular.out("root");
};

export const sentenceCase = text => {
  text = text.map(t => ({ ...t, value: t.value.toLowerCase() }));

  // capitalize first letter
  if (text[0].value === "") {
    text[1].value = text[1].value[0].toUpperCase() + text[1].value.slice(1);
  } else {
    text[0].value = text[0].value[0].toUpperCase() + text[0].value.slice(1);
  }

  return text;
};
