'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const apiai = require('apiai');
const app = apiai(process.env.DIALOGFLOW_TOKEN);
const Bug = require('./mydebugger');
const PoiDist = require('./poidist');
const listOfPOIs = require('./../data/schools_coords');

class UserInput {

	init(scope, message, kind) {
		let self = this;
		self.scope = scope;
		self.message = message;
		self.kind = kind;
		self.user = {
				firstName: self.message.from.firstName,
				lastName: self.message.from.lastName,
				id: self.message.from.id,
			};
	}

	/*
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
	*/

	analyseMessage(callback) {
		let self = this;
		switch (self.kind) {
			case 'location':
				let pd = new PoiDist(listOfPOIs);
				pd.init(listOfPOIs);
				let list = pd.calculateDistance([self.message.location.latitude, self.message.location.longitude]);
				self.processLocationMessage(list, function(reply) {
					callback(reply);
				});
				break;
			case 'text':
				self.processTextMessage(self.message.text, function(reply) {
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