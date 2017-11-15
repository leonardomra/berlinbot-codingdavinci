'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const Node = require('./../node');
const Person = require('./../neo/person');

class Persons extends Node {

	loadPersonsWithMatchingString(string, callback) {
		let self = this;
		self.persons = [];
		self.areAllPersonsLoaded = false;
		self.getPersons(string, function(response) {
			var self = this;
			if (response.length === 0) {
				callback(self.persons);
				return;
			}
			response.forEach( function(id, index) {
				var p = new Person();
				self.persons.push(p);
				p.loadPersonWithID(id, function(person) {
					if (self.watchPersonsLoad()) callback(self.persons);
				});
			});
		}.bind(self));
	}

	filterPersonsAccodingToBirhday(approxBithday, callback) {
		let self = this;
		self.persons.forEach( function(person) {
			var date = [];
			var isDateUnfit = false;
			try {
				date = person.geburtsdatum.split('-');
			} catch(e) {
				console.log(e);
			}
			if (date.length !== 3) {
				isDateUnfit = true;
			}
			date.forEach( function(part, index) {
				if (part === '') {
					isDateUnfit = true;
				}
			});
			if (!isDateUnfit) {
				console.log('ok');
			} else {
				console.log('not okay');
			}
		});
	}

	watchPersonsLoad() {
		let self = this;
		for (var i = 0; i < self.persons.length; i++) {
			if (self.persons[i].isPersonLoaded === false || self.persons[i].isPersonLoaded === undefined) {
				return false;
			}
		}
		return true;
	}
}

module.exports = Persons;