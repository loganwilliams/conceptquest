import React from "react";
import CardText from "../CardText";
import { shallow, mount } from "enzyme";
import * as EdgeFormatter from "../include/EdgeFormatter.js";
import fs from "fs";
import { edgesToTest } from "./edgesToTest.js";
import { commonTerms } from "../include/commonTerms.js";

describe("EdgeFormatter", () => {
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
});
