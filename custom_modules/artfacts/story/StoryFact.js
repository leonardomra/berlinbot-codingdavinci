'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./../../mydebugger');
const StoryAct = require('./StoryAct');
const BotUser = require('./BotUser');
const Node = require('./../node');
const KnowledgeChunk = require('./../knowledgechunk');

class StoryFact extends KnowledgeChunk {

	init() {
		super.init();
		let self = this;
		self.factIsLoaded = false;
		self.storyActs = [];
		self.storyActsAreLoaded = false;
		self.botUsers = [];
		self.botUsersAreLoaded = false;
	}
}

module.exports = StoryFact;