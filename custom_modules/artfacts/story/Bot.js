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
			'Actor': {class: Actor, objs: []},
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
		self.loadSubjectQuantifiersForFacts();
	}

	moveToStage02() {
		let self = this;
		self.brain.init();
		self.brain.bot = self;
	}


	loadSubjectQuantifiersForFacts() {
		let self = this;
		function handleTimeQuantifer(fact) {
			fact.time = undefined;
			fact.timeIsLoaded = false;
			fact.getSubjectQuantifier(fact.chunkId, 'time', function(response) {
				fact.timeIsLoaded = true;
				if (response !== undefined) {
					fact.time = response;
					fact.encodeTime();
				}
				if (self.watchTimeQuantifierLoad(self.library)) {
					console.log('All times loaded!');
					self.moveToStage02();
				}
			});
		}
		for (let key in self.library) {
			self.library[key].objs.forEach(handleTimeQuantifer);
		}
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

	//*******************************************/
	//
	// Watchers
	//
	//*******************************************/

	watchTimeQuantifierLoad(lib) {
		for (let key in lib) {
			if (lib[key].objs.length !== 0) {
				for (var i = lib[key].objs.length - 1; i >= 0; i--) {
					if (!lib[key].objs[i].timeIsLoaded) {
						return false;
					}
				}
			}
		}
		return true;
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
	// Manage Stories
	//
	//*******************************************/

	sortStoryActs() {
		let self = this;
		self.library.StoryAct.objs = self.library.StoryAct.objs.sort(self.compareStoryActs);
	}

	compareStoryActs(a, b) {
		if (a.encodedTime < b.encodedTime)
			return -1;
		if (a.encodedTime > b.encodedTime)
			return 1;
		return 0;
	}


	startStory() {
		let self = this;
		console.log('will start story');
		self.sortStoryActs();
		console.log(self.library.StoryAct.objs);
	}
}

module.exports = Bot;