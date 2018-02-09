import React from 'react';
import ReactDOM from 'react-dom';
import Conceptquest from './Conceptquest';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Conceptquest />, div);
  ReactDOM.unmountComponentAtNode(div);
});