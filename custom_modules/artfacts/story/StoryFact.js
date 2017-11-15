'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./../../mydebugger');
//const StoryAct = require('./StoryAct');
//const BotUser = require('./BotUser');
const Node = require('./../node');
const KnowledgeChunk = require('./../knowledgechunk');
const StoryAct = require('./StoryAct');

class StoryFact extends KnowledgeChunk {

	init() {
		super.init();
		let self = this;
		self.storyActs = [];
		self.storyActIsLoaded = false;
	}
}

module.exports = StoryFact;