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
const Actor = require('./Actor');

class Bot {

	init() {
		bug.artmsg('Hit from StoryFact!');
		let self = this;
		self.node = new Node();
		self.node.init();
		self.storyFactIsLoaded = false;
		self.storyActsAreLoaded = false;
		self.projectId = '59faeeb23dcf640fb556b5e5';

		self.stage = {};

		let classes = {
			'StoryFact': StoryFact,
			'Actor': Actor,
			'StoryAct': StoryAct
		};

		function handleIds(ids, className) {
			ids.forEach( function(id) {
				if (self.stage[className + 's'] === undefined) {
					self.stage[className + 's'] = [];
				}
				var o = new classes[className]();
				o.init();
				o.instantiation = className;
				o.loadSubjectWithID(id, function(subject) {
					bug.artmsg(subject.label + '(' + subject.instantiation + ') loaded!');
					//self.loadAggregatesForStoryFact(function(){});
				});
				self.stage[className + 's'].push(o);
			});
		}
		for (let key in classes) {
			self.node.getInstanceForProjectId(key, self.projectId, handleIds);
		}
	}




	loadStoryFact(id) {
		let self = this;
		self.story = new StoryFact();
		self.story.init();
		self.story.allAggregatesLoaded = false;
		self.story.loadSubjectWithID(id, function(result) {
			bug.artmsg('story loaded!');
			//self.loadAggregatesForStoryFact(function(){});
		});
	}

	loadActor(id) {
		let self = this;
		self.actor = new Actor();
		self.actor.init();
		self.actor.allAggregatesLoaded = false;
		self.actor.loadSubjectWithID(id, function(result) {
			bug.artmsg('actor loaded!');
			//self.loadAggregatesForActor(function(){});
		});
	}




	//*******************************************/
	//
	// StoryFact
	//
	//*******************************************/





	loadAggregatesForStoryFact(callback) {
		let self = this;
		if (self.story.aggregates.length === 0) {
			self.story.knowledgeEntities.forEach( function(entity) {
				if (self.story.knowledgeEntities.length !== 0) {
					if (entity.quantifiers !== 0) {
						entity.quantifiers.forEach( function(quantifier) {
							if (quantifier.type === 'class') {
								var aggregate = new KnowledgeChunk();
								aggregate.init();
								aggregate.loadSubjectWithID(quantifier.value, function(subject) {
									if(self.watchAggregatesForStoryFactLoad() === true && self.story.allAggregatesLoaded === false) {
										bug.artmsg('All aggregates for story loaded!');
										self.storyFactIsLoaded = true;
										self.story.allAggregatesLoaded = true;
										self.loadSubjectQuantifiersForStoryFact();
									}
								});
								self.story.aggregates.push(aggregate);
							}
						});

					}
				}
			});
		}
	}

	watchAggregatesForStoryFactLoad() {
		let self = this;
		for (var i = 0; i < self.story.aggregates.length; i++) {
			if (self.story.aggregates[i].isCompleteSubjectLoaded === false || self.story.aggregates[i].isCompleteSubjectLoaded === undefined) {
				return false;
			}
		}
		return true;
	}

