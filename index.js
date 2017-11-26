'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./custom_modules/mydebugger');
const App = require('./custom_modules/app');
const Telegraf = require('telegraf');
const API_TOKEN = process.env.TELEGRAM_TOKEN || '';
const PORT = process.env.PORT || 3000;
const URL = process.env.URL;
const telegraf = new Telegraf(API_TOKEN);
const app = new App();

const projectsToLoad = [
	//'59faeeb23dcf640fb556b5e5',
	//'5a17edfb09a3ae5bcadea2bb',
	//'5a19883d09a3ae5bcadea2bd'
];

console.log(`${URL}/bot${API_TOKEN}`);
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