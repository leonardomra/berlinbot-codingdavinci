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

	replyWithStolpersteinYesNoMenu(scope, person) {
		var yesNoMenu = Telegraf.Extra
			.markdown()
			.markup((m) => m.inlineKeyboard([
				[m.callbackButton('View address on the map...', 'goToStolperstein'), m.callbackButton('No!', 'abortStolperstein')]
			]).resize());
		return scope.reply('There is a "Stolperstein" with his/her name. Would you like to visit it?', yesNoMenu);
	}


	shortDescriptionIntro(scope, person, user, message) {
		let self = this;
		bug.artmsg(person.name);
		self.showAvailability(scope, person);
		let isKid = false;
		let hasBornDate = false;
		if (person.itsid !== 'unknown') isKid = true;
		if (person.aggregates['was_born_in']) hasBornDate = true;
		if (hasBornDate) {
			if(person.aggregates.was_born_in.date === 'unknown') hasBornDate = false;
		}
		let reply = '';
		if (isKid) {
			let pronom = (function(g) {
				if (g === 'female')
					return  'she';
				else
					return 'he';
			})(person.gender);
			reply += person.name + ' was one of the school children victims of the Nazi regime';
			if (hasBornDate) {
				let msec = Date.parse(person.aggregates.was_born_in.date);
				let d = new Date(msec);
				reply += ', who was born in ' + d.getFullYear() + '.';
			} else {
				reply += '.';
			}
			reply += ' Would you like to see the registration cards of when ' + pronom + ' was studying?';
			user.isAllowedToReceiveSchoolCard = true;
		} else {
			reply += person.name + ' was a ' + person.instance.toLowerCase() + ' of the Nazi regime';
			if (hasBornDate) {
				let msec = Date.parse(person.aggregates.was_born_in.date);
				let d = new Date(msec);
				reply += ' born in ' + d.getFullYear() + '.';
			} else {
				reply += '.';
			}
			user.isAllowedToReceiveSchoolCard = false;
		}
		scope.reply(reply)
			.then(() => {
				if (!user.isAllowedToReceiveSchoolCard) self.shortDescriptionParentsChild(scope, person, user, message);
			});
	}

	shortDescriptionShowSchoolCards(scope, person, user, message) {
		bug.artmsg('shortDescriptionShowSchoolCards');
		let self = this;
		user.isAllowedToReceiveSchoolCard = false;
		scope.reply('There you are!');
		let photoUrl_1 = 'http://insidetouristguides.com/botfiles/cards/' + person.itsid + '_1.jpg';
		let photoUrl_2 = 'http://insidetouristguides.com/botfiles/cards/' + person.itsid + '_2.jpg';
		scope.replyWithPhoto(photoUrl_1)
		.then(() => {
			scope.replyWithPhoto(photoUrl_2)
			.then(() => {
				self.shortDescriptionParentsChild(scope, person, user, message);
			})
			.catch((e) => {
				bug.error('Picture not found.');
			});
		})
		.catch((e) => {
			bug.error('Picture not found.');
		});
	}

	shortDescriptionParentsChild(scope, person, user, message) {
		bug.artmsg('shortDescriptionParentsChild');
		let self = this;
		let isFather = false;
		let isMother = false;
		let isChild = false;
		if (person.aggregates['is_father_of']) isFather = true;
		if (person.aggregates['is_mother_of']) isMother = true;
		if (person.aggregates['is_child_of']) isChild = true;
		let reply = '';
		if (isFather === false && isMother === false && isChild === false) {
			self.shortDescriptionSchool(scope, person, user, message);
		} else {
			user.isAllowedToReceiveInfoAboutFamily = true;
			if (isFather === true && isMother === false) {
				reply += person.name + ' was the father of ' + person.aggregates.is_father_of.name + '. Would you like to get more information about ' + person.aggregates.is_father_of.name + '?';
				user.rememberPersonToDivert = person.aggregates.is_father_of.name;
			} else if (isFather === false && isMother === true) {
				reply += person.name + ' was the mother of ' + person.aggregates.is_mother_of.name + '. Would you like to get more information about ' + person.aggregates.is_mother_of.name + '?';
				user.rememberPersonToDivert = person.aggregates.is_mother_of.name;
			} else if (isFather === false && isMother === false){
				reply += person.name + ' was the child of ' + person.aggregates.is_child_of.name + '. Would you like to get more information about ' + person.aggregates.is_child_of.name + '?';
				user.rememberPersonToDivert = person.aggregates.is_child_of.name;
			}
			scope.reply(reply);
		}
	}


	shortDescriptionDivertToOtherPerson(scope, person, user, message) {
		bug.artmsg('shortDescriptionDivertToOtherPerson');
		let self = this;
		if (user.rememberPersonToDivert) {
			message.text = user.rememberPersonToDivert;
			self.brain.in.init(scope, message, 'text');
			self.brain.in.analyseMessage(function(reply) {
				self.brain.manageIntent(reply, scope);
			});
		} else {
			console.log('nothing 1');
		}
	}

	shortDescriptionSchool(scope, person, user, message) {  //Bad Request: message text is empty... why?
		bug.artmsg('shortDescriptionSchool');
		let self = this;
		let isKid = false;
		let isStudent = false;
		let wasEnrolled = false;
		let hasQuit = false;
		if (person.itsid !== 'unknown') isKid = true;
		if (person.aggregates['studied_at']) isStudent = true;
		if (person.aggregates['started_enrollment']) wasEnrolled = true;
		if (person.aggregates['ended_enrollment']) hasQuit = true;
		let reply = '';
		if (isKid) {
			let pronom = (function(g) {
				if (g === 'female')
					return  'She';
				else
					return 'He';
			})(person.gender);
			if (isStudent) {
				reply += person.name + ' was a student at the ' + person.aggregates.studied_at.name + '. ';
				if (wasEnrolled) {
					let dateS = person.aggregates.started_enrollment.date;
					if (dateS.substring(4, dateS.length) === '-00-00') dateS = dateS.substring(0, 4);
					let msecS = Date.parse(dateS);
					let dS = new Date(msecS);
					reply += pronom + ' started stuying at this school in ' + dS.getFullYear();
					if (hasQuit) {
						let dateE = person.aggregates.ended_enrollment.date;
						if (dateE.substring(4, dateE.length) === '-00-00') dateE = dateE.substring(0, 4);
						let msecE = Date.parse(dateE);
						let dE = new Date(msecE);
						reply += ' and ended in ' + dE.getFullYear() + '.';
						if (person.reasonLeavingSchool === 'unknown') {
							reply += ' The reason why ' + pronom.toLowerCase() + ' had to leave school is unknown.';
						} else {
							reply += ' ' + pronom + ' left school, because ' + pronom.toLowerCase() + ' ' + person.reasonLeavingSchool.toLowerCase();
						}
					}
				}
			} else {
				console.log('nothing 2');
			}
			scope.reply(reply)
				.then(() => {
					self.shortDescriptionHome(scope, person, user, message);
				})
				.catch((e) => {});
		} else {
			self.shortDescriptionHome(scope, person, user, message);
		}
	}

	shortDescriptionHome(scope, person, user, message) {
		bug.artmsg('shortDescriptionHome');
		let self = this;
		let hadHome = false;
		let wasDeported = false;
		let hasDied = false;
		let hasDeathPlace = false;
		let reply = '';
		if (person.aggregates['lived_at']) hadHome = true;
		if (person.aggregates['was_deported_in']) wasDeported = true;
		if (person.aggregates['died_in']) hasDied = true;
		if (person.aggregates['died_at']) hasDeathPlace = true;
		if (hadHome) {
			user.isAllowedToReceiveHomeAddress = true;
			reply += person.name + ' lived at ' + person.aggregates.lived_at.pos + '. ';
			if (wasDeported) {
				let dateD = person.aggregates.was_deported_in.date;
				if (dateD.substring(4, dateD.length) === '-00-00') dateD = dateD.substring(0, 4);
				let msecD = Date.parse(dateD);
				let dD = new Date(msecD);
				reply += person.nachname + ' was deported in ' + dD.getFullYear();
				if (hasDied) {
					let dateDi = person.aggregates.died_in.date;
					if (dateDi !== 'unknown') {
						if (dateDi.substring(4, dateD.length) === '-00-00') dateDi = dateDi.substring(0, 4);
						let msecDi = Date.parse(dateDi);
						let dDi = new Date(msecDi);
						reply += ' and died in ' + dDi.getFullYear();
					} else {
						if (hasDeathPlace) {
							reply += ' and died';
						}
					}
					if (hasDeathPlace) {
						reply += ' in ' + person.aggregates.died_at.pos + '.';
					} else {
						reply += '.';
					}
				} else {
					reply += '.';
				}
			}
			reply += ' Would you like to visit the place where ' + person.name + ' lived?';
			scope.reply(reply);
		} else {
			self.shortDescriptionEndMessage(scope, person, user, message);
		}
	}

	shortDescriptionLocationHome(scope, person, user, message) {
		bug.artmsg('shortDescriptionLocationHome');
		let self = this;
		let hadHome = false;
		if (person.aggregates['lived_at']) hadHome = true;
		if (hadHome) {
			let coords = person.aggregates.lived_at.gps.split(',');
			scope.replyWithLocation(coords[0], coords[1])
				.then(() => {
					self.shortDescriptionEndMessage(scope, person, user, message);
				});
		}
	}

	shortDescriptionEndMessage(scope, person, user, message) {
		let self = this;
		scope.reply('If you would like to know about someone else. Just let me know. Glad to help! 🤗');
	}

	showAvailability(scope, person) {
		let isKid = false;
		let hasBornDate = false;
		let isFather = false;
		let isMother = false;
		let isChild = false;
		let isStudent = false;
		let wasEnrolled = false;
		let hasQuit = false;
		let wasDeported = false;
		let hadHome = false;
		let hasDied = false;
		let hasDeathPlace = false;
		if (person.itsid !== 'unknown') {
			isKid = true;
		}
		bug.artmsg('was_born_in:');
		if (person.aggregates['was_born_in']) {
			hasBornDate = true;
			bug.artmsg(person.aggregates.was_born_in.date);
		}
		bug.artmsg('is_father_of:');
		if (person.aggregates['is_father_of']) {
			isFather = true;
			bug.artmsg(person.aggregates.is_father_of.name);
		}
		bug.artmsg('is_mother_of:');
		if (person.aggregates['is_mother_of']) {
			isMother = true;
			bug.artmsg(person.aggregates.is_mother_of.name);
		}
		bug.artmsg('is_child_of:');
		if (person.aggregates['is_child_of']) {
			isChild = true;
			bug.artmsg(person.aggregates.is_child_of.name);
		}
		bug.artmsg('studied_at:');
		if (person.aggregates['studied_at']) {
			isStudent = true;
			bug.artmsg(person.aggregates.studied_at.name);
		}
		bug.artmsg('started_enrollment:');
		if (person.aggregates['started_enrollment']) {
			wasEnrolled = true;
			bug.artmsg(person.aggregates.started_enrollment.date);
		}
		bug.artmsg('ended_enrollment:');
		if (person.aggregates['ended_enrollment']) {
			hasQuit = true;
			bug.artmsg(person.aggregates.ended_enrollment.date);
		}
		bug.artmsg('was_deported_in:');
		if (person.aggregates['was_deported_in']){
			wasDeported = true;
			bug.artmsg(person.aggregates.was_deported_in.date);
		}
		bug.artmsg('lived_at:');
		if (person.aggregates['lived_at']) {
			hadHome = true;
			bug.artmsg(person.aggregates.lived_at.pos);
		}
		bug.artmsg('died_in:');
		if (person.aggregates['died_in']) {
			hasDied = true;
			bug.artmsg(person.aggregates.died_in.date);
		}
		bug.artmsg('died_at:');
		if (person.aggregates['died_at']) {
			hasDeathPlace = true;
			bug.artmsg(person.aggregates.died_at.pos);
		}
	}

	replyWithWelcomeMessage(scope) {
		const aboutMenu = Telegraf.Extra
			.markdown()
			.markup((m) => m.keyboard(
				[
					[m.callbackButton('Take a tour! 🚶'), m.locationRequestButton('Around me! 🗺️'), m.callbackButton('Help! 🤔')]
				]
			)
			.resize());
		return scope.reply('Hi ' + scope.update.message.from.first_name +'! Nice to see you around!\nLet me introduce myself...', aboutMenu);
	}

	replyWithWelcomeMessageContinuation(scope) {

		function prepareMsg4() {
			let msg = '' +
				'If you need any help - please press the „Help Button“ or type in /help and send it to me. I hope I can answer your questions and make the most of your user experience!' +
				'';
				scope.replyWithChatAction('typing');
				setTimeout(() => {
					scope.reply(msg);
				}, 3000);
		}

		function prepareMsg3() {
			let msg = '' +
				'I have 3 functions for you:' +
				'\n\n' +
				'1) Every time you pass by a certain location, I will give you information about a Jewish kid living here during the Nazi regime (1933-1945) or a person’s Stolperstein.' +
				'\n\n' +
				'2) You can ask me as well questions about a kid or type in a name that comes into your mind. I will see if there was a kid or a parent with that name and research if I have information about the person you are interested in.' +
				'\n\n' +
				'3) If you do want to take a predefined tour, you can simply press the „Tour Button“. I already instructed some of my friends to string their marbles to an exciting story!';
				scope.replyWithChatAction('typing');
				setTimeout(() => {
					scope.reply(msg)
						.then(prepareMsg4);
				}, 3000);
		}

		function prepareMsg2() {
			let msg = '' +
				'I’m sure you heard a lot about the Nazi regime in Germany (1933-1945) and about the faith of many Jewish people. Often forgotten are the Jewish kids and their experience during this time in Germany. You surely know Anne Frank though - the girl who wrote a diary about her time hiding from the Nazis in Amsterdam and was eventually murdered by them. ' +
				'\n\n' +
				'But there were many many more kids and many many more stories (hiding, surviving, fleeing, deportation, demise, death). This kids and their stories are distributed all over Europe and the city of Berlin like precious marbles, connected to each other by the Jewish schools they went to.' +
				'\n\n' +
				'I will be by your side while you are wondering through Berlin and learn about our different marbles!';
				scope.replyWithChatAction('typing');
				setTimeout(() => {
					scope.reply(msg)
						.then(prepareMsg3);
				}, 3000);
		}


		scope.replyWithChatAction('typing');
		let photoUrl = 'http://insidetouristguides.com/botfiles/marblesposter.jpg';
		scope.replyWithPhoto(photoUrl)
			.then(() => {
				let msg = '' +
					'I\'m Marbles.\n' +
					'I\'m happy that you are joining me in this adventure!\n';
				scope.reply(msg)
					.then(prepareMsg2);
			});
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

	replyWithLocationOfStolperstein(reply, scope, user, message, telegraf, poi, allVictimsForAddresses) {
		let self = this;
		let victimsMsg = 'There were victims who lived at this address: \n\n';
		function handleVictims(victim) {
			victimsMsg += '👉 ' + victim + '\n';
		}
		for (let key in allVictimsForAddresses) {
			if (key === poi[0]) {
				allVictimsForAddresses[key].forEach(handleVictims);
			}
		}
		victimsMsg += '\nIf you would like to know more about a particular person, let me know 🔎';
		self.replyWithSimpleMessage(scope, 'You are currently at ' + poi[0] + '.' + victimsMsg);
		self.sendLocation(scope, telegraf, poi[1][0], poi[1][1], 'Stolperstein', poi[0]);
	}

	replyWithOtherLocationsOfStolperstein(eply, scope, user, message, advised, told, allVictimsForAddresses) {
		let self = this;
		let otherLocationsMessage;
		function handleVictims(victim, index) {
			otherLocationsMessage += victim + ', ';
		}
		if (Object.keys(advised).length > 0) {
			let stringToCompare = otherLocationsMessage;
			otherLocationsMessage = 'There are other important locations around you... \n';
			for (let address in advised) {
				if (advised[address][0] === false) {
					let shouldInform = true;
					for (let toldAddress in told) {
						if (toldAddress === address) {
							shouldInform = false;
							break;
						}
					}
					//if (shouldInform) {
						otherLocationsMessage += '👉 On ' + address + ' lived ';
						for (let key in allVictimsForAddresses) {
							if (key === address) {
								allVictimsForAddresses[key].forEach(handleVictims);
							}
						}
						otherLocationsMessage = otherLocationsMessage.substring(0, otherLocationsMessage.length - 2) + '.';
					//}
				}
			}
			if (otherLocationsMessage !== stringToCompare) self.replyWithSimpleMessage(scope, otherLocationsMessage);
		}
	}
}

module.exports = BotOutput;