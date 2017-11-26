'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./mydebugger');
const Telegraf = require('telegraf');

class BotOutput {

	sendLocation(scope, telegraf, lat, lon, title, address) {
		let id;
		if (scope['message']) {
			id = scope.message.chat.id;
		} else if (scope['update']) {
			if (scope.update['edited_message']) {
				id = scope.update.edited_message.chat.id;
			} else if (scope.update['callback_query']) {
				id = scope.update.callback_query.message.chat.id;
			}
		}
		return telegraf.telegram.sendVenue(id, lat, lon, title, address);
	}

	replyWithImage(scope, imageUrl) {
		return scope.replyWithPhoto(imageUrl);
	}

	replyWithVideo(scope, videoUrl) {
		return scope.replyWithVideo({ url: videoUrl });
	}

	replyWithHTML(scope, htmlUrl) {
		return scope.replyWithHTML({ url: htmlUrl });
	}

	replyWithAudio(scope, audioUrl) {
		return scope.replyWithVoice({ url: audioUrl });
	}

	replyWithSimpleMessage(scope, message) {
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
				entities = entities + '/' + (index) + '     ' + person.name + '\n\n';
			});
			let botMsg = 'I\'m not sure. There are ' + people.length + ' entries with the name of ' + entry + '. Could you be more specific? \n\n';
			botMsg += entities;
			scope.reply(botMsg);
			return options;
		} catch(e) {
			bug.error(e);
			scope.reply('The developer told me to tell you that in one of your projects there is no main actor');
		}
	}

	replyWithYesNoMenu(scope, user, yes, no) {
		var yesNoMenu = Telegraf.Extra
			.markdown()
			.markup((m) => m.inlineKeyboard([
				[m.callbackButton(yes, 'yes'), m.callbackButton(no, 'no')]
			]).resize());
		return scope.reply('Please, let me know when you are ready to go on! 👇', yesNoMenu);
	}

/*
	replyWithYesNoMenu(scope, user, yes, no) {
		var yesNoMenu = Telegraf.Extra
			.markdown()
			.markup((m) => m.inlineKeyboard([
				[m.callbackButton(yes, 'yes'), m.callbackButton(no, 'no')]
			]).resize());
		return scope.reply('Please, let me know when you are ready to go on! 👇', yesNoMenu);
	}
*/
	replyWithStolpersteinYesNoMenu(scope, person) {
		var yesNoMenu = Telegraf.Extra
			.markdown()
			.markup((m) => m.inlineKeyboard([
				[m.callbackButton('View address on the map...', 'goToStolperstein'), m.callbackButton('No!', 'abortStolperstein')]
			]).resize());
		return scope.reply('There is a "Stolperstein" with his/her name. Would you like to visit it?', yesNoMenu);
	}

	replyWithShortDescription(scope, person) {
		if (person.itsid !== 'unknown') {
			console.log('http://insidetouristguides.com/botfiles/' + person.itsid + '_1.jpg');
			scope.replyWithPhoto('http://insidetouristguides.com/botfiles/' + person.itsid + '_1.jpg').catch(() => bug.error('Picture not found.'));
		}
		console.log('was_born_in:');
		console.log(person.aggregates['was_born_in']);
		console.log('is_father_of:');
		console.log(person.aggregates['is_father_of']);
		console.log('is_mother_of:');
		console.log(person.aggregates['is_mother_of']);
		console.log('is_child_of:');
		console.log(person.aggregates['is_child_of']);
		console.log('studied_at:');
		console.log(person.aggregates['studied_at']);
		console.log('started_enrollment:');
		console.log(person.aggregates['started_enrollment']);
		console.log('ended_enrollment:');
		console.log(person.aggregates['ended_enrollment']);
		console.log('was_deported_in:');
		console.log(person.aggregates['was_deported_in']);
		console.log('lived_at:');
		console.log(person.aggregates['lived_at']);
		console.log('died_in:');
		console.log(person.aggregates['died_in']);
		console.log('died_at:');
		console.log(person.aggregates['died_at']);
		

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
			if (person.aggregates.died_in.date === 'unknown') {
				reply += 'I\'am not sure when she died.';
			} else {
				let msec = Date.parse(person.aggregates.died_in.date);
				let d = new Date(msec);
				if (d.getFullYear() > 1945) { // liberation of Auschwitz
					reply += person.name + ' survided life in the concentration camp, and died later on in ' + d.getFullYear() + '.';
				} else {
					reply += person.name + ' died in ' + d.getFullYear() + '.';
				}
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
				[m.callbackButton('Take a tour! 🚶'), m.callbackButton('Around me! 🗺️'), m.callbackButton('Help! 🤔')]
			]).resize());
		return scope.reply('Hi ' + scope.update.message.from.first_name +'! Nice to see you around!\nLet me introduce myself...', aboutMenu);
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