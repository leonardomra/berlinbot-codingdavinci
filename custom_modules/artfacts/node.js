'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const fs = require('fs');
const NeoConnect = require('./../artfacts/neoconnect');
const Bug = require('./../mydebugger');

class Node {

	init() {
		this.neo = new NeoConnect();
		this.neo.init();
	}

	//*******************************************/
	//
	// Subject
	//
	//*******************************************/

	getSubjectEntities(chunkId, responseCallback) {
		if (chunkId === undefined) {
			return responseCallback('ERROR: no chunk id defined :(');
		}
		let queryString = '' +
		'match (kc:KNOWLEDGE_CHUNK)-[:HAS_ENTITY]-(ke:KNOWLEDGE_ENTITY) ' +
		'where kc.chunk_id = \'' + chunkId + '\' and ke.is_subject = \'false\' ' +
		'return ke';
		this.neo.match(queryString, function(response) {
			var _response = [];
			response.forEach(function(entity) {
				_response.push(entity.ke.properties);
			});
			return responseCallback(_response);
		});
	}

	getSubjectQuantifier(chunkId, kind, responseCallback) {
		if (chunkId === undefined) {
			return responseCallback('ERROR: no chunk id defined :(');
		}
		let queryString = '' +
		'match (kc:KNOWLEDGE_CHUNK)-[:HAS_ENTITY]-(ke:KNOWLEDGE_ENTITY)-[:HAS_QUANTIFIER]-(qt) ' +
		'where kc.chunk_id = \'' + chunkId + '\' and ke.is_subject = \'true\' and qt.type = \'' + kind + '\' ' +
		'return qt.value';
		this.neo.match(queryString, function(response) {
			let _response;
			try {
				_response = response[0]['qt.value'];
			} catch(e) {
				//Bug.error(e);
			}
			return responseCallback(_response);
		});
	}

	getSubjectKind(chunkId, responseCallback) {
		if (chunkId === undefined) {
			return responseCallback('ERROR: no chunk id defined :(');
		}
		let queryString = 'match (kc:KNOWLEDGE_CHUNK)-[:HAS_ENTITY]-(ke:KNOWLEDGE_ENTITY) ' +
		'where kc.chunk_id = \'' + chunkId + '\' and ke.is_subject = \'true\' ' +
		'return ke.kind';
		this.neo.match(queryString, function(response) {
			let _response = response[0]['ke.kind'];
			return responseCallback(_response);
		});
	}

	getSubject(chunkId, responseCallback) {
		if (chunkId === undefined) {
			return responseCallback('ERROR: no chunk id defined :(');
		}
		let queryString = 'match (kc:KNOWLEDGE_CHUNK) where kc.chunk_id = \'' + chunkId + '\' return kc';
		this.neo.match(queryString, function(response) {
			let _response = response[0].kc.properties;
			return responseCallback(_response);
		});
	}

	//*******************************************/
	//
	// Entity
	//
	//*******************************************/

	getEntity(entity_id, responseCallback) {
		if (entity_id === undefined) {
			return responseCallback('ERROR: no entity id defined :(');
		}
		let queryString = 'match (ke:KNOWLEDGE_ENTITY) where ke.entity_id = \'' + entity_id + '\' return ke';
		this.neo.match(queryString, function(response) {
			let _response = response[0].ke.properties;
			return responseCallback(_response);
		});
	}

	getEntityQuantifiers(entity_id, responseCallback) {
		if (entity_id === undefined) {
			return responseCallback('ERROR: no entity id defined :(');
		}
		let queryString = 'match (ke:KNOWLEDGE_ENTITY)-[r:HAS_QUANTIFIER]-(qt:QUANTIFIER) where ke.entity_id = \'' + entity_id + '\' return qt';
		this.neo.match(queryString, function(response) {
			var _response = [];
			response.forEach(function(quantifier) {
				_response.push(quantifier.qt.properties);
			});
			return responseCallback(_response);
		});
	}

	//*******************************************/
	//
	// Quantifier
	//
	//*******************************************/

	getQuantifier(quantifier_id, responseCallback) {
		if (quantifier_id === undefined) {
			return responseCallback('ERROR: no quantifier id defined :(');
		}
		let queryString = 'match (qt:QUANTIFIER) where qt.quantifier_id = \'' + quantifier_id + '\' return qt';
		this.neo.match(queryString, function(response) {
			let _response = response[0].qt.properties;
			return responseCallback(_response);
		});
	}

	//*******************************************/
	//
	// Person
	//
	//*******************************************/

	getPerson(id, responseCallback) {
		if (id === undefined) {
			return responseCallback('ERROR: no person id defined :(');
		}
		let queryString = 'match (person:PERSON) ' +
		'where id(person)=' + id + ' ' +
		'return person ORDER BY upper(person.name) ASC';
		this.neo.match(queryString, function(response) {
			let _response = {};
			if (response !== null) {
				_response = response[0].person.properties;
			}
			return responseCallback(_response);
		});
	}

