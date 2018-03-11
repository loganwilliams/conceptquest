import React from "react";
import Conceptquest from "../Conceptquest";
import Card from "../Card";
import CardText from "../CardText";
import { shallow, mount } from "enzyme";
import fs from "fs";

// TODO:
// * Add tests for clicking on links?

describe("<Conceptquest />", () => {
  it("renders without crashing", () => {
    mount(<Conceptquest />);
  });

  it("renders one <Card /> component", () => {
    const wrapper = shallow(<Conceptquest />);
    expect(wrapper.find(Card).length).toBe(1);
  });

  it("starts the game", () => {
    // mock the ConceptNet API by always returning the results for "person"
    fetch.mockResponse(fs.readFileSync("src/tests/conceptnet/person"));
    const wrapper = mount(<Conceptquest />);
    const button = wrapper.find("button");
    button.simulate("click");
    expect(wrapper.state().fadingOut).toBe(true);
  });
});
