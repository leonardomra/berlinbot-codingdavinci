'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

var Node = require('./../node');
var Event = require('./event');
var Location = require('./location');
var Institution = require('./institution');

class Person extends Node {

	init() {
		super.init();
	}

	loadPersonWithID(id, callback) {
		let self = this;
		self.aggregates = {};
		self.instance = undefined;
		self.gender = undefined;
		self.vorname = undefined;
		self.geburtsname = undefined;
		self.geburtsdatum = undefined;
		self.nationality = undefined;
		self.kb = undefined;
		self.lifestage = undefined;
		self.name = undefined;
		self.nachname = undefined;
		self.itsid = undefined;
		self.reasonLeavingSchool = undefined;
		self.isPersonLoaded = false;
		self.getPerson(id, function(response) {
			if (Object.keys(response).length !== 0) {
				self.instance = response.instance;
				self.gender = response.gender;
				self.vorname = response.vorname;
				self.geburtsname = response.geburtsname;
				self.geburtsdatum = response.geburtsdatum;
				self.nationality = response.nationality;
				self.kb = response.kb;
				self.lifestage = response.lifestage;
				self.name = response.name;
				self.nachname = response.nachname;
				self.itsid = response.itsid;
				self.reasonLeavingSchool = response.reasonLeavingSchool;
				self.isPersonLoaded = false;
				this.loadAggredates(id, function(aggregates) {
					self.aggregates = aggregates;
					self.isPersonLoaded = true;
					callback(self);
				});
			} else {
				callback(self);
			}
		}.bind(self));
	}

	loadPersonWithReadyInfo(instance, gender, vorname, geburtsname, geburtsdatum, nationality, kb, lifestage, name, nachname, itsid, reasonLeavingSchool) {
		let self = this;
		self.instance = instance;
		self.gender = gender;
		self.vorname = vorname;
		self.geburtsname = geburtsname;
		self.geburtsdatum = geburtsdatum;
		self.nationality = nationality;
		self.kb = kb;
		self.lifestage = lifestage;
		self.name = name;
		self.nachname = nachname;
		self.itsid = itsid;
		self.reasonLeavingSchool = reasonLeavingSchool;
		self.isPersonLoaded = true;
	}

	loadAggredates(person_id, callback) {
		let self = this;
		let isCallbackSent = false;
		//let aggregate;
		let aggregates = {};
		self.getPersonAggregates(person_id, function(result) {
			result.forEach( function(node) {
				let instance = node.aggregate.properties.instance;
				let kb = node.aggregate.properties.kb;
				switch (node.aggregate.labels[0]) {
					case 'PERSON':
						let gender = node.aggregate.properties.gender;
						let vorname = node.aggregate.properties.vorname;
						let geburtsname = node.aggregate.properties.geburtsname;
						let geburtsdatum = node.aggregate.properties.geburtsdatum;
						let nationality = node.aggregate.properties.nationality;
						let lifestage = node.aggregate.properties.lifestage;
						let name = node.aggregate.properties.name;
						let nachname = node.aggregate.properties.nachname;
						let itsid = node.aggregate.properties.itsid;
						let reasonLeavingSchool = node.aggregate.properties.reasonLeavingSchool;
						var person = new Person();
						person.init();
						person.loadPersonWithReadyInfo(instance, gender, vorname, geburtsname, geburtsdatum, nationality, kb, lifestage, name, nachname, itsid, reasonLeavingSchool);
						aggregates[node.rel] = person;
						break;
					case 'LOCATION':
						let pos = node.aggregate.properties.pos;
						let extra = node.aggregate.properties.extra;
						let gps = node.aggregate.properties.gps;
						var location = new Location();
						location.init();
						location.loadLocationWithReadyInfo(pos, extra, gps, instance, kb);
						aggregates[node.rel] = location;
						break;
					case 'INSTITUTION':
						let name_inst = node.aggregate.properties.name;
						var institution = new Institution();
						institution.init();
						institution.loadInstitutionWithReadyInfo(name_inst, instance, kb);
						aggregates[node.rel] = institution;
						break;
					case 'EVENT':
						let date = node.aggregate.properties.date;
						var event = new Event();
						event.init();
						event.loadEventWithReadyInfo(date, instance, kb);
						aggregates[node.rel] = event;
						break;
					default:
						// statements_def
						break;
				}
				if (!isCallbackSent) {
					isCallbackSent = true;
					callback(aggregates);
				}
			});
		});
	}
}

module.exports = Person;