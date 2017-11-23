'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./custom_modules/mydebugger');
const App = require('./custom_modules/app');
const Telegraf = require('telegraf');
const API_TOKEN = process.env.TELEGRAM_TOKEN || '';
const PORT = process.env.PORT || 3000;
const URL = 'https://cc40963f.ngrok.io'; //process.env.URL || 'https://your-heroku-app.herokuapp.com';
const telegraf = new Telegraf(API_TOKEN);
const app = new App();

const projectsToLoad = [
	'59faeeb23dcf640fb556b5e5',
	'5a154a7909a3ae5bcadea2ba'
];

telegraf.telegram.setWebhook(`${URL}/bot${API_TOKEN}`);
telegraf
	.catch((err) => {
		bug.error('Ooops', err);
	});
app.telegraf = telegraf;
app.hook = `/bot${API_TOKEN}`;
app.port = PORT;
app.telegraf.startWebhook(app.hook, null, app.port);
app.init(projectsToLoad);