	getPersonAggregates(id, responseCallback) {
		if (id === undefined) {
			return responseCallback('ERROR: no person id defined :(');
		}
		let queryString = 'match (person:PERSON)-[r]->(aggregate) ' +
		'where id(person)=' + id + ' ' +
		'return {aggregate: aggregate, rel: type(r)} as aggregate';
		this.neo.match(queryString, function(response) {
			let _response = [];
			response.forEach(function(aggregate) {
				if (aggregate !== null) {
					_response.push(aggregate.aggregate);
				}
			});
			return responseCallback(_response);
		});
	}

	getPersons(string, responseCallback) {
		if (string === undefined) {
			return responseCallback('ERROR: no quantifier id defined :(');
		}
		let queryString = 'match (person:PERSON) ' +
		//'where person.nachname =~ \'(?i)^' + string + '.*\' or person.vorname =~ \'(?i)^' + string + '.*\' or person.name =~ \'(?i)^' + string + '.*\' ' +
		'where person.nachname =~ \'(?i)^' + string + '.*\' or person.vorname =~ \'(?i)^' + string + '.*\' or person.name =~ \'(?i)^' + string + '\' ' +
		'return id(person)';
		this.neo.match(queryString, function(response) {
			let _response = [];
			response.forEach(function(person) {
				_response.push(person['id(person)']);
			});
			return responseCallback(_response);
		});
	}



	//*******************************************/
	//
	// DialogFlow
	//
	//*******************************************/

	static getAllLocations(responseCallback) {
		let queryString = 'match (location:LOCATION)-[:lived_at]-(person:PERSON) where location.instance = "Generic Address" WITH location, collect(person.name) AS people return {address: location.pos,  gps: split(location.gps, ","), victims: people} as obj';
		let neo = new NeoConnect();
		neo.init();
		neo.match(queryString, function(response) {
			let locations = {};
			let victims = {};
			response.forEach(function(location) {
				locations[location.obj.address] = location.obj.gps;
				victims[location.obj.address] = location.obj.victims;
			});
			let _response = {locations: locations, victims: victims};
			return responseCallback(_response);
		});
	}

	static getAllPersonsNames(responseCallback) {
		let queryString = 'match (person:PERSON) return person.vorname as name union all match (person:PERSON) with person.nachname as name return distinct name';
		let neo = new NeoConnect();
		neo.init();
		neo.match(queryString, function(response) {
			let _response = [];
			response.forEach(function(person) {
				_response.push(person.name);
			});
			_response = uniq(_response);
			let stream = fs.createWriteStream('./data/names.txt');
			stream.once('open', function(fd) {
				_response.forEach( function(line, index) {
					let _line = line.replace(/ *\([^)]*\) */g, '');
					_line = _line.replace(/„/g, '');
					_line = _line.replace(/“/g, '');
					stream.write('"' + _line + '","' + _line.toLowerCase() + '"\n');
				});
				stream.end();
			});
			return responseCallback(_response);
		});
		function uniq(a) {
			var prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];

			return a.filter(function(item) {
				var type = typeof item;
				if(type in prims)
					return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
				else
					return objs.indexOf(item) >= 0 ? false : objs.push(item);
			});
		}
	}

    //*******************************************/
	//
	// Project
	//
	//*******************************************/

	/*
	getStoryFactIdsForProjectId(id, responseCallback) {
		if (id === undefined) {
			return responseCallback('ERROR: no person id defined :(');
		}
		let queryString = 'match (project:PROJECT)-->(n:KNOWLEDGE_CHUNK)-->(e:KNOWLEDGE_ENTITY)-->(q:QUANTIFIER) ' +
		'where project.project_id = \'' + id + '\' and q.type = \'instantiation\' and q.value = \'StoryFact\' ' +
		'return n.chunk_id';
		this.neo.match(queryString, function(response) {
			let _response = [];
			if (response !== null) {
				response.forEach( function(element) {
					_response.push(element['n.chunk_id']);
				});
			}
			return responseCallback(_response);
		});
	}

	getActorIdsForProjectId(id, responseCallback) {
		if (id === undefined) {
			return responseCallback('ERROR: no person id defined :(');
		}
		let queryString = 'match (project:PROJECT)-->(n:KNOWLEDGE_CHUNK)-->(e:KNOWLEDGE_ENTITY)-->(q:QUANTIFIER) ' +
		'where project.project_id = \'' + id + '\' and q.type = \'instantiation\' and q.value = \'Actor\' ' +
		'return n.chunk_id';
		this.neo.match(queryString, function(response) {
			let _response = [];
			if (response !== null) {
				response.forEach( function(element) {
					_response.push(element['n.chunk_id']);
				});
			}
			return responseCallback(_response);
		});
	}
	*/

	getInstanceForProjectId(instance, proejctId, responseCallback) {
		if (proejctId === undefined || instance === undefined) {
			return responseCallback('ERROR: no instance or id defined :(');
		}
		let queryString = 'match (project:PROJECT)-->(n:KNOWLEDGE_CHUNK)-->(e:KNOWLEDGE_ENTITY)-->(q:QUANTIFIER) ' +
		'where project.project_id = \'' + proejctId + '\' and q.type = \'instantiation\' and q.value = \'' + instance + '\' ' +
		'return n.chunk_id';
		this.neo.match(queryString, function(response) {
			let _response = [];
			if (response !== null) {
				response.forEach( function(element) {
					_response.push(element['n.chunk_id']);
				});
			}
			return responseCallback(_response, instance);
		});
	}

}

module.exports = Node;