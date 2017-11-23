'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./../../mydebugger');
const Brain = require('./../../brain');
const StoryLoader = require('./StoryLoader');
const StoryManager = require('./StoryManager');

class Bot {

	wakeup(projectsToLoad) {
		bug.artmsg('Hit from Bot!');
		let self = this;
		self.brain = new Brain();
		self.brain.telegraf = self.telegraf;
		self.brain.hook = self.hook;
		self.brain.port = self.port;
		self.qts = ['time', 'image', 'extra', 'video', 'audio', 'gps', 'url'];
		self.storyPerUser = {};
		self.loadedProjects = {};
		projectsToLoad.forEach((project) => self.loadedProjects[project] = null);
		self.loadNextProject(null);
	}

	loadNextProject(scope) {
		let self = this;
		function handleFinishedLoading(m) {
			bug.artmsg(m);
			let index = 0;
			for (let id in self.loadedProjects) {
				if (self.loadedProjects[id] === null) index++;
			}
			if (index !== 0) {
				bug.artmsg('will wait 10 seconds before loading next project. Please, wait...');
				setTimeout(() => {
					self.loadNextProject(scope);
				}, 10000);
			} else {
				self.initializeBotBrain(scope);
			}
		}
		for (let key in self.loadedProjects) {
			if (self.loadedProjects[key] === null) {
				self.loadedProjects[key] = new StoryLoader();
				self.loadedProjects[key].qts = self.qts;
				self.loadedProjects[key].finishedLoading = handleFinishedLoading;
				self.loadedProjects[key].init(key);
				break;
			}
		}
	}

	reloadStories(scope) {
		let self = this;
		for (let id in self.loadedProjects) {
			self.loadedProjects[id] = null;
		}
		self.loadNextProject(scope);
	}

	startAStory(scope, stringId) {
		let self = this;
		for (let key in self.loadedProjects) {
			var project = self.loadedProjects[key];
			let subject = project.library.MainActor.objs[0];
			let actor = subject.content.replace(/ /g,'').toLowerCase();
			if (actor === stringId) {
				if (self.storyPerUser[scope.update.callback_query.from.id]) {
					self.storyPerUser[scope.update.callback_query.from.id].stopStory(scope, null);
					self.storyPerUser[scope.update.callback_query.from.id] = null;
				}
				self.storyPerUser[scope.update.callback_query.from.id] = new StoryManager();
				self.storyPerUser[scope.update.callback_query.from.id].qts = self.qts;
				self.storyPerUser[scope.update.callback_query.from.id].init(project.library, self.brain, scope.update.callback_query.from.id);
				self.storyPerUser[scope.update.callback_query.from.id].startStory(scope);
			}
		}
	}

	initializeBotBrain(scope) {
		let self = this;
		if (self.brain.bot === undefined) {
			self.brain.init();
			self.brain.bot = self;
			bug.artmsg('Brain will get 💊');
		} else {
			bug.artmsg('Brain is already fed.');
			self.brain.out.replyWithSimpleMessage(scope, 'Taste me! 🌶');
		}
	}
}

module.exports = Bot;