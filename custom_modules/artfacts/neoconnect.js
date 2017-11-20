'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./../mydebugger');
const neo4j = require('neo4j');

class NeoConnect {

	init() {
		let self = this;
		var path;
		if (process.env.IS_REMOTE) {
			path = process.env.ARTFACTS_REMOTE;
		} else {
			path = process.env.ARTFACTS_LOCAL;
		}
		self.db = new neo4j.GraphDatabase(path);
	}

	match(queryString, responseCallback) {
		let self = this;
		var tryCounter = 0;
		function tryAgain() {
			if (tryCounter < 100) {
				console.log('will try again...' + tryCounter);
				setTimeout(function() {
					execute();
				}, 5000);
			} else {

				responseCallback(null);
			}
			tryCounter++;
		}
		function execute() {
			self.db.cypher({
				query: queryString,
				params: {},
			}, function(err, response) {
				if (err) {
					//throw err;
					console.log('ERROR FROM NEO4J. Trying execute query ' + queryString);
					bug.error(err);
					tryAgain();
					//responseCallback(null);
				} else {
					try {
						console.log('Connection with Artfacts succeeded for ' + Object.keys(response[0])[0]);
					} catch(e) {
						//console.log(e);
						console.log('Connection with Artfacts succeeded!');
					}
					responseCallback(response);
				}
			});
		}
		execute();
	}
}

module.exports = NeoConnect;
