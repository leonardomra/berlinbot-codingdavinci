'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const Bug = require('./mydebugger');
const Telegraf = require('telegraf');

class BotOutput {

	replyWithImage(scope, imageUrl) {
		scope.replyWithPhoto(imageUrl);
	}

	replyWithSimpleMessage(scope, message) {
		scope.reply(message);
	}

	replyWithPersonNotFound(scope) {
		let reply = 'I\'m sorry. I don\'t know this person. Would you like me to request a research?';
		scope.reply(reply);
	}

	replyWithSimpleVictimStatement(scope, person) {
		let reply = person.name + ' was a ' + person.instance.toLowerCase() + ' of the Nazi regime. ';
		scope.reply(reply);
	}

	replyWithMultiplePeopleOptionList(scope, entry, people) {
		let entities = '';
		let options = [];
		people.forEach( function(person, index) {
			options[index] = person;
			entities = entities + '/' + (index) + ' ' + person.name + '\n';
		});
		let botMsg = 'I\'m not sure. There are ' + people.length + ' entries with the name of ' + entry + '. Could you be more specific? \n';
		botMsg += entities;
		scope.reply(botMsg);
		return options;
	}

	replyWithStolpersteinYesNoMenu(scope, person) {
		scope.runInlineMenu({
			layout: 2, //some layouting here
			method: 'sendMessage', //here you must pass the method name
			params: ['There is a "Stolperstein" with his/her name. Would you like to visit it?'], //here you must pass the parameters for that method
			menu: [ //Sub menu (current message will be edited)
				{
					text: 'View address on the map...',
					callback: () => {
						scope.sendMessage('I\'ll guide you there! Just a second...');
						if (person.aggregates.lived_at !== undefined) {
							let coords = person.aggregates.lived_at.gps.split(',');
							scope.sendLocation(coords[0], coords[1]);
						}
					}
				},
				{
					text: 'No!',
					callback: () => {
						scope.sendMessage('Would you like me to give you information about another person?');
					}
				}
			]
		});
	}

	replyWithShortDescription(scope, person) {
		let reply = person.name + ' was a ' + person.instance.toLowerCase() + ' of the Nazi regime. ';
		if (person.aggregates.was_born_in !== undefined) {
			let msec = Date.parse(person.aggregates.was_born_in.date);
			let d = new Date(msec);
			reply += person.name + ' was born in ' + d.getFullYear();
		}
		if (person.aggregates.lived_at !== undefined) {
			reply += ' and lived for some part of his/her life at the ' + person.aggregates.lived_at.pos + ' in ' + person.aggregates.lived_at.extra  + '. ';
		}
		if (person.aggregates.died_at !== undefined) {
			// shouldn't be died, but was deported, because some of them survived the concentration camps
			reply += person.name + ' was deported to ' + person.aggregates.died_at.pos + '. ';
		}
		if (person.aggregates.died_in !== undefined) {
			let msec = Date.parse(person.aggregates.died_in.date);
			let d = new Date(msec);
			if (d.getFullYear() > 1945) { // liberation of Auschwitz
				reply += person.name + ' survided life in the concentration camp, and died later on in ' + d.getFullYear() + '.';
			} else {
				reply += person.name + ' died in ' + d.getFullYear() + '.';
			}
		} else {
			reply += '.';
		}
		scope.reply(reply);
	}

	replyWithWelcomeMessage(scope) {
		const aboutMenu = Telegraf.Extra
		.markdown()
		.markup((m) => m.keyboard([
			[m.callbackButton('Take a tour! 🚶', 'tour'), m.callbackButton('Help! 🤔', 'help')]
		]).resize());
		return scope.reply('Welcome text!', aboutMenu);
		/*
		scope.runMenu({
			message: 'Hi there!',
			layout: 2,
			resizeKeyboard: true,
			'What is around me?': () => {}, //will be on first line
			'/start': () => {}, //will be on first line
			'/tour': () => {}, //will be on first line
			'/help': () => {}, //will be on second line
		});
		*/
	}

	replyWithNotification(scope, reply) {
		scope.answerCbQuery(reply)
		.then(function () {
     		console.log("Promise Resolved");
		}).catch(function () {
     		console.log("Promise Rejected");
		});
	}

	replyWithMenuTourMessage(scope, reply) {
		let self = this;
		const testMenu = Telegraf.Extra
			.markdown()
			.markup((m) => {
				let bts = [];
				reply.forEach((subject) => {
					let _action = subject.content.replace(/ /g,'').toLowerCase();
					bts.push(m.callbackButton(subject.content, _action));
					self.brain.telegraf.action(_action, (scope) => {
						//scope.answerCallbackQuery('Please, share your live location!');
						self.brain.bot.startStory(scope, _action);
					});
				});
				return m.inlineKeyboard(bts);
			});
		scope.reply('I have the following tours for you! Please choose one!', testMenu);
	}
}

module.exports = BotOutput;