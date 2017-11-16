'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./../../mydebugger');
const Part = require('./../../part');
const Node = require('./../node');
const KnowledgeChunk = require('./../knowledgechunk');
const StoryAct = require('./StoryAct');
const StoryFact = require('./StoryFact');
const Actor = require('./Actor');
const BotUser = require('./BotUser');

class Bot {

	wakeup() {
		bug.artmsg('Hit from StoryFact!');
		let self = this;
		self.brain = new Part();
		self.brain.telegram = self.telegram;
		self.node = new Node();
		self.node.init();
		self.projectId = '59faeeb23dcf640fb556b5e5';
		self.library = {
			'StoryFact': {class: StoryFact, objs: []},
			'StoryAct': {class: StoryAct, objs: []},
			'BotUser': {class: BotUser, objs: []},
			//'Actor': Actor,
		};
		self.moveToStage00();
	}

	moveToStage00() {
		let self = this;
		function handleIds(ids, className) {
			ids.forEach( function(id) {
				var o = new self.library[className].class();
				o.init();
				o.instantiation = className;
				self.library[className].objs.push(o);
				o.loadSubjectWithID(id, function(subject) {
					subject.factIsLoaded = true;
					if (self.watchLibraryLoad(self.library)) {
						console.log('finish loading!');
						self.distributeFacts();
					}
				});
			});
		}
		function calmLoading(key) {
			console.log('will process ' + key + '...');
			self.node.getInstanceForProjectId(key, self.projectId, handleIds);
			multiplier++;
		}
		let multiplier = 0;
		for (let key in self.library) {
			calmLoading(key);
		}
	}

	moveToStage01() {
		let self = this;
		self.brain.init();
		self.brain.bot = self;
	}

	distributeFacts() {
		let self = this;
		function handleFact(fact) {
			for (let key in self.library) {
				let _key = key.charAt(0).toLowerCase()+ key.slice(1);
				_key += 's';
				if (fact.hasOwnProperty(_key)) {
					self.compareLinksAndAddObjects(fact, self.library[key].objs, _key);
				}
			}
		}
		for (let key in self.library) {
			self.library[key].objs.forEach(handleFact);
		}
		//console.log(self.library.StoryFact.objs[0]);
		self.moveToStage01();
	}


	compareLinksAndAddObjects(subject, objects, _key) {
		objects.forEach( function(object) {
			subject.knowledgeEntities.forEach( function(entity) {
				entity.quantifiers.forEach( function(quantifier) {
					if (quantifier.type === 'class') {
						if (object.chunkId === quantifier.value) {
							subject[_key].push(object);
						}
					}
				});
			});
		});
	}

	watchLibraryLoad(lib) {
		for (let key in lib) {
			if (lib[key].objs.length !== 0) {
				for (var i = lib[key].objs.length - 1; i >= 0; i--) {
					if (!lib[key].objs[i].factIsLoaded) {
						return false;
					}
				}
			}
		}
		return true;
	}




	//*******************************************/
	//
	// DO NOT ENTER
	//
	//*******************************************/

	//*******************************************/
	//
	// StoryFact
	//
	//*******************************************/



/*

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
	*/

}

module.exports = Bot;