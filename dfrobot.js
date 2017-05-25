/*
* Copyright (c) 2015 - 2016 Intel Corporation.
*
* Permission is hereby granted, free of charge, to any person obtaining
* a copy of this software and associated documentation files (the
* "Software"), to deal in the Software without restriction, including
* without limitation the rights to use, copy, modify, merge, publish,
* distribute, sublicense, and/or sell copies of the Software, and to
* permit persons to whom the Software is furnished to do so, subject to
* the following conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
* MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
* LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
* OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
* WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

"use strict";

var exports = module.exports = {};

var mraa = require("mraa");
var mic = require("jsupm_mic");

// Initialize the hardware devices
var sound, ctx, screen;

exports.init = function(config) {
  if (config.platform == "firmata") {
    // open connection to firmata
    mraa.addSubplatform(mraa.GENERIC_FIRMATA, "/dev/ttyACM0");

    sound = new mic.Microphone(3 + 512); // A3
    screen = new (require("jsupm_lcdks").LCDKS)(520, 521, 516, 517, 518, 519, 512);
  } else {
    sound = new mic.Microphone(3); // A3
    screen = new (require("jsupm_lcdks").LCDKS)(8, 9, 4, 5, 6, 7, 0);
  }

  // Initialize the sound sensor
  ctx = new mic.thresholdContext();
  ctx.averageReading = 0;
  ctx.runningAverage = 0;
  ctx.averagedOver = 2;

  return;
}

// Cannot set the background color on this LCD display
exports.color = function(string) {
  return;
}

// Displays a message on the LCD
exports.message = function(string, line) {
  // pad string to avoid display issues
  while (string.length < 16) { string += " "; }

  screen.setCursor(line || 0, 0);
  screen.write(string);
}

// reads audio level from mic
exports.checkNoise = function(t) {
  var buffer = new mic.uint16Array(128),
      len = sound.getSampledWindow(2, 128, buffer);

  if (!len) { return 0; }

  var noise = sound.findThreshold(ctx, t, buffer, len);
  return noise;
}
