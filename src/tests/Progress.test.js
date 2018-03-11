import React from "react";
import Progress from "../Progress";
import { shallow, mount } from "enzyme";
import * as EdgeFormatter from "../include/EdgeFormatter.js";
import { commonTerms } from "../include/commonTerms.js";

describe("<Progress />", () => {
  it("renders without crashing", () => {
    const wrapper = shallow(
      <Progress
        history={[]}
        score={0}
        goalText={EdgeFormatter.formatGoal(
          commonTerms[0].label,
          "present",
          false
        )}
        reset={() => {}}
      />
    );
  });

  it("sets width appropriately", () => {
    const wrapper = shallow(
      <Progress
        history={[
          {
            style: "theme",
            edge: "begin",
            text: [
              {
                type: "plain",
                value: "Along the way, try to lead a fulfilling life."
              }
            ],
            key: { "@id": "/c/en/person" }
          },
          {
            style: "theme",
            key: { "@id": "/c/en/person" },
            text: [
              {
                type: "plain",
                value: "Do you want to have money to buy chocolate?"
              }
            ],
            edge:
              "/a/[/r/Desires/,/c/en/person/,/c/en/have_money_to_buy_chocolate/]"
          }
        ]}
        score={0}
        goalText={EdgeFormatter.formatGoal(
          commonTerms[0].label,
          "present",
          false
        )}
        reset={() => {}}
      />
    );

    expect(wrapper.find(".Progress").prop("style").width).toBe(
      "9.523809523809524%"
    );
  });

  it("renders the final screen with a single button", () => {
    const wrapper = mount(
      <Progress
        history={[]}
        score={0}
        goalText={EdgeFormatter.formatGoal(
          commonTerms[0].label,
          "future",
          false
        )}
        reset={() => {}}
        final={true}
      />
    );

    expect(wrapper.find("button").length).toBe(1);
  });
});
