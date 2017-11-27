'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

/**
* Brain module.
* @module custom_modules/part
*/

const Node = require('./artfacts/node');
const bug = require('./mydebugger');
const UserInput = require('./userinput');
const Persons = require('./artfacts/neo/persons');
const BotOutput = require('./botoutput');
const BotUser = require('./artfacts/story/BotUser');
const PoiDist = require('./poidist');
const EventEmitter = require('events');

/** Class representing a part of a story. */
class Brain {

	/**
	* Initialize Telegram Connection
	*/
	init() {
		let self = this;
		self.bot = null;
		//self.options = {};
		self.in = new UserInput();
		self.in.brain = self;
		self.out = new BotOutput();
		self.out.brain = self;
		self.isStoryActive = false;
		self.isLiveLocationActive = false;
		self.locationReplyCounter = 0;
		self.locationEmitter = new EventEmitter();
		self.allAddresses = {};
		self.allVictimsForAddresses = {};
		self.createListOfLocations();
		//self.createListOfNames();
	}

	createListOfLocations() {
		let self = this;
		Node.getAllLocations(function(response) {
			self.allAddresses = response.locations;
			self.allVictimsForAddresses = response.victims;
			self.startTelegrafRouters();
		});
	}

	createListOfNames() {
		Node.getAllPersonsNames(function(response) {
			console.log(response);
		});
	}

	/**
	* Start Telegraf Routers
	*/
	startTelegrafRouters() {
		let self = this;
		var node = new Node();
		self.telegraf.start((scope) => {
			self.bot.users[scope.update.message.from.id] = new BotUser();
			self.bot.users[scope.update.message.from.id].init(scope.update.message.from.id, scope.update.message.from.first_name);
			self.bot.users[scope.update.message.from.id].setAddresses(self.allAddresses);
			return self.out.replyWithWelcomeMessage(scope)
				.then(info => {
					setTimeout(() => {
						self.out.replyWithWelcomeMessageContinuation(scope);
					}, 2000);
				})
				.catch(error => console.log(error));
		});

		// actions --------------------------------------------------------------------------------
		self.telegraf.action('yes', (scope) => {
			let story = self.bot.storyPerUser[scope.update.callback_query.from.id];
			if (story.currentActForMenuCallback !== undefined) {
				story.nextFact(story, scope, story.currentActForMenuCallback);
			} else {
				bug.error('No delegate for callback defined.');
			}
		});
		self.telegraf.action('no', (scope) => {
			let story = self.bot.storyPerUser[scope.update.callback_query.from.id];
			story.stopStory(scope);
			return scope.reply('you said no');
		});
		self.telegraf.action('reload', (scope) => {
			return scope.reply('you said reload');
		});
		self.telegraf.action('goToStolperstein', (scope) => {
			self.out.replyWithSimpleMessage(scope, 'I\'ll show you where it is! Just a second...');
			scope.replyWithChatAction('typing');
			setTimeout(() => {
				if (self.out.targetPerson.aggregates.lived_at !== undefined) {
					let coords = self.out.targetPerson.aggregates.lived_at.gps.split(',');
					scope.replyWithLocation(coords[0], coords[1]);
				}
			}, 2000);
		});
		// commands --------------------------------------------------------------------------------
		self.telegraf.command('reload', (scope) => {
			return scope.reply('You want me to reload. Please, make sure your Artfacts project is consistent. Just a second! I will let you know when I\'m ready... ⏰')
			.then(function(fuck) {
				self.bot.reloadStories(scope);
			});
		});
		self.telegraf.command('help', (scope) => {
			return scope.reply('I will help you!')
			.then(function() {

				//scope.replyWithChatAction('typing');
			});
		});
		self.telegraf.command('tour', (scope) => {
			return scope.reply('got it, you want tour');
		});
		self.telegraf.command('exit', (scope) => {
			self.isStoryActive = false;
			return scope.reply('You decided to quit the tour. See you next time!');
		});
		// hears --------------------------------------------------------------------------------
		self.telegraf.hears('Take a tour! 🚶', scope => {
			self.manageIntent({intention: 'Identify Tour', bot: 'I\'ll organize your tour. Just a second...'}, scope);
		});
		self.telegraf.hears('Around me! 🗺️', scope => {
			self.manageIntent({intention: 'Identify Location', bot: 'I\'m gonna check what is around you. Just a second...'}, scope);
		});
		self.telegraf.hears('Help! 🤔', scope => {
			//self.manageIntent({intention: 'Identify Location', bot: 'I\'m gonna check what is around you. Just a second...'}, scope);
			scope.reply('You need help! Here is what I can do for you...\n' +
				'Please note, some of my features are available only if you share your live location (📎) with me.\n' +
				'Is something wrong? Type /start to restart the application.\n' +
				'Do you want to take a tour? Type /tour or use the menu.\n' +
				'Do you want to read these hints? Type /help or use the menu.\n' +
				'And last but not least, don\'t forget your headphones when you take a tour!');
		});

		// regular text --------------------------------------------------------------------------------
		self.telegraf.on('text', (scope) => {
			self.in.init(scope, scope.message, 'text');
			self.in.analyseMessage(function(reply) {
				self.manageIntent(reply, scope);
			});
		});
		// location --------------------------------------------------------------------------------
		self.telegraf.on('location', (scope) => {
			bug.artmsg('inside location');
			self.in.init(scope, scope.message, 'location');
			self.in.analyseMessage(function(reply) {
				self.manageIntent(reply, scope);
			});
		});
		self.telegraf.on('edited_message', (scope) => {
			bug.artmsg('inside edited_message');
			self.in.init(scope, scope.update, 'location');
			self.in.analyseMessage(function(reply) {
				self.manageIntent(reply, scope);
			});
		});
	}

