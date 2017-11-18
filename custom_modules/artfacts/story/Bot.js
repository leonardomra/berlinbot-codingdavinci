'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./../../mydebugger');
const Brain = require('./../../brain');
const Node = require('./../node');
const KnowledgeChunk = require('./../knowledgechunk');
const StoryAct = require('./StoryAct');
const StoryFact = require('./StoryFact');
const MainActor = require('./Actor');
const BotUser = require('./BotUser');
const MainNarrative = require('./MainNarrative');
const ActorSpeech = require('./ActorSpeech');
const POI = require('./POI');
const Medium = require('./Medium');
const Action = require('./Action');

class Bot {

	wakeup() {
		bug.artmsg('Hit from StoryFact!');
		let self = this;
		self.brain = new Brain();
		self.brain.telegram = self.telegram;
		self.node = new Node();
		self.node.init();
		self.projectId = '59faeeb23dcf640fb556b5e5';
		self.qts = ['time', 'image', 'extra', 'video', 'audio', 'gps', 'url'];
		self.library = {
			'StoryFact': {class: StoryFact, objs: []},
			'StoryAct': {class: StoryAct, objs: []},
			'BotUser': {class: BotUser, objs: []},
			'MainActor': {class: MainActor, objs: []},
			'MainNarrative': {class: MainNarrative, objs: []},
			'ActorSpeech': {class: ActorSpeech, objs: []},
			'POI': {class: POI, objs: []},
			'Medium': {class: Medium, objs: []},
			'Action': {class: Action, objs: []},
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
						bug.artmsg('Ok... I\'m half awake!');
						self.distributeFacts();
					}
				});
			});
		}
		function calmLoading(key) {
			bug.artmsg('I\'ll process ' + key + '...');
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

		/*
		function displayWhatIsThere(subject) {
			console.log(subject.label + ': '+ subject.content);
			console.log(subject)
		}
		for (let key in self.library) {
			if (key === 'StoryAct') {
				self.library[key].objs.forEach(displayWhatIsThere);
			}
		}
		*/
	}

	loadSubjectQuantifiersForFacts() {
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
						bug.artmsg('I\'m ready babe!!!');
						self.moveToStage02();
					}
				});
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

	sortFacts(list) {
		let self = this;
		list = list.sort(self.compareFacts);
		//return _list;
	}

	compareFacts(a, b) {
		if (a.encodedTime < b.encodedTime)
			return -1;
		if (a.encodedTime > b.encodedTime)
			return 1;
		return 0;
	}

	checkIfObjsHaveTime(objs) {
		for (var i = objs.length - 1; i >= 0; i--) {
			if (objs[i].time === undefined) {
				bug.artmsg('IMPORTANT: Please, set time of ' + objs[i].label);
				return false;
			}
		}
		return true;
	}

	startStory(scope) {
		let self = this;
		self.availableActions = {
			detectLiveLocationActive: function() {
				var interval =  setInterval(function() {
					if (self.brain.isStoryActive === true && self.brain.isLiveLocationActive === true) {
						console.log('live location is active');

					} else {
						console.log('live location is dead');
					}
					//clearInterval(interval);
				}, 2000);
			},
			sendImage: function(scope, url) {
				self.brain.out.replyWithImage(scope, url);
			}
		};
		self.brain.isStoryActive = true;
		let storyOrder = ['mainNarratives', ''];
		self.storyActCursor = 0;
		self.mainNarrativeCursor = 0;
		self.actionCursor = 0;
		self.mediumCursor = 0;
		self.speechCursor = 0;
		let storyActs = self.library.StoryAct.objs;
		if (self.checkIfObjsHaveTime(storyActs)) {
			self.sortFacts(storyActs);
			let currentStoryAct = storyActs[self.storyActCursor];
			self.startStoryAct(scope, currentStoryAct);
		} else {
			bug.artmsg('Will abort :(');
		}
	}

// if action exist, you wait for it, if not you jump

	startStoryAct(scope, currentStoryAct) {
		let self = this;
		let currentNarrative = currentStoryAct.mainNarratives[self.mainNarrativeCursor];
		self.brain.out.replyWithSimpleMessage(scope, currentNarrative.content);
		self.startNarrative(scope, currentNarrative);
	}

	startNarrative(scope, currentNarrative) {
		let self = this;
		let currentMedium = currentNarrative.mediums[self.mediumCursor];
		let currentAction =  currentNarrative.actions[self.actionCursor];
		if (currentMedium) self.executeQuantifier(scope, currentMedium);
		if (currentAction) {
			if (!self.executeQuantifier(scope, currentAction)) self.startSpeechPhase(scope, '');
		} else {
			console.log('II');
			self.startSpeechPhase(scope, '');
			scope.waitForRequest.then(scope => {
				console.log('shit');
        		scope.sendMessage('Got message from you!');
    		});
		}
	}

	startSpeechPhase(scope, currentSpeech) {
		let self = this;
		self.brain.out.replyWithSimpleMessage(scope, 'fuck this shit');
	}

	executeQuantifier(scope, subject) {
		let self = this;
		let toBePerformedList = [];
		for (var i = self.qts.length - 1; i >= 0; i--) {
			if (subject[self.qts[i]] !== undefined) {
				let qt = self.qts[i];
				let entry = {};
				toBePerformedList.push({ins: subject.instantiation, qt: qt, val: subject[qt]});
			}
		}
		for (var j = toBePerformedList.length - 1; j >= 0; j--) {
			let entry = toBePerformedList[j];
			switch (entry.ins) {
				case 'Action':
					self.availableActions[entry.val]();
					return true;
				case 'Medium':
					if (entry.qt === 'image') {
						self.availableActions.sendImage(scope, entry.val);
					}
					return true;
				case 'POI':
					// statements_1
					break;
				default:
					// statements_def
					break;
			}
		}
		return false;
	}
}

module.exports = Bot;