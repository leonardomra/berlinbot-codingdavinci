'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const neo4j = require('neo4j');
const Debug = require('debug');

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
		Debug(queryString);
		this.db.cypher({
			query: queryString,
			params: {},
		}, function(err, response) {
			if (err) {
				//throw err;
				Debug(err);
				responseCallback(null);
			} else {
				responseCallback(response);

			}
		});
	}

}

module.exports = NeoConnect;
