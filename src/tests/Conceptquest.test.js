import React from "react";
import ReactDOM from "react-dom";
import Conceptquest from "../Conceptquest";
import Card from "../Card";
import CardText from "../CardText";
import { shallow, mount } from "enzyme";
import fs from "fs";
import EdgeFormatter from "../EdgeFormatter.js";
import { edgesToTest } from "./edgesToTest.js";

// TODO:
// * Add tests for goal formatter
// * Add tests for clicking on links?
// * Add tests for progress
// * Add tests for final/score

describe("<Conceptquest />", () => {
	it("renders without crashing", () => {
		mount(<Conceptquest />);
	});

	it("renders one <Card /> component", () => {
		const wrapper = shallow(<Conceptquest />);
		expect(wrapper.find(Card).length).toBe(1);
	});
});

describe("<CardText />", () => {
	it("can render a link", () => {
		const wrapper = shallow(
			<CardText
				text={[
					{ type: "text", value: "not a link" },
					{ type: "link", value: "a link", callback: () => {} }
				]}
				keyValue="test"
				lineClass=""
			/>
		);
		expect(wrapper.find("a").length).toBe(1);
	});
});

describe("EdgeFormatter", () => {
	edgesToTest.map(test => {
		it("formats " + test.edge, () => {
			let edge = JSON.parse(
				fs.readFileSync(
					"src/tests/conceptnet/" + test.edge.replace(/\//g, "-")
				)
			);
			let formatted = EdgeFormatter.makePlain(
				EdgeFormatter.formatEdge(
					edge,
					0,
					"",
					() => {},
					{ label: "a person" },
					false
				)
			);
			expect(formatted.text[0].value).toBe(test.expected);
		});
	});
});
