'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

/**
* Part module.
* @module custom_modules/part
*/

const Telegram = require('telegram-node-bot');
const TelegramBaseController = Telegram.TelegramBaseController;
const TextCommand = Telegram.TextCommand;
const UserInput = require('./userinput');
const Persons = require('./artfacts/neo/persons');
//const Node = require('./artfacts/node');
const BotOutput = require('./botoutput');
const Bug = require('./mydebugger');

/** Class representing a part of a story. */

class Part {

	/**
	* Initialize Telegram Connection
	*/
	init() {
		let self = this;
		self.options = {};
		self.out = new BotOutput();
		self.telegram = new Telegram.Telegram(process.env.TELEGRAM_TOKEN, {
			workers: 1, // coment on production
			webAdmin: {
				port: process.env.PORT || 5000
			}
		});
		var otherwise = new OtherwiseController();
		otherwise.grabReply = function (reply, scope) {
			self.manageIntent(reply, scope);
		};
		var command = new CommandController();
		command.out = self.out;
		self.telegram.router
			.when(new TextCommand('/start', 'welcomeCommand'), command)
			.otherwise(otherwise);
	}

	/**
	* Manage Intents proviced by Dialogflow API
	* @param {object} reply - reply from Dialogflow API.
	* @param {object} scope - scope from Telegram API.
	*/
	manageIntent(reply, scope) {
		let self = this;
		Bug.msg(reply.intention);
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
	* Handle Default Fallback Intent
	* @param {object} reply - reply from Dialogflow API.
	* @param {object} scope - scope from Telegram API.
	*/
	identifyLocationIntent(reply, scope) {
		let self = this;
		self.out.replyWithSimpleMessage(scope, reply.text);
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
								Bug.error(e);
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
					Bug.msg('No person found :(');
					self.options = {};
					self.out.replyWithSimpleMessage(scope, 'Sorry! No ' + string + ' found.');
				} else if (o.length == 1) {
					Bug.msg('1 person found :(');
					self.options[0] = o[0];
					setTimeout(function() { // dirty fix - wait for people to load completely
						self.out.replyWithShortDescription(scope, o[0]);
						self.out.replyWithStolpersteinYesNoMenu(scope, o[0]);
					}, 500);
				} else {
					Bug.msg('Several people found!');
					self.options = self.out.replyWithMultiplePeopleOptionList(scope, string, o);
				}
			});
		}
	}
}

module.exports = Part;

/** Class for handling unpredicted messages coming from the Telegram API. */
class OtherwiseController extends TelegramBaseController {

	handle($) {
		let self = this;
		var userInput = new UserInput();
		userInput.init($, $._message);
		userInput.analyseMessage(function(reply) {
			self.grabReply(reply, $);
		});
	}
}

/** Class for handling certain kinds of commands coming from the Telegram API. */
class CommandController extends TelegramBaseController {

	welcomeHandler($) {
		this.out.replyWithWelcomeMessage($);
	}

	get routes() {
		return {
			'welcomeCommand': 'welcomeHandler',
		};
	}
}
