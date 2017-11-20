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

		/*
		var otherwise = new OtherwiseController();
		otherwise.in = self.in;
		otherwise.grabReply = function (reply, scope) {
			self.manageIntent(reply, scope);
		};
		var command = new CommandController();
		command.out = self.out;
		command.brain = self;
		*/
		self.startTelegrafRouters();
		/*
		self.telegram.router
			.when(new TextCommand('/start', 'welcomeCommand'), command)
			.when(new TextCommand('/tour', 'takeTour'), command)
			.otherwise(otherwise);
		*/
	}

	/**
	* Start Telegraf Routers
	*/
	startTelegrafRouters() {
		let self = this;
		self.telegraf.start((scope) => {
			return self.out.replyWithWelcomeMessage(scope);
		});
		//
		self.telegraf.action('yes', (scope) => {
			self.bot.LoadStoryComponents(scope);
			return scope.reply('you said yes');
		});
		self.telegraf.action('no', (scope) => {
			self.bot.stopStory(scope);
			return scope.reply('you said no');
		});
		self.telegraf.action('reload', (scope) => {
			return scope.reply('you said reload');
		});
		// commands
		self.telegraf.command('menu', (scope) => {
			return scope.reply('will display menu...')
			.then(function(fuck) {
				self.out.replyWithYesNoMenu(scope);
			});
		});
		self.telegraf.command('reload', (scope) => {
			return scope.reply('You want me to reload. Please, make sure your Artfacts project is consistent. Please, just a second! I will let you know when I\'m ready... ⏰')
			.then(function(fuck) {
				self.bot.LoadStoryComponents(scope);
			});
		});
		self.telegraf.command('help', (scope) => {
			return scope.reply('I will help you!').then(function(fuck) {
				console.log('and what?');
			});
		});
		self.telegraf.command('tour', (scope) => {
			return scope.reply('got it, you want tour');
		});
		self.telegraf.command('exit', (scope) => {
			self.isStoryActive = false;
			return scope.reply('You decided to quit the tour. See you next time!');
		});
		// regular text
		self.telegraf.on('text', (scope) => {
			self.in.init(scope, scope.message, 'text');
			self.in.analyseMessage(function(reply) {
				self.manageIntent(reply, scope);
			});
		});
		// location
		self.telegraf.on('location', (scope) => {
			self.in.init(scope, scope.message, 'location');
			self.in.analyseMessage(function(reply) {
				self.manageIntent(reply, scope);
			});
		});
		self.telegraf.startWebhook(self.hook, null, self.port);
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
		self.out.replyWithMenuTourMessage(scope, self.bot.library.MainActor.objs);
	}

	/**
	* Handle Identify Location Intent
	* @param {object} reply - reply from Dialogflow API.
	* @param {object} scope - scope from Telegram API.
	*/
	identifyLocationIntent(reply, scope) {
		let self = this;
		self.isLiveLocationActive = true;
		self.locationReplyCounter++;
		if (self.timeOutLocationActive === undefined) {
			self.timeOutLocationActive = setTimeout(function() {
				bug.artmsg('isLiveLocationActive will be reset... ' + self.locationReplyCounter);
				self.isLiveLocationActive = false;
				self.timeOutLocationActive = undefined;
			}, 120000);
		}
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