	monitorLocation() {
		let self = this;
		if (self.timeOutLocationActive === undefined) {
			self.timeOutLocationActive = setInterval(function() {
				self.locationReplyCounter++;
				bug.artmsg('isLiveLocationActive will be reset... ' + self.locationReplyCounter);
				self.isLiveLocationActive = false;
			}, 1000);
		}
	}

	manageIntent(reply, scope) {
		let self = this;
		bug.msg('You want me to process ------------>>> [' + reply.intention + ']');
		bug.msg(reply);
		bug.msg('---------------------------------');
		let user;
		let message;
		let _isLiveLocationActive;
		if (scope['message']) {
			message = scope.message;
			_isLiveLocationActive = false;
		} else if (scope['update']) {
			message = scope.update.edited_message;
			_isLiveLocationActive = true;
		}
		if (!self.bot.users[message.from.id]) {
			self.bot.users[message.from.id] = new BotUser();
			user = self.bot.users[message.from.id];
			user.init(message.from.id, message.from.first_name);
			user.setAddresses(self.allAddresses);
			bug.msg('The user ' + self.bot.users[message.from.id].first_name + ' did not exist.');
			user.isLiveLocationActive = _isLiveLocationActive;
		} else {
			bug.msg('The user ' + self.bot.users[message.from.id].first_name + ' already exists.');
			user = self.bot.users[message.from.id];
			user.isLiveLocationActive = _isLiveLocationActive;
		}
		switch (reply.intention) {
			case 'Identify Help':
				self.identifyHelpIntent(reply, scope);
				break;
			case 'Identify Person':
				self.identifyPersonIntent(reply, scope, user, message);
				break;
			case 'Identify Option':
				self.identifyOptionIntent(reply, scope, user, message);
				break;
			case 'Identify Location':
				self.identifyLocationIntent(reply, scope, user, message);
				break;
			case 'Identify Tour':
				self.identifyTourIntent(reply, scope);
				break;
			case 'Identify Yes or No':
				self.identifyYesNoIntent(reply, scope, user, message);
				break;
			case 'Default Fallback Intent':
				self.defaultFallbackIntent(reply, scope);
				break;
			default:
				self.undefinedIntent(reply, scope);
				break;
		}
	}

	undefinedIntent(reply, scope) {
		let self = this;
		self.out.replyWithSimpleMessage(scope, reply.bot);
		//scope.sendMessage(reply.bot);
	}

	defaultFallbackIntent(reply, scope) {
		let self = this;
		self.out.replyWithSimpleMessage(scope, reply.bot);
	}

	identifyHelpIntent(reply, scope) {
		let self = this;
		self.out.replyWithSimpleMessage(scope, reply.bot);
	}

	identifyTourIntent(reply, scope) {
		let self = this;
		let actors = [];
		for (let key in self.bot.loadedProjects) {
			let project = self.bot.loadedProjects[key];
			actors.push(project.library.MainActor.objs[0]);
		}
		self.out.replyWithMenuTourMessage(scope, actors);
	}

	identifyLocationIntent(reply, scope, user, message) {
		let self = this;
		user.userLocation.location = reply.loc;
		let told = user.userLocation.getToldLocations();
		let locations = user.userLocation.getPOIs();

		if (locations.distant.length === 0 && locations.near.length === 0) {
			self.out.replyWithSimpleMessage(scope, 'You are not close to any location I know. Try again later!');
			return;
		}
		locations.near.forEach(function(poi) {
			let shouldInform = true;
			for (let toldAddress in told) {
				if (toldAddress === poi[0]) {
					shouldInform = false;
					break;
				}
			}
			//if (shouldInform) {
				//self.allVictimsForAddresses = [];
				//self.allVictimsForAddresses['Humboldtstr 116. Bremen'] = ['u1', 'u2'];
				//self.allVictimsForAddresses['Humboldtstr 64. Bremen'] = ['u1', 'u2'];
				self.out.replyWithLocationOfStolperstein(reply, scope, user, message, self.telegraf, poi, self.allVictimsForAddresses);
			//}
		});

		if(!user.isLiveLocationActive) {
			let advised = user.userLocation.getAdvisedLocations();
			setTimeout(() => {
				self.out.replyWithOtherLocationsOfStolperstein(reply, scope, user, message, advised, told, self.allVictimsForAddresses);
			}, 2000);
		}
	}

	identifyOptionIntent(reply, scope, user, message) {
		let self = this;
		if (!Array.isArray(reply.entities)) {
			if (reply.contexts.length !== 0) {
				reply.contexts.forEach( function(context) {
					if (context.name === 'person-context') {
						var p = user.peopleOptions[context.parameters.Option.Option];
						if (Object.keys(user.peopleOptions).length === 0) {
							self.out.replyWithSimpleMessage(scope, 'Sorry, could you please ask you question again?');
						} else {
							try {
								if (Object.keys(p.aggregates).length !== 0) {
									user.peopleOptions = [];
									user.peopleOptions.push(p);
									self.out.shortDescriptionIntro(scope, p, user, message);
								} else {
									console.log('should replyWithSimpleVictimStatement');
									//self.out.replyWithSimpleVictimStatement(scope, p);
								}
							} catch(e) {
								bug.error(e);
								self.out.replyWithPersonNotFound(scope);
							}
						}
					}
				});
			}
		}
	}

	identifyPersonIntent(reply, scope, user, message) {
		let self = this;
		if (!Array.isArray(reply.entities)) {
			// is dict
			var string = '';
			reply.entities.Name.forEach( function(name) {
				if (typeof name === 'object') {
					string += name.Name + ' ';
				} else {
					string += name + ' ';
				}
			});
			string = string.trim();
			var people = new Persons();
			people.init();
			people.loadPersonsWithMatchingString(string, function(o) {
				if (o.length === 0) {
					bug.msg('No person found :(');
					user.peopleOptions = [];
					self.out.replyWithSimpleMessage(scope, 'Sorry! No ' + string + ' found.');
				} else if (o.length == 1) {
					bug.msg('1 person found :)');
					user.peopleOptions = [];
					user.peopleOptions.push(o[0]);
					setTimeout(function() { // dirty fix - wait for people to load completely
						self.out.shortDescriptionIntro(scope, o[0], user, message);
					}, 1000);
				} else {
					bug.msg('Several people found! :o');
					user.peopleOptions = self.out.replyWithMultiplePeopleOptionList(scope, string, o);
				}
			});
		}
	}

	identifyYesNoIntent(reply, scope, user, message) {
		let self = this;
		let context = reply.contexts[0].name;
		if (context === 'person-context' && user.isAllowedToReceiveSchoolCard === true && reply.entities.PositiveNegative === 'yes') {
			user.isAllowedToReceiveSchoolCard = false;
			self.out.shortDescriptionShowSchoolCards(scope, user.peopleOptions[0], user, message);
		} else if (context === 'person-context' && user.isAllowedToReceiveInfoAboutFamily === true && reply.entities.PositiveNegative === 'yes') {
			user.isAllowedToReceiveInfoAboutFamily = false;
			self.out.shortDescriptionDivertToOtherPerson(scope, user.peopleOptions[0], user, message);
		} else if (context === 'person-context' && user.isAllowedToReceiveHomeAddress === true && reply.entities.PositiveNegative === 'yes') {
			user.isAllowedToReceiveHomeAddress = false;
			self.out.shortDescriptionLocationHome(scope, user.peopleOptions[0], user, message);
		}

		if (context === 'person-context' && user.isAllowedToReceiveSchoolCard === true && reply.entities.PositiveNegative === 'no') {
			user.isAllowedToReceiveSchoolCard = false;
			self.out.shortDescriptionParentsChild(scope, user.peopleOptions[0], user, message);
		} else if (context === 'person-context' && user.isAllowedToReceiveInfoAboutFamily === true && reply.entities.PositiveNegative === 'no') {
			user.isAllowedToReceiveInfoAboutFamily = false;
			self.out.shortDescriptionSchool(scope, user.peopleOptions[0], user, message);
		} else if (context === 'person-context' && user.isAllowedToReceiveHomeAddress === true && reply.entities.PositiveNegative === 'no') {
			user.isAllowedToReceiveHomeAddress = false;
			self.out.shortDescriptionEndMessage(scope, user.peopleOptions[0], user, message);
		}
	}
}

module.exports = Brain;