'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const Telegram = require('telegram-node-bot');
const TelegramBaseController = Telegram.TelegramBaseController;
const TextCommand = Telegram.TextCommand;
const UserInput = require('./userinput');
const Persons = require('./persons');
const Node = require('./node');
const BotOutput = require('./botoutput');

class Part {

	initTelegram() {
		let self = this;
		self.options = {};
		self.telegram = new Telegram.Telegram(process.env.TELEGRAM_TOKEN, {
			workers: 1, // coment on production
			webAdmin: {
				port: process.env.PORT || 5000
			}
		});
		var otherwise = new OtherwiseController();
		otherwise.grabReply = function (reply, scope) {
			self.dissectReply(reply, scope);
		};
		self.telegram.router
			.when(new TextCommand('ping', 'pingCommand'), new PingController())
			.when(new TextCommand('hello', 'helloCommand'), new PingController())
			.otherwise(otherwise);
	}

	dissectReply(reply, scope) {
		let self = this;
		switch (reply.intention) {
			case 'Indentify Person':
				self.indentifyPersonIntent(reply, scope);
				break;
			case 'Identify Option':
				self.identifyOptionIntent(reply, scope);
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
		scope.sendMessage(reply.bot);
	}

	defaultFallbackIntent(reply, scope) {
		//Node.getAllPersonsNames(function(response) {});
		scope.sendMessage(reply.bot);

	}

	identifyOptionIntent(reply, scope) {
		let self = this;
		let out = new BotOutput();
		if (!Array.isArray(reply.entities)) {
			if (reply.contexts.length !== 0) {
				reply.contexts.forEach( function(context) {
					if (context.name === 'person-context') {
						var p = self.options[context.parameters.Option.Option];
						if (Object.keys(self.options).length === 0) {
							scope.sendMessage('Sorry, could you please ask you question again?');
						} else {
							try {
								if (Object.keys(p.aggregates).length !== 0) {
									out.replyWithShortDescription(scope, p);
									out.replyWithStolpersteinYesNoMenu(scope, p);
								} else {
									out.replyWithSimpleVictimStatement(scope, p);
								}
							} catch(e) {
								// statements
								console.log(e);
								out.replyWithPersonNotFound(scope);
							}
						}
					}
				});
			}
		}
	}

	indentifyPersonIntent(reply, scope) {
		let self = this;
		let out = new BotOutput();
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
			people.loadPersonsWithMatchingString(string, function(o) {
				if (o.length === 0) {
					console.log('no person found :(');
					self.options = {};
					scope.sendMessage('Sorry! No ' + string + '.');
				} else if (o.length == 1) {
					console.log('one person found!');
					self.options[0] = o[0];
					setTimeout(function() { // dirty fix - wait for people to load completely
						out.replyWithShortDescription(scope, o[0]);
						out.replyWithStolpersteinYesNoMenu(scope, o[0]);
					}, 500);
				} else {
					console.log('several people found!');
					self.options = out.replyWithMultiplePeopleOptionList(scope, string, o);
				}
			});
		}
	}
}

module.exports = Part;

class PingController extends TelegramBaseController {
	pingHandler($) {
		$.sendMessage('pong');
	}
	helloHandler($) {
		$.sendMessage('hi!');
	}

	get routes() {
		return {
			'pingCommand': 'pingHandler',
			'helloCommand': 'helloHandler',
		};
	}
}

class OtherwiseController extends TelegramBaseController {
	handle($) {
		let self = this;
		var userInput = new UserInput($, $._message);
		userInput.analyseMessage(function(reply) {
			self.grabReply(reply, $);
		});
	}
}

