const wget = require('node-wget');
const fs = require('fs');
const {edgesToTest} = require('./edgesToTest.js');

edgesToTest.map((test) => {
	if (!fs.existsSync('src/tests/conceptnet/' + test.edge.replace(/\//g, "-"))) {
		wget({url: 'http://api.conceptnet.io' + test.edge, dest: 'src/tests/conceptnet/' + test.edge.replace(/\//g, "-")});
	}
});