'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

/**
* Brain module.
* @module custom_modules/part
*/

const Telegram = require('telegram-node-bot');
const TelegramBaseController = Telegram.TelegramBaseController;
const TextCommand = Telegram.TextCommand;
const UserInput = require('./userinput');
const Persons = require('./artfacts/neo/persons');
//const Node = require('./artfacts/node');
const BotOutput = require('./botoutput');
const bug = require('./mydebugger');
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
	}

	/**
	* Start Telegraf Routers
	*/
	startTelegrafRouters() {
		let self = this;
		self.telegraf.start((scope) => {
			return self.out.replyWithWelcomeMessage(scope)
				.then((info) => console.log(info));
		});
		// actions
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
		// commands
		/*
		self.telegraf.command('menu', (scope) => {
			return scope.reply('will display menu...')
			.then(function(fuck) {
				self.out.replyWithYesNoMenu(scope);
			});
		});
		*/
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
		// regular text
		self.telegraf.on('text', (scope) => {
			self.in.init(scope, scope.message, 'text');
			self.in.analyseMessage(function(reply) {
				self.manageIntent(reply, scope);
			});
		});
		// location
		self.telegraf.on('location', (scope) => {
			console.log('inside location');

			self.in.init(scope, scope.message, 'location');
			self.in.analyseMessage(function(reply) {
				self.manageIntent(reply, scope);
			});
		});
		//self.monitorLocation();
	}

	monitorLocation() {
		let self = this;
		if (self.timeOutLocationActive === undefined) {
			self.timeOutLocationActive = setInterval(function() {
				self.locationReplyCounter++;
				bug.artmsg('isLiveLocationActive will be reset... ' + self.locationReplyCounter);
				self.isLiveLocationActive = false;
				//self.timeOutLocationActive = undefined;
			}, 1000);
		}
	}

	/**
	* Manage Intents proviced by Dialogflow API
	* @param {object} reply - reply from Dialogflow API.
	* @param {object} scope - scope from Telegram API.
	*/
	manageIntent(reply, scope) {
		let self = this;
		bug.msg(reply.intention);
		switch (reply.intention) {
			case 'Indentify Person':
				self.indentifyPersonIntent(reply, scope);
				break;
			case 'Identify Option':
				self.identifyOptionIntent(reply, scope);
				break;
			case 'Identify Location':
				self.identifyLocationIntent(reply, scope);
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

	/**
	* Handle Undefined Intent
	* @param {object} reply - reply from Dialogflow API.
	* @param {object} scope - scope from Telegram API.
	*/
	undefinedIntent(reply, scope) {
		let self = this;
		self.out.replyWithSimpleMessage(scope, reply.bot);
		//scope.sendMessage(reply.bot);
	}

	/**
	* Handle Default Fallback Intent
	* @param {object} reply - reply from Dialogflow API.
	* @param {object} scope - scope from Telegram API.
	*/
	defaultFallbackIntent(reply, scope) {
		let self = this;
		//Node.getAllPersonsNames(function(response) {});
		self.out.replyWithSimpleMessage(scope, reply.bot);
		//scope.sendMessage(reply.bot);
	}

	/**
	* Handle Identify Tour Intent
	* @param {object} reply - reply from Dialogflow API.
	* @param {object} scope - scope from Telegram API.
	*/
	identifyTourIntent(reply, scope) {
		let self = this;

		let actors = [];

		for (let key in self.bot.loadedProjects) {
			let project = self.bot.loadedProjects[key];
			actors.push(project.library.MainActor.objs[0]);
		}
		self.out.replyWithMenuTourMessage(scope, actors);
	}

	/**
	* Handle Identify Location Intent
	* @param {object} reply - reply from Dialogflow API.
	* @param {object} scope - scope from Telegram API.
	*/
	identifyLocationIntent(reply, scope) {
		let self = this;
		self.isLiveLocationActive = true;
		clearInterval(self.timeOutLocationActive);
		self.timeOutLocationActive = undefined;
		self.locationReplyCounter = 0;
		self.monitorLocation();
		if (!self.isStoryActive) {
			self.out.replyWithSimpleMessage(scope, reply.text);
		} else {
			// move next
			self.locationEmitter.emit('GOT_LOCATION');
			//self.bot.
		}
	}

	/**
	* Handle Identify Option Intent
	* @param {object} reply - reply from Dialogflow API.
	* @param {object} scope - scope from Telegram API.
	*/
	identifyOptionIntent(reply, scope) {
		let self = this;
		if (!Array.isArray(reply.entities)) {
			if (reply.contexts.length !== 0) {
				reply.contexts.forEach( function(context) {
					if (context.name === 'person-context') {
						var p = self.options[context.parameters.Option.Option];
						if (Object.keys(self.options).length === 0) {
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

	/**
	* Handle Indentify Person Intent
	* @param {object} reply - reply from Dialogflow API.
	* @param {object} scope - scope from Telegram API.
	*/
	indentifyPersonIntent(reply, scope) {
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
					self.options = self.out.replyWithMultiplePeopleOptionList(scope, string, o);
				}
			});
		}
	}
}

module.exports = Brain;

/** Class for handling unpredicted messages coming from the Telegram API. */
class OtherwiseController extends TelegramBaseController {

	handle($) {
		let self = this;
		self.in.init($, $._message);
		self.in.analyseMessage(function(reply) {
			self.grabReply(reply, $);
		});
	}
}

/** Class for handling certain kinds of commands coming from the Telegram API. */
class CommandController extends TelegramBaseController {

	welcomeHandler($) {
		this.out.replyWithWelcomeMessage($);
	}

	takeTourHandler($) {
		this.brain.identifyTourIntent(null, $);
		//this.out.replyWithTourMessage($);
	}

	get routes() {
		return {
			'welcomeCommand': 'welcomeHandler',
			'takeTour': 'takeTourHandler',
		};
	}
}
