'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./../../mydebugger');
const Node = require('./../node');
const StoryAct = require('./StoryAct');
const StoryFact = require('./StoryFact');
const MainActor = require('./Actor');
const BotUser = require('./BotUser');
const MainNarrative = require('./MainNarrative');
const ActorSpeech = require('./ActorSpeech');
const POI = require('./POI');
const Medium = require('./Medium');
const Action = require('./Action');

class StoryLoader {

	init(projectId) {
		bug.artmsg('******* ATTENTION: Disconnected entities inside Knowledge Chunks cause the bot not to initialize ******* ');
		let self = this;
		self.isLoaded = false;
		self.projectId = projectId;
		self.qts = ['time', 'image', 'extra', 'video', 'audio', 'gps', 'url'];
		self.LoadStoryComponents(null);
	}

	LoadStoryComponents(scope) {
		let self = this;
		let node = new Node();
		node.init();
		self.library = {
			'StoryFact': {class: StoryFact, objs: [], promiseCounter: [], finishedCounter: []},
			'StoryAct': {class: StoryAct, objs: [], promiseCounter: [], finishedCounter: []},
			'BotUser': {class: BotUser, objs: [], promiseCounter: [], finishedCounter: []},
			'MainActor': {class: MainActor, objs: [], promiseCounter: [], finishedCounter: []},
			'MainNarrative': {class: MainNarrative, objs: [], promiseCounter: [], finishedCounter: []},
			'ActorSpeech': {class: ActorSpeech, objs: [], promiseCounter: [], finishedCounter: []},
			'POI': {class: POI, objs: [], promiseCounter: [], finishedCounter: []},
			'Medium': {class: Medium, objs: [], promiseCounter: [], finishedCounter: []},
			'Action': {class: Action, objs: [], promiseCounter: [], finishedCounter: []},
		};

		function handleIds(ids, className) {
			bug.artmsg(self.projectId + ': for ' + className + ' there are ' + ids.length + ' nodes.');
			ids.forEach( function(id) {
				var o = new self.library[className].class();
				o.init();
				o.instantiation = className;
				self.library[className].objs.push(o);
				self.library[className].promiseCounter.push(id);
				o.loadSubjectWithID(id, function(subject) {
					bug.artmsg(self.projectId + ': ' + subject.label +' (' + subject.instantiation + ') was loaded!');
					self.library[subject.instantiation].finishedCounter.push(subject.chunkId);
					subject.factIsLoaded = true;
					if (self.watchLibraryLoad(self.library)) {
						bug.artmsg('------------------> Ok... Artfacts\' project is half loaded!'); // if I don't take up, check your knowledge chunks. There might be too many disconnected entities...
						self.distributeFacts(scope);
					}
				});
			});
		}
		function calmLoading(key) {
			bug.artmsg('I\'ll process ' + key + '...');
			node.getInstanceForProjectId(key, self.projectId, handleIds);
			multiplier++;
		}
		let multiplier = 0;
		for (let key in self.library) {
			calmLoading(key);
		}
		/*
		setTimeout(function() {
			function handleDiag(obj) {
				if (!obj.factIsLoaded) {
					bug.error('	' + this + ' -> problem: ' + obj.label + ' is loaded: ' + obj.factIsLoaded + ', ref: ' + obj.chunkId);
					bug.error('	Remove empty entities.');
				}
			}
			for (let key in self.library) {
				self.library[key].objs.forEach(handleDiag.bind(key));
			}
		}, 10000);
		*/
	}

	distributeFacts(scope) {
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
		self.loadSubjectQuantifiersForFacts(scope);
	}

	loadSubjectQuantifiersForFacts(scope) {
		let self = this;
		function handleTimeQuantifer(fact) {
			fact.time = undefined;
			fact.timeIsLoaded = false;
			self.qts.forEach( function(qt, index) {
				fact.getSubjectQuantifier(fact.chunkId, qt, function(response) {
					fact[qt + 'IsLoaded'] = true;
					fact[qt] = response;
					if (response !== undefined) {
						if (qt === 'time') {
							fact.encodeTime();
						}
						fact[qt] = response;
						fact.encodeTime();
					}
					if (self.watchQuantifierLoad(self.library, self.qts)) {
						//bug.artmsg('------------------> Artfacts\' project ' + self.projectId + ' is completely loaded!!!');
						self.isLoaded = true;
						self.finishedLoading('------------------> Artfacts\' project ' + self.projectId + ' is completely loaded!!!');

						//self.initializeBotBrain(scope);
					}
				});
			});
		}
		for (let key in self.library) {
			self.library[key].objs.forEach(handleTimeQuantifer);
		}
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

	watchQuantifierLoad(lib, qts) {
		for (let key in lib) {
			if (lib[key].objs.length !== 0) {
				for (var i = lib[key].objs.length - 1; i >= 0; i--) {
					for (var j = qts.length - 1; j >= 0; j--) {
						if (!lib[key].objs[i][qts[j] + 'IsLoaded']) {
							return false;
						}
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
						//console.log(lib[key].objs[i].label + ' not loaded');
						if (lib[key].objs[i].label === undefined) {
							//bug.error('Unable to load. Check Artfacts project.');
						}

						return false;
					}
				}
			}
		}
		return true;
	}
}

module.exports = StoryLoader;