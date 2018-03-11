import React from "react";
import CardText from "../CardText";
import { shallow, mount } from "enzyme";
import * as EdgeFormatter from "../include/EdgeFormatter.js";
import fs from "fs";
import { edgesToTest } from "./edgesToTest.js";
import { commonTerms } from "../include/commonTerms.js";

describe("EdgeFormatter", () => {
  // test the key functionality of EdgeFormatter, formatting edges
  edgesToTest.map(test => {
    it("formats " + test.edge, () => {
      let edge = JSON.parse(
        fs.readFileSync("src/tests/conceptnet/" + test.edge.replace(/\//g, "-"))
      );
      let formatted = EdgeFormatter.makePlain(
        EdgeFormatter.formatEdge(
          edge,
          "",
          () => {},
          { "@id": "/c/en/person", label: "a person" },
          false
        )
      );
      expect(formatted.text[0].value).toBe(test.expected);
    });
  });

  // test goal formatting
  it("can format a goal with a verb", () => {
    const goal = commonTerms[0];
    const formattedGoal = EdgeFormatter.formatGoal(
      goal.label,
      "present",
      false
    );
    expect(formattedGoal[0].value).toBe("You want to see art.");
  });

  it("can format a goal with a noun", () => {
    const goal = commonTerms[27];
    const formattedGoal = EdgeFormatter.formatGoal(
      goal.label,
      "present",
      false
    );
    expect(formattedGoal[0].value).toBe("You want to find a shark.");
  });

  it("can format a goal with a plural noun", () => {
    const goal = commonTerms[30];
    const formattedGoal = EdgeFormatter.formatGoal(
      goal.label,
      "present",
      false
    );
    expect(formattedGoal[0].value).toBe("You want to find computers.");
  });

  // test helper functions
  it("can format a goal with a verb in the past tense", () => {
    const goal = commonTerms[0];
    const formattedGoal = EdgeFormatter.formatGoal(goal.label, "past", false);
    expect(formattedGoal[0].value).toBe("You failed to see art.");
  });

  it("can format a goal with a noun in the past tense", () => {
    const goal = commonTerms[27];
    const formattedGoal = EdgeFormatter.formatGoal(goal.label, "past", false);
    expect(formattedGoal[0].value).toBe("You weren't able to find a shark.");
  });

  it("converts a CardText text object to sentence case", () => {
    expect(EdgeFormatter.sentenceCase([{value:""}, {value:"test"}])[1].value).toBe("Test");
    expect(EdgeFormatter.sentenceCase([{value:"test"}, {value:"test"}])[0].value).toBe("Test");
    expect(EdgeFormatter.sentenceCase([{value:"test"}, {value:"test"}])[1].value).toBe("test");
  });

  it("strips determiners and pronouns", () => {
    expect(EdgeFormatter.stripDeterminersAndPronouns("an apple")).toBe("apple");
    expect(EdgeFormatter.stripDeterminersAndPronouns("he ran")).toBe("ran");
  });

  it("normalizes and converts to singular", () => {
    expect(EdgeFormatter.normalizedSingular("persons")).toBe("person");
  });

  it("conjugates terms", () => {
    expect(EdgeFormatter.conjugateTerm("climbing a mountain", {singular: true}, "infinitive").term).toBe("climb a mountain");
    expect(EdgeFormatter.conjugateTerm("climbing a mountain", {singular: true}, "infinitive").pos.verb).toBe(true);
  });

  it("converts pronouns to second person", () => {
    expect(EdgeFormatter.pronounsToSecondPerson("The house is for him.")).toBe("The house is for you.");
    expect(EdgeFormatter.pronounsToSecondPerson("her apple")).toBe("your apple");
    expect(EdgeFormatter.pronounsToSecondPerson("they might")).toBe("you might");
  });

  it("conjugates verbs to gerund", () => {
    expect(EdgeFormatter.toGerund("save")).toBe("saving");
    expect(EdgeFormatter.toGerund("ran")).toBe("running");
    expect(EdgeFormatter.toGerund("improve")).toBe("improving");
    expect(EdgeFormatter.toGerund("fight")).toBe("fighting");
    expect(EdgeFormatter.toGerund("join")).toBe("joining");
  });

  it("conjugates gerunds to infinitive", () => {
    expect(EdgeFormatter.gerundToInfinitive("saving")).toBe("save");
    expect(EdgeFormatter.gerundToInfinitive("ran")).toBe("ran");
    expect(EdgeFormatter.gerundToInfinitive("running")).toBe("run");
    expect(EdgeFormatter.gerundToInfinitive("improving")).toBe("improve");
    expect(EdgeFormatter.gerundToInfinitive("fought")).toBe("fought");
    expect(EdgeFormatter.gerundToInfinitive("fighting")).toBe("fight");
    expect(EdgeFormatter.gerundToInfinitive("joining")).toBe("join");
  });
});
