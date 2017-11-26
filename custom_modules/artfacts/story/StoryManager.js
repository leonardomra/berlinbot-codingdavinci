'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./../../mydebugger');

class StoryManager {

	init(library, brain, user) {
		let self = this;
		self.user = user;
		self.library = library;
		self.brain = brain;
		self.delay = 3000;
		self.availableActions = {
			sendActLocationToUser: function(self, scope, fact) {
				let gps = fact.pOIs[0].gps.split(',');
				let lat = gps[0];
				let lon = gps[1];
				scope.replyWithChatAction('typing');
				setTimeout(() => {
					self.currentActForMenuCallback = fact;
					self.brain.out.sendLocation(scope, self.brain.telegraf, lat, lon, fact.pOIs[0].content.trim(), fact.pOIs[0].label.trim())
						.then(() => {
							scope.replyWithChatAction('typing');
							setTimeout(() => {
								self.brain.out.replyWithYesNoMenu(scope, user, 'Continue', 'No, cancel the tour.');
							}, self.delay);
						});
				}, self.delay);
			},
			detectIfUserIsReadyToNextAct: function(self, scope, fact) {
				self.currentActForMenuCallback = fact;
				self.brain.out.replyWithYesNoMenu(scope, user, 'Take me to the next spot!', 'No, cancel the tour.');
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
	}

	startStory(scope) {
		let self = this;
		scope.replyWithChatAction('typing');
		/*
		self.brain.locationEmitter.on('GOT_LOCATION', () => {
  			console.log('an event occurred!');
		});
		*/
		if (self.interval) clearInterval(self.interval);
		self.brain.isStoryActive = true;   ///<<<<<<---- THIS WILL NOT WORK
		self.storyVerticalOrderCursor = 0;
		self.storyOrder = [
			{name: self.startStoryAct, isCurrent: false, isComplete: false, cursor: 0},
			{name: self.startNarrative, isCurrent: false, isComplete: false, cursor: 0},
			{name: self.startSpeech, isCurrent: false, isComplete: false, cursor: 0},
		];
		self.storyOrder[self.storyVerticalOrderCursor].name(self, scope, null);  // <-- exec first
	}

	sortFacts(list) {
		let self = this;
		list = list.sort(self.compareFacts);
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
		//self.brain.out.replyWithSimpleMessage(scope, 'Story was stopped.');
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
		}, self.delay);
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
		function nextSpeech() {
			mediumCursor = 0;
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
			console.log('will send medium');
			console.log(mediumCursor)
			console.log(currentSpeech.mediums.length)
			console.log(currentSpeech.mediums)
			if (mediumCursor < currentSpeech.mediums.length) {
				let currentMedium = currentSpeech.mediums[mediumCursor];
				if (currentMedium) {
					self.executeQuantifier(self, scope, currentSpeech, currentMedium)
						.then(function() {
							mediumCursor++;
							scope.replyWithChatAction('typing');
							setTimeout(function() {
								nextMedium();
							}, self.delay);
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
				scope.replyWithChatAction('typing');
				setTimeout(function() {
					nextSpeech();
				}, self.delay);
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
					scope.replyWithChatAction('typing');
					try {
						self.availableActions[entry.val](self, scope, fact);
						objToReturn = true;
					} catch(e) {
						// statements
						bug.error('Your instantiation might be wrong');
						bug.error(e);
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

module.exports = StoryManager;