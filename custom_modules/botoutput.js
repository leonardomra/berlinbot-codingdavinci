'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./mydebugger');
const Telegraf = require('telegraf');

class BotOutput {

	sendLocation(scope, lat, lon) {
		let self = this;
		return self.brain.telegraf.telegram.sendLocation(scope.update.callback_query.message.chat.id, lat, lon);
	}

	replyWithImage(scope, imageUrl) {
		//scope.replyWithChatAction('upload_photo');
		return scope.replyWithPhoto(imageUrl);
	}

	replyWithVideo(scope, videoUrl) {
		//scope.replyWithChatAction('upload_video');
		return scope.replyWithVideo({ url: videoUrl });
	}

	replyWithHTML(scope, htmlUrl) {
		return scope.replyWithHTML({ url: htmlUrl });
	}

	replyWithAudio(scope, audioUrl) {
		//scope.replyWithChatAction('upload_audio');
		//return scope.replyWithAudio({ url: audioUrl });
		return scope.replyWithVoice({ url: audioUrl });
	}

	replyWithSimpleMessage(scope, message) {
		//scope.replyWithChatAction('typing');
		try {
			return scope.reply(message);
		} catch(e) {
			bug.error(e);
		}
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
		try {
			people.forEach( function(person, index) {
				options[index] = person;
				entities = entities + '/' + (index) + ' ' + person.name + '\n';
			});
			let botMsg = 'I\'m not sure. There are ' + people.length + ' entries with the name of ' + entry + '. Could you be more specific? \n';
			botMsg += entities;
			scope.reply(botMsg);
			return options;
		} catch(e) {
			bug.error(e);
			scope.reply('The developer told me to tell you that in one of your projects there is no main actor');
		}
	}

	replyWithYesNoMenu(scope, user, yes, no) {
		//scope.replyWithChatAction('typing');
		var yesNoMenu = Telegraf.Extra
			.markdown()
			.markup((m) => m.inlineKeyboard([
				[m.callbackButton(yes, 'yes'), m.callbackButton(no, 'no')]
			]).resize());
		return scope.reply('Please, let me know when you are ready to go on! 👇', yesNoMenu);
	}

	replyWithStolpersteinYesNoMenu(scope, person) {
		var yesNoMenu = Telegraf.Extra
			.markdown()
			.markup((m) => m.inlineKeyboard([
				[m.callbackButton('View address on the map...', 'goToStolperstein'), m.callbackButton('No!', 'abortStolperstein')]
			]).resize());
		return scope.reply('There is a "Stolperstein" with his/her name. Would you like to visit it?', yesNoMenu);


		/*

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
		*/
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
		//scope.replyWithChatAction('typing');
		const aboutMenu = Telegraf.Extra
			.markdown()
			.markup((m) => m.keyboard([
				[m.callbackButton('Take a tour! 🚶', 'tour'), m.callbackButton('Help! 🤔', 'help')]
			]).resize());
		return scope.reply('Welcome text!', aboutMenu);
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
		//scope.replyWithChatAction('typing');
		try {
			const testMenu = Telegraf.Extra
				.markdown()
				.markup((m) => {
					let bts = [];
					reply.forEach((subject) => {
						let _action = subject.content.replace(/ /g,'').toLowerCase();
						bts.push([m.callbackButton('The story of ' + subject.content, _action)]);
						self.brain.telegraf.action(_action, (scope) => {
							//scope.answerCallbackQuery('Please, share your live location!');
							self.brain.bot.startAStory(scope, _action);
						});
					});
					return m.inlineKeyboard(bts);
				});
			scope.reply('I have the following tours for you! Please choose one!', testMenu);
		} catch(e) {
			bug.error(e);
			scope.reply('The developer told me to tell you that in one of your projects there is no main actor');
		}
	}
}

module.exports = BotOutput;