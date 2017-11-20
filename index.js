'use strict';
/*jshint esversion: 6 */
/* jshint node: true */

const bug = require('./custom_modules/mydebugger');
//
//const Express = require('express');
const App = require('./custom_modules/app');
const Telegraf = require('telegraf');
//const Telegram = require('telegram-node-bot');
//
const API_TOKEN = process.env.TELEGRAM_TOKEN || '';
const PORT = process.env.PORT || 3000;
const URL = 'https://6c5e0019.ngrok.io'; //process.env.URL || 'https://your-heroku-app.herokuapp.com';

//
const telegraf = new Telegraf(API_TOKEN);
telegraf.telegram.setWebhook(`${URL}/bot${API_TOKEN}`);
telegraf.catch((err) => {
  console.log('Ooops', err);
});


//telegraf.command('help', (ctx) => ctx.reply('Try send a sticker!'));
//telegraf.hears('hi', (ctx) => ctx.reply('Hey there!'));
//telegraf.hears(/buy/i, (ctx) => ctx.reply('Buy-buy!'));
//telegraf.on('sticker', (ctx) => ctx.reply('👍'));
//telegraf.startWebhook(`/bot${API_TOKEN}`, null, PORT);




var app = new App();
//app.telegram = telegram;
app.telegraf = telegraf;
app.hook = `/bot${API_TOKEN}`;
app.port = PORT;
app.init();

