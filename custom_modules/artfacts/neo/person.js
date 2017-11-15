'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

var Node = require('./../node');
var Event = require('./event');
var Location = require('./location');

class Person extends Node {

	init() {
		super.init();
	}

	loadPersonWithID(id, callback) {
		let self = this;
		self.aggregates = {};
		self.geburtsdatum = undefined;
		self.instance = undefined;
		self.extra = undefined;
		self.vorname = undefined;
		self.geburtsname = undefined;
		self.nachname = undefined;
		self.name = undefined;
		self.kb = undefined;
		self.isPersonLoaded = false;
		self.getPerson(id, function(response) {
			if (Object.keys(response).length !== 0) {
				this.geburtsdatum = response.geburtsdatum;
				this.instance = response.instance;
				this.extra = response.extra;
				this.vorname = response.vorname;
				this.geburtsname = response.geburtsname;
				this.nachname = response.nachname;
				this.name = response.name;
				this.kb = response.kb;
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

	loadAggredates(person_id, callback) {
		let self = this;
		let isCallbackSent = false;
		//let aggregate;
		let aggregates = {};
		self.getPersonAggregates(person_id, function(result) {
			result.forEach( function(node) {
				let instantiation = node.aggregate.properties.instantiation;
				let kb = node.aggregate.properties.kb;
				switch (node.aggregate.labels[0]) {
					case 'LOCATION':
						let pos = node.aggregate.properties.pos;
						let extra = node.aggregate.properties.extra;
						let gps = node.aggregate.properties.gps;
						var location = new Location();
						location.init();
						location.loadLocationWithReadyInfo(pos, extra, gps, instantiation, kb);
						aggregates[node.rel] = location;
						break;
					case 'EVENT':
						let date = node.aggregate.properties.date;
						var event = new Event();
						event.init();
						event.loadEventWithReadyInfo(date, instantiation, kb);
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