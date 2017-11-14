'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const apiai = require('apiai');
const app = apiai(process.env.DIALOGFLOW_TOKEN);
const Bug = require('./mydebugger');
const PoiDist = require('./poidist');
const listOfPOIs = require('./../data/schools_coords');

class UserInput {

	constructor(scope, message) {
		let self = this;
		self.scope = scope;
		self.message = message;
		self.user = {
				firstName: self.message._from._firstName,
				lastName: self.message._from._lastName,
				id: self.message._from._id,
			};
	}

	whichKindOfMessage() {
		let self = this;
		let kind = '';
		if (self.message._location !== null) {
			kind = 'location';
		} else if (self.message._text !== null) {
			kind = 'text';
		}
		return kind;
	}

	analyseMessage(callback) {
		let self = this;
		switch (self.whichKindOfMessage()) {
			case 'location':
				let pd = new PoiDist(listOfPOIs);
				let list = pd.calculateDistance([self.message._location._latitude, self.message._location._longitude]);
				self.processLocationMessage(list, function(reply) {
					callback(reply);
				});
				break;
			case 'text':
				self.processTextMessage(self.message._text, function(reply) {
					callback(reply);
				});
				break;
			default:
				// statements_def
				break;
		}
	}

	processLocationMessage(list, callback) {
		let self = this;
		let string = 'You are close to: \n';
		list.forEach( function(address, index) {
			string += '/' + index + ' ' + address + '\n';
		});
		let reply = {
			text: string,
			entities: [],
			contexts: [],
			intention: 'Identify Location',
			bot: ''
		};
		callback(reply);
	}

	processTextMessage(_message, callback) {
		let self = this;
		var request = app.textRequest(_message, {
			sessionId: '<unique session id>'
		}).on('response', function(response) {
			let reply = {
				text: response.result.resolvedQuery,
				entities: response.result.parameters,
				contexts: response.result.contexts,
				intention: response.result.metadata.intentName,
				bot: response.result.fulfillment.speech
			};
			//self.scope.sendMessage(response.result.fulfillment.speech);
			callback(reply);
		}).on('error', function(error) {
			console.log(error);
		}).end();
	}
}

module.exports = UserInput;

/*
self.user = user;
		self.message = message;
		console.log(
				'user first name: ' + user.firstName + ', \n' +
				'user last name: ' + user.lastName + ', \n' +
				'user id: ' + user.id + ', \n' +
				'user asked: ' + message.text + ', \n' +
				'user is talking about: ' + message.entities + ', \n' +
				'context of the conversation: ' + message.contexts + ', \n' +
				'the bot identified the following intention: ' + message.intention + '. ' +
			'');
			*/