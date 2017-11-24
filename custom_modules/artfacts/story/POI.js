'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./../../mydebugger');
const KnowledgeChunk = require('./../knowledgechunk');

class POI extends KnowledgeChunk {

	init() {
		super.init();
		let self = this;
		self.factIsLoaded = false;
	}
}

module.exports = POI;