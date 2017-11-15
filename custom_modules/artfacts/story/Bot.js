'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./../../mydebugger');
//const StoryAct = require('./StoryAct');
//const BotUser = require('./BotUser');
const Node = require('./../node');
const KnowledgeChunk = require('./../knowledgechunk');
const StoryAct = require('./StoryAct');
const StoryFact = require('./StoryFact');

class Bot {

	init() {
		bug.artmsg('Hit from StoryFact!');
		let self = this;
		self.node = new Node();
		self.node.init();
		self.node.getStoryFactIdForProjectId('59faeeb23dcf640fb556b5e5', function (result) {
			self.loadStoryFact(result);
		});
	}

	loadStoryFact(id) {
		console.log('loadStoryFact');
		let self = this;
		self.story = new StoryFact();
		self.story.init();
		self.story.allAggregatesLoaded = false;
		self.story.loadSubjectWithID(id, function(result) {
			self.loadAggregates(function(){});
		});
	}

	loadAggregates(callback) {
		console.log('loadAggregates');
		let self = this;
		if (self.story.aggregates.length === 0) {
			self.story.knowledgeEntities.forEach( function(entity) {
				if (self.story.knowledgeEntities.length !== 0) {
					if (entity.quantifiers !== 0) {
						entity.quantifiers.forEach( function(quantifier) {
							if (quantifier.type === 'class') {
								var aggregate = new KnowledgeChunk();
								aggregate.init();
								console.log(quantifier.value)
								aggregate.loadSubjectWithID(quantifier.value, function(subject) {
									
									console.log(subject.chunkId + ', ' + subject.label + ': ' + subject.isCompleteSubjectLoaded)

									//setTimeout(function() {
										if(self.watchAggregatesLoad() === true && self.story.allAggregatesLoaded === false) {
											bug.artmsg('All aggregates loaded!');
											self.story.allAggregatesLoaded = true;
											self.loadSubjectQuantifiers();
										}
									//}, 1000);
								});
								self.story.aggregates.push(aggregate);
							}
						});

					}
				}
			});
		}
	}

	watchAggregatesLoad() {
		let self = this;
		for (var i = 0; i < self.story.aggregates.length; i++) {
			if (self.story.aggregates[i].isCompleteSubjectLoaded === false || self.story.aggregates[i].isCompleteSubjectLoaded === undefined) {
				return false;
			}
		}
		return true;
	}


	watchSubjectQuantifierLoad() {
		let self = this;
		for (var i = 0; i < self.story.aggregates.length; i++) {
			if (self.story.aggregates[i].subjectInstantiationIsLoaded === false ||
				self.story.aggregates[i].subjectInstantiationIsLoaded === undefined ||
				self.story.aggregates[i].subjectTimeIsLoaded === false ||
				self.story.aggregates[i].subjectTimeIsLoaded === undefined) {
				return false;
			}
		}
		return true;
	}

	loadSubjectQuantifiers() {
		console.log('loadSubjectQuantifiers');
		let self = this;
		self.story.aggregates.forEach( function(aggregate) {
			aggregate.instantiation = undefined;
			aggregate.time = undefined;
			aggregate.subjectInstantiationIsLoaded = false;
			self.story.getSubjectQuantifier(aggregate.chunkId, 'instantiation', function(response) {
				aggregate.subjectInstantiationIsLoaded = true;
				if (response !== undefined) {
					aggregate.instantiation = response;
				}
				if (self.watchSubjectQuantifierLoad()) self.loadStoryActs();
			});
			aggregate.subjectTimeIsLoaded = false;
			self.story.getSubjectQuantifier(aggregate.chunkId, 'time', function(response) {
				aggregate.subjectTimeIsLoaded = true;
				if (response !== undefined) {
					aggregate.time = response;
				}
				if (self.watchSubjectQuantifierLoad()) self.loadStoryActs();
			});
		});
	}

	loadStoryActs() {
		console.log('loadStoryActs');
		let self = this;
		self.story.aggregates.forEach( function(aggregate) {
			console.log(aggregate.instantiation);
		});
				/*
				if (response !== undefined) {
					var act = new StoryAct();
					act.init();
					act.loadActWithObject(aggregate);
					self.story.storyActs.push(act);
					//bug.artmsg(self.story.storyActs);
				}
				*/
	}
}

module.exports = Bot;