	watchSubjectQuantifierLoadForStoryFact() {
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

	loadSubjectQuantifiersForStoryFact() {
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
				if (self.watchSubjectQuantifierLoadForStoryFact()) self.loadStoryActs();
			});
			aggregate.subjectTimeIsLoaded = false;
			self.story.getSubjectQuantifier(aggregate.chunkId, 'time', function(response) {
				aggregate.subjectTimeIsLoaded = true;
				if (response !== undefined) {
					aggregate.time = response;
				}
				if (self.watchSubjectQuantifierLoadForStoryFact()) self.loadStoryActs();
			});
		});
	}

	//*******************************************/
	//
	// StoryAct
	//
	//*******************************************/

	loadStoryActs() {
		let self = this;
		self.story.aggregates.forEach( function(aggregate) {
			if (aggregate.instantiation !== undefined) {
				var act = new StoryAct();
				act.init();
				act.loadActWithObject(aggregate);
				self.story.storyActs.push(act);
			}
		});
		self.story.storyActs = self.story.storyActs.sort(self.compareStoryActs);
		self.storyActsAreLoaded = true;
		self.getActorsIdsForProjectId();
	}

	compareStoryActs(a, b) {
		if (a.encodedTime < b.encodedTime)
			return -1;
		if (a.encodedTime > b.encodedTime)
			return 1;
		return 0;
	}


	//*******************************************/
	//
	// Actor
	//
	//*******************************************/

	getActorsIdsForProjectId() {
		let self = this;
		self.node.getActorIdsForProjectId(self.projectId, function (result) {
			self.loadActors(result);
		});
	}

	loadActors(ids) {
		let self = this;
		ids.forEach( function(id) {
			self.actor = new Actor();
			self.actor.init();
			self.actor.allAggregatesLoaded = false;
			self.actor.loadSubjectWithID(id, function(result) {
				self.loadAggregatesForActor(function(){});
			});
		});
	}

	loadAggregatesForActor(callback) {
		let self = this;
		if (self.actor.aggregates.length === 0) {
			self.actor.knowledgeEntities.forEach( function(entity) {
				if (self.actor.knowledgeEntities.length !== 0) {
					if (entity.quantifiers !== 0) {
						entity.quantifiers.forEach( function(quantifier) {
							if (quantifier.type === 'class') {
								var aggregate = new KnowledgeChunk();
								aggregate.init();
								aggregate.loadSubjectWithID(quantifier.value, function(subject) {
									if(self.watchAggregatesForActorLoad() === true && self.actor.allAggregatesLoaded === false) {
										bug.artmsg('All aggregates for actor loaded!');
										//self.storyFactIsLoaded = true;
										self.actor.allAggregatesLoaded = true;
										self.loadSubjectQuantifiersForActor();
									}
								});
								self.actor.aggregates.push(aggregate);
							}
						});

					}
				}
			});
		}
	}

	watchAggregatesForActorLoad() {
		let self = this;
		for (var i = 0; i < self.actor.aggregates.length; i++) {
			if (self.actor.aggregates[i].isCompleteSubjectLoaded === false || self.actor.aggregates[i].isCompleteSubjectLoaded === undefined) {
				return false;
			}
		}
		return true;
	}

	watchSubjectQuantifierLoadForActor() {
		let self = this;
		for (var i = 0; i < self.story.aggregates.length; i++) {
			if (self.actor.aggregates[i].subjectInstantiationIsLoaded === false ||
				self.actor.aggregates[i].subjectInstantiationIsLoaded === undefined ||
				self.actor.aggregates[i].subjectTimeIsLoaded === false ||
				self.actor.aggregates[i].subjectTimeIsLoaded === undefined) {
				return false;
			}
		}
		return true;
	}

	loadSubjectQuantifiersForActor() {
		let self = this;
		self.actor.aggregates.forEach( function(aggregate) {
			aggregate.instantiation = undefined;
			aggregate.time = undefined;
			aggregate.subjectInstantiationIsLoaded = false;
			self.actor.getSubjectQuantifier(aggregate.chunkId, 'instantiation', function(response) {
				aggregate.subjectInstantiationIsLoaded = true;
				if (response !== undefined) {
					aggregate.instantiation = response;
				}
				if (self.watchSubjectQuantifierLoadForActor()) self.loadStoryActs();
			});
			aggregate.subjectTimeIsLoaded = false;
			self.story.getSubjectQuantifier(aggregate.chunkId, 'time', function(response) {
				aggregate.subjectTimeIsLoaded = true;
				if (response !== undefined) {
					aggregate.time = response;
				}
				if (self.watchSubjectQuantifierLoadForActor()) self.loadStoryActs();
			});
		});
	}

}

module.exports = Bot;