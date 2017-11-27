'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./../../mydebugger');
const UserLocation = require('./UserLocation');

class BotUser {

	init(id, first_name) {
		let self = this;
		self.factIsLoaded = false;
		self.first_name = first_name;
		self.id = id;
		self.userLocation = new UserLocation();
		self.userLocation.init(self);
		self.personNumber = undefined;
		self.peopleOptions = [];
		self.isAllowedToReceiveSchoolCard = false;
		self.isAllowedToReceiveInfoAboutFamily = false;
		self.isAllowedToReceiveHomeAddress = false;
		self.rememberPersonToDivert = undefined;
	}

	setPersonOption(number) {
		let self = this;
		self.personNumber = number;
	}

	setPeopleOptions(list) {
		let self = this;
		self.peopleOptions = list;
	}
}

module.exports = BotUser;