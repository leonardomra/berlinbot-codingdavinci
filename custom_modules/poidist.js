/*jshint esversion: 6 */
/* jshint node: true */

const distance = require('gps-distance');
const fs = require('fs');
const Bug = require('./mydebugger');

module.exports = class POIDistance {

	init(listOfPOIs, distance) {
		let self = this;
		self._listOfPOIs = listOfPOIs;
		self.distance = distance;
	}

	calculateDistance(liveLocationCoord) {
		let self = this;
		let nearLocationsLarge = [];
		let nearLocationsSmall = [];
		for (var key in self._listOfPOIs) {
			var result = distance(liveLocationCoord[0], liveLocationCoord[1], self._listOfPOIs[key][0], self._listOfPOIs[key][1]);
			if (result < self.distance) {
				nearLocationsLarge.push([key,  self._listOfPOIs[key]]);
			}
			if (result < 0.03) {
				nearLocationsSmall.push([key,  self._listOfPOIs[key]]);
			}
		}
		return {distant: nearLocationsLarge, near: nearLocationsSmall};
	}
};