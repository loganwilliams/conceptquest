import React from 'react';
import ReactDOM from 'react-dom';
import Conceptquest from './Conceptquest';
import Card from './Card';
import CardText from './CardText';
import {shallow} from 'enzyme';

describe('<Conceptquest />', () => {
	it('renders without crashing', () => {
	  const div = document.createElement('div');
	  ReactDOM.render(<Conceptquest />, div);
	  ReactDOM.unmountComponentAtNode(div);
	});

	it('renders one <Card /> component', () => {
		const wrapper = shallow(<Conceptquest />);
    	expect(wrapper.find(Card).length).toBe(1);
	});
});

describe('<CardText />', () => {
	it('can render a link', () => {
		const wrapper = shallow(<CardText text={[{type: "text", value: "not a link"}, {type: "link", value: "a link", callback: ()=>{}}]} keyValue="test" lineClass="" />);
		expect(wrapper.find('a').length).toBe(1);
	});
});