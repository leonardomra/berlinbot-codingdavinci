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
const listOfPOIs = require('./../data/schools_coords');
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
		self.options = {};
		self.in = new UserInput();
		self.in.brain = self;
		self.out = new BotOutput();
		self.out.brain = self;
		self.isStoryActive = false;
		self.isLiveLocationActive = false;
		self.locationReplyCounter = 0;
		self.locationEmitter = new EventEmitter();
		self.startTelegrafRouters();
		//self.createListOfNames();
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
			return self.out.replyWithWelcomeMessage(scope)
				.then(info => null)
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
		/*
		self.telegraf.command('loc', (scope) => {
			let lat = 53.0;
			let lon = 8.8;
			//self.telegraf.telegram.sendLocation(scope.update.message.chat.id, lat, lon, { live_period: 60 })
			self.telegraf.telegram.sendLocation(scope.update.message.chat.id, lat, lon)
				.then((message) => {
					const timer = setInterval(() => {
						lat += Math.random() * 0.001;
						lon += Math.random() * 0.001;
						self.telegraf.telegram.editMessageLiveLocation(lat, lon, message.chat.id, message.message_id)
							.catch(() => clearInterval(timer));
					}, 1000);
				})
				.catch((e) => {
					console.log(e);
				});
		});
		*/
		// hears --------------------------------------------------------------------------------
		self.telegraf.hears('Take a tour! 🚶', scope => {
			self.manageIntent({intention: 'Identify Tour', bot: 'I\'ll organize your tour. Just a second...'}, scope);
		});
		self.telegraf.hears('Around me! 🗺️', scope => {
			self.manageIntent({intention: 'Identify Location', bot: 'I\'m gonna check what is around you. Just a second...'}, scope);
		});
		self.telegraf.hears('Help! 🤔', scope => {
			self.manageIntent({intention: 'Identify Location', bot: 'I\'m gonna check what is around you. Just a second...'}, scope);
			scope.reply('You need help! Here is what I can do for you...');
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
			console.log('inside location');
			self.in.init(scope, scope.message, 'location');
			self.in.analyseMessage(function(reply) {
				self.manageIntent(reply, scope);
			});
		});
		self.telegraf.on('edited_message', (scope) => {
			console.log('inside edited_message');
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
		bug.msg('You want me to process ' + reply.intention);
		let user;
		let message;
		if (scope['message']) {
			message = scope.message;
		} else if (scope['update']) {
			message = scope.update.edited_message;
		}
		if (!self.bot.users[message.from.id]) {
			self.bot.users[message.from.id] = new BotUser();
			user = self.bot.users[message.from.id];
			user.init(message.from.id, message.from.first_name);
			bug.msg('The user ' + self.bot.users[message.from.id].first_name + ' did not exist.');
		} else {
			bug.msg('The user ' + self.bot.users[message.from.id].first_name + ' already exists.');
			user = self.bot.users[message.from.id];
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
		/*
		let user;
		let message;
		if (scope['message']) {
			message = scope.message;
		} else if (scope['update']) {
			message = scope.update.edited_message;
		}
		if (!self.bot.users[message.from.id]) {
			self.bot.users[message.from.id] = new BotUser();
			user = self.bot.users[message.from.id];
			user.init(message.from.id, message.from.first_name);
		} else {
			user = self.bot.users[message.from.id];
		}
		*/
		user.userLocation.location = reply.loc;
		let told = user.userLocation.getToldLocations();
		let locations = user.userLocation.getPOIs();
		console.log(told);
		locations.near.forEach(function(poi) {
			let shouldInform = true;
			for (let toldAddress in told) {
				if (toldAddress === poi[0]) {
					shouldInform = false;
					break;
				}
			}
			if (shouldInform) {
				self.out.replyWithSimpleMessage(scope, 'You are currently at ' + poi[0] + '. In this address...');
				self.out.sendLocation(scope, self.telegraf, poi[1][0], poi[1][1], 'the address of someone', poi[0]);
			}
		});
		let advised = user.userLocation.getAdvisedLocations();
		if (Object.keys(advised).length > 0) {
			let otherLocationsMessage = 'The other following address are around: \n';
			let stringToCompare = otherLocationsMessage;
			for (let address in advised) {
				if (advised[address][0] === false) {
					let shouldInform = true;
					for (let toldAddress in told) {
						if (toldAddress === address) {
							shouldInform = false;
							break;
						}
					}
					if (shouldInform) otherLocationsMessage += address + '\n';
				}
			}
			if (otherLocationsMessage !== stringToCompare) self.out.replyWithSimpleMessage(scope, otherLocationsMessage);
		}
	}

	identifyOptionIntent(reply, scope, user, message) {
		let self = this;
		if (!Array.isArray(reply.entities)) {
			if (reply.contexts.length !== 0) {
				reply.contexts.forEach( function(context) {
					if (context.name === 'person-context') {
						//var p = self.options[context.parameters.Option.Option];
						var p = user.peopleOptions[context.parameters.Option.Option];
						if (Object.keys(user.peopleOptions).length === 0) {
							self.out.replyWithSimpleMessage(scope, 'Sorry, could you please ask you question again?');
						} else {
							try {
								if (Object.keys(p.aggregates).length !== 0) {
									self.out.replyWithShortDescription(scope, p);
									self.out.targetPerson = p;
									self.out.replyWithStolpersteinYesNoMenu(scope, p);
								} else {
									self.out.replyWithSimpleVictimStatement(scope, p);
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
					self.options = {};
					self.out.replyWithSimpleMessage(scope, 'Sorry! No ' + string + ' found.');
				} else if (o.length == 1) {
					bug.msg('1 person found :(');
					self.options[0] = o[0];
					setTimeout(function() { // dirty fix - wait for people to load completely
						self.out.replyWithShortDescription(scope, o[0]);
						self.out.replyWithStolpersteinYesNoMenu(scope, o[0]);
					}, 500);
				} else {
					bug.msg('Several people found!');
					user.peopleOptions = self.out.replyWithMultiplePeopleOptionList(scope, string, o);
					//console
					//console.log(self.bot.users[scope.update.message.from.id])
					//self.
					//self.options = self.out.replyWithMultiplePeopleOptionList(scope, string, o);

					
				}
			});
		}
	}
}

module.exports = Brain;