import React from "react";
import CardText from "../CardText";
import { shallow, mount } from "enzyme";

describe("<CardText />", () => {
  it("can render a link", () => {
    const wrapper = shallow(
      <CardText
        item={{
          style: "theme",
          text: [
            { type: "text", value: "not a link" },
            { type: "link", value: "a link", callback: () => {} }
          ]
        }}
      />
    );
    expect(wrapper.find("button").length).toBe(1);
  });
});
