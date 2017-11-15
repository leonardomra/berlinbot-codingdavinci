'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const Bug = require('./mydebugger');
const Part = require('./part');
const Bot = require('./artfacts/story/Bot');

class App {

	init() {
		

		var story = new Bot();
		story.init();

		//var part = new Part();
		//part.init();
	}

}

module.exports = App;

/*
var kc = new KnowledgeChunk();
kc.loadSubjectWithID('0b881001-bfbd-11e7-9172-836b4e593e9b', function(o) {
	kc.getInformationAboutSubject();
	kc.knowledgeEntities.forEach(function(entity) {
		var aggregate = {edge: undefined, node: undefined};
		entity.quantifiers.forEach(function(quantifier) {
			if (quantifier.type === 'class' && quantifier.instruction === 'id') {
				var s = new KnowledgeChunk();
				s.loadSubjectWithID(quantifier.value, function(){});
				aggregate.node = s;
			}
			if (quantifier.type === 'string') {
				aggregate.edge = quantifier.value;
			}
		});
		kc.aggregates.push(aggregate);
	});
});
*/
/*
var person = new Person();
person.loadPersonWithID('53370', function(p) {
	console.log(p);
});
*/
/*
var persons = new Persons();
persons.loadPersonsWithMatchingString('Schlesinger', function(p) {
	p.filterPersonsAccodingToBirhday('1940', function(result) {

	});
	/*
	p.persons.forEach( function(person, index) {
		console.log(person.name);
	});
	*/
//});
