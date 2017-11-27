'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const PoiDist = require('./../../poidist');
//const listOfPOIs = require('./../../../data/schools_coords');

class UserLocation {

	init(user, addresses) {
		let self = this;
		self.user = user;
		self.latitude = undefined;
		self.longitude = undefined;
		self.advisedLocations = {};
		self.toldLocations = {};
		self.pd = new PoiDist();
		//self.pd.init(listOfPOIs, 0.3);
		self.pd.init(addresses, 0.3);
	}

	set location(loc) {
		let self = this;
		self.latitude = loc[0];
		self.longitude = loc[1];
	}

	get location() {
		let self = this;
		return [self.latitude, self.longitude];
	}

	getPOIs() {
		let self = this;
		let distances = self.pd.calculateDistance([self.latitude, self.longitude]);
		distances.distant.forEach( function(poi) {
			if (!self.advisedLocations[poi[0]]) {
				self.advisedLocations[poi[0]] = [false, poi[1]];
			}
		});
		distances.near.forEach( function(poi) {
			for (let key in self.advisedLocations) {
				if (poi[0] === key) {
					self.advisedLocations[key] = [true, poi[1]];
				}
			}
		});
		return distances;
	}

	getAdvisedLocations() {
		let self = this;
		return self.advisedLocations;
	}

	getToldLocations() {
		let self = this;
		for (let key in self.advisedLocations) {
			if (!self.toldLocations[key]) {
				self.toldLocations[key] = [self.advisedLocations[key][0], self.advisedLocations[key][1]];
			}
		}
		return self.toldLocations;
	}

	getVisitedLocations() {
		let self = this;
		let visitedLocations = {};
		for (let key in self.advisedLocations) {
			if (self.advisedLocations[key][0] === true) {
				visitedLocations[key] = [self.advisedLocations[key][0], self.advisedLocations[key][1]];
			}
		}
		return visitedLocations;
	}
}

module.exports = UserLocation;