'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

var neo4j = require('neo4j');

class NeoConnect {
	constructor() {
		var path;
		if (process.env.IS_REMOTE) {
			path = process.env.ARTFACTS_REMOTE;
		} else {
			path = process.env.ARTFACTS_LOCAL;
		}
		this.db = new neo4j.GraphDatabase(path);
	}

	match(queryString, responseCallback) {
		console.log(queryString);
		this.db.cypher({
			query: queryString,
			params: {},
		}, function(err, response) {
			if (err) {
				//throw err;
				console.log(err);
				responseCallback(null);
			} else {
				//console.log(response);
				responseCallback(response);

			}
		});
	}

}

module.exports = NeoConnect;
