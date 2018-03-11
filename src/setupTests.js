import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

configure({ adapter: new Adapter() });

// enable jest fetch mocks
global.fetch = require('jest-fetch-mock');