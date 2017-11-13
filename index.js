'use strict';
/*jshint esversion: 6 */
/* jshint node: true */
//var dotent = require('dotenv').config();

const Part = require('./custom_modules/part');
//const Story = require('./custom_modules/story');

console.log(process.env.IS_ENV_WORKING);

var part = new Part();
part.initTelegram();