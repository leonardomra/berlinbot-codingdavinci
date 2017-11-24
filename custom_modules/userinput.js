'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const apiai = require('apiai');
const appai = apiai(process.env.DIALOGFLOW_TOKEN);
const Bug = require('./mydebugger');

class UserInput {

	init(scope, message, kind) {
		let self = this;
		self.scope = scope;
		self.message = message;
		if (message['edited_message']) {
			self.message = message.edited_message;
		}
		self.kind = kind;
		self.user = {
			firstName: self.message.from.firstName,
			lastName: self.message.from.lastName,
			id: self.message.from.id,
		};
	}

	analyseMessage(callback) {
		let self = this;
		switch (self.kind) {
			case 'location':
				let loc = [self.message.location.latitude, self.message.location.longitude];
				self.processLocationMessage(loc, function(reply) {
					callback(reply);
				});
				break;
			case 'text':
				self.processTextMessage(self.message.text, function(reply) {
					callback(reply);
				});
				break;
		}
	}

	processLocationMessage(loc, callback) {
		let self = this;
		let reply = {
			loc: loc,
			intention: 'Identify Location',
		};
		callback(reply);
	}

	processTextMessage(_message, callback) {
		let self = this;
		var request = appai.textRequest(_message, {
			sessionId: '<unique session id>'
		}).on('response', function(response) {
			let reply = {
				text: response.result.resolvedQuery,
				entities: response.result.parameters,
				contexts: response.result.contexts,
				intention: response.result.metadata.intentName,
				bot: response.result.fulfillment.speech
			};
			callback(reply);
		}).on('error', function(error) {
			console.log(error);
		}).end();
	}
}

module.exports = UserInput;