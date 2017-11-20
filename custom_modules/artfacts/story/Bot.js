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
		self.brain.telegraf = self.telegraf;
		self.brain.hook = self.hook;
		self.brain.port = self.port;
		self.node = new Node();
		self.node.init();
		self.projectId = '59faeeb23dcf640fb556b5e5';
		self.qts = ['time', 'image', 'extra', 'video', 'audio', 'gps', 'url'];
		self.LoadStoryComponents(null);
	}

	LoadStoryComponents(scope) {
		let self = this;
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
		function handleIds(ids, className) {
			ids.forEach( function(id) {
				var o = new self.library[className].class();
				o.init();
				o.instantiation = className;
				self.library[className].objs.push(o);
				o.loadSubjectWithID(id, function(subject) {
					subject.factIsLoaded = true;
					if (self.watchLibraryLoad(self.library)) {
						bug.artmsg('------------------> Ok... I\'m half awake!'); // if I don't take up, check your knowledge chunks. There might be too many disconnected entities...
						self.distributeFacts(scope);
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
						bug.artmsg('------------------> I\'m ready babe!!!');
						self.initializeBotBrain(scope);
					}
				});
			});
		}
		for (let key in self.library) {
			self.library[key].objs.forEach(handleTimeQuantifer);
		}
	}

	initializeBotBrain(scope) {
		let self = this;
		if (self.brain.bot === undefined) {
			self.brain.init();
			self.brain.bot = self;
			//self.brain.out.replyWithSimpleMessage(scope, 'What can I do for you?!');
			bug.artmsg('Brain will get 💊');
		} else {
			bug.artmsg('Brain is already fed.');
			self.brain.out.replyWithSimpleMessage(scope, 'Taste me! 🌶');
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

	stopStory(scope, point) {
		bug.artmsg('Story will be stopped...');
		let self = this;
		self.brain.isStoryActive = false;
		self.brain.out.replyWithSimpleMessage(scope, 'Story was stopped.');
	}

	startStory(scope, stringId) {
		let self = this;
		scope.replyWithChatAction('typing');
		self.brain.locationEmitter.on('GOT_LOCATION', () => {
  			console.log('an event occurred!');
		});
		if (self.interval) {
			clearInterval(self.interval);
		}
		self.availableActions = {

			detectLiveLocationActive: function(self, scope, fact) {
				self.interval =  setInterval(function() {
					if (self.brain.isStoryActive === true && self.brain.isLiveLocationActive === true) {
						bug.artmsg('live location is active');
						if (self.storyVerticalOrderCursor === 1 && self.storyOrder[self.storyVerticalOrderCursor].cursor === 0) {
							clearInterval(self.interval);
							self.nextFact(self, scope, fact);
						}
					} else {
						bug.artmsg('live location is dead');
						//self.brain.out.replyWithSimpleMessage(scope, 'Please, share your live location!');
					}
				}, 5000);
			},

			detectIfUserIsReadyToNextAct: function(self, scope, fact) {
				self.currentActForMenuCallback = fact;
				self.brain.out.replyWithYesNoMenu(scope);
			},

			sendImage: function(scope, url) {
				return self.brain.out.replyWithImage(scope, url);
			},

			sendVideo: function(scope, url) {
				return self.brain.out.replyWithVideo(scope, url);
			},

			sendHTML: function(scope, url) {
				return self.brain.out.replyWithHTML(scope, url);
			},

			sendAudio: function(scope, url) {
				return self.brain.out.replyWithAudio(scope, url);
			},

		};
		self.brain.isStoryActive = true;
		self.storyVerticalOrderCursor = 0;
		self.storyOrder = [
			{name: self.startStoryAct, isCurrent: false, isComplete: false, cursor: 0},
			{name: self.startNarrative, isCurrent: false, isComplete: false, cursor: 0},
			{name: self.startSpeech, isCurrent: false, isComplete: false, cursor: 0},
		];
		self.storyOrder[self.storyVerticalOrderCursor].name(self, scope, null);  // <-- exec first
	}

	resetStoryOrder(self) {
		self.storyOrder.forEach(function(fact) {
			fact.isCurrent = false;
			fact.isComplete = false;
			fact.cursor = 0;
		});
	}

	nextFact(self, scope, fact) {
		scope.replyWithChatAction('typing');
		setTimeout(function() {
			self.storyOrder[self.storyVerticalOrderCursor].isCurrent = false;
			self.storyOrder[self.storyVerticalOrderCursor].isComplete = true;
			self.storyVerticalOrderCursor++;
			if (self.storyVerticalOrderCursor < self.storyOrder.length) {
				self.storyOrder[self.storyVerticalOrderCursor].name(self, scope, fact);  // <-- exec
			} else {
				self.storyVerticalOrderCursor = 0;
				let currentActCursor = self.storyOrder[0].cursor;
				self.resetStoryOrder(self);
				self.storyOrder[0].cursor = currentActCursor;
				self.storyOrder[0].cursor++;
				self.storyOrder[self.storyVerticalOrderCursor].name(self, scope, fact);  // <-- exec
			}
		}, 500);
	}

	startStoryAct(self, scope) {
		let currentStoryAct;
		let storyActs = self.library.StoryAct.objs;
		function abort(msg) {
			self.brain.out.replyWithSimpleMessage(scope, msg);
			self.stopStory(scope, 'startStoryAct');
		}
		if (self.storyOrder[self.storyVerticalOrderCursor].cursor < storyActs.length) {
			if (self.checkIfObjsHaveTime(storyActs)) {
				self.sortFacts(storyActs);
				currentStoryAct = storyActs[self.storyOrder[self.storyVerticalOrderCursor].cursor];
				//bug.artmsg('StoryAct is in position ' +  self.storyOrder[self.storyVerticalOrderCursor].cursor + '.');
				//check if there is action
				self.nextFact(self, scope, currentStoryAct);
			} else {
				let msg = 'Time of facts are not properly configured. Will abort :(';
				abort(msg);
				return;
			}
		} else {
			let msg = 'There are no more stories to tell. See you next time!';
			 abort(msg);
			 return;
		}
	}

	startNarrative(self, scope, currentStoryAct) {
		if (currentStoryAct.mainNarratives.length !== 0) {
			scope.replyWithChatAction('typing');
			let currentNarrative = currentStoryAct.mainNarratives[self.storyOrder[self.storyVerticalOrderCursor].cursor];
			self.brain.out.replyWithSimpleMessage(scope, currentNarrative.content);
			let mediumCursor = 0;
			let currentMedium = currentNarrative.mediums[mediumCursor];
			if (currentMedium) self.executeQuantifier(self, scope, currentNarrative, currentMedium);
			let actionCursor = 0;
			let currentAction =  currentNarrative.actions[actionCursor];
			if (currentAction) { // if there is no action signed, jump to the next phase
				if (!self.executeQuantifier(self, scope, currentStoryAct, currentAction)) self.nextFact(self, scope, currentStoryAct);
			} else {
				self.nextFact(self, scope, currentStoryAct);
			}
		} else {
			bug.artmsg('No narrative for act. Continuing...');
			self.nextFact(self, scope, currentStoryAct);
		}
	}

	startSpeech(self, scope, currentStoryAct) {
		let speeches, currentSpeech, mediumCursor;
		var delayMultiplier = 0;
		function nextSpeech() {
			if (self.storyOrder[self.storyVerticalOrderCursor].cursor < speeches.length) {
				scope.replyWithChatAction('typing');
				currentSpeech = speeches[self.storyOrder[self.storyVerticalOrderCursor].cursor];
				if (currentSpeech.mediums.length !== 0) {
					if (self.checkIfObjsHaveTime(currentSpeech.mediums)) {
						self.sortFacts(currentSpeech.mediums);
					} else {
						abort();
						return;
					}
				}
				self.brain.out.replyWithSimpleMessage(scope, currentSpeech.content)
					.then(function() {
						self.storyOrder[self.storyVerticalOrderCursor].cursor++;
						nextMedium();
					}).catch(function () {
						bug.error("Promise Rejected");
					});
			} else {
				self.nextFact(self, scope, currentStoryAct);
			}
		}
		function nextMedium() {
			if (mediumCursor < currentSpeech.mediums.length) {
				let currentMedium = currentSpeech.mediums[mediumCursor];
				if (currentMedium) {
					self.executeQuantifier(self, scope, currentSpeech, currentMedium)
						.then(function() {
							mediumCursor++;
							nextMedium();
						});
				}
			} else {
				executeAction();
			}
		}
		function executeAction() {
			let actionCursor = 0;
			let currentAction =  currentSpeech.actions[actionCursor];
			if (currentAction) {
				if (!self.executeQuantifier(self, scope, currentSpeech, currentAction)) nextSpeech();//self.nextFact(self, scope, currentStoryAct);
			} else {
				nextSpeech();
			}
		}
		function abort() {
			let msg = 'Time of speeches are not properly configured. Will abort :(';
			bug.artmsg(msg);
			self.brain.out.replyWithSimpleMessage(scope, msg);
			self.stopStory(scope, 'startSpeech');
		}
		if (currentStoryAct.actorSpeechs.length !== 0) {
			speeches = currentStoryAct.actorSpeechs;
			currentSpeech = speeches[self.storyOrder[self.storyVerticalOrderCursor].cursor];
			mediumCursor = 0;
			if (self.checkIfObjsHaveTime(speeches)) {
				self.sortFacts(speeches);
				nextSpeech();
			} else {
				abort();
				return;
			}
		} else {
			self.nextFact(self, scope, currentStoryAct);
		}
	}

	executeQuantifier(self, scope, fact, subject) {
		let toBePerformedList = [];
		let objToReturn;
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
				try {
					self.availableActions[entry.val](self, scope, fact);
					objToReturn = true;
				} catch(e) {
					// statements
					bug.error('Your instantiation might be wrong');
					self.brain.out.replyWithSimpleMessage(scope, 'My developer told me to tell you that you should check the instantiation for ' + subject.content);
					objToReturn = false;
				}
				break;
				case 'Medium':
					if (entry.qt === 'image') {
						scope.replyWithChatAction('upload_photo');
						objToReturn =  self.availableActions.sendImage(scope, entry.val);
					} else if (entry.qt === 'video') {
						scope.replyWithChatAction('upload_video');
						objToReturn = self.availableActions.sendVideo(scope, entry.val);
					} else if (entry.qt === 'url') {
						objToReturn = self.availableActions.sendHTML(scope, entry.val);
					} else if (entry.qt === 'audio') {
						scope.replyWithChatAction('upload_audio');
						objToReturn = self.availableActions.sendAudio(scope, entry.val);
					}
				break;
				case 'POI':
					// statements_1
					break;
				default:
					// statements_def
					break;
			}
		}
		return objToReturn;
	}
}

module.exports = Bot;