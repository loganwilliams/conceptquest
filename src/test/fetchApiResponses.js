const wget = require('node-wget');
const fs = require('fs');
const {edgesToTest} = require('./edgesToTest.js');

edgesToTest.map((test) => {
	if (!fs.existsSync('src/test/conceptnet/' + test.edge.replace(/\//g, "-"))) {
		wget({url: 'http://api.conceptnet.io' + test.edge, dest: 'src/test/conceptnet/' + test.edge.replace(/\//g, "-")});
	}
});