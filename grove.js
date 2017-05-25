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

var mraa = require('mraa');
var mic = require("jsupm_mic");

// devices
var sound, screen, ctx;

// pins
var soundPin = 0,
    i2cBus = 6;

// Initialize the seeedstudio hardware devices
exports.init = function(config) {
  if (config.platform == "firmata") {
    // open connection to firmata
    mraa.addSubplatform(mraa.GENERIC_FIRMATA, "/dev/ttyACM0");

    soundPin += 512;
    i2cBus = 512;
  }

  sound = new mic.Microphone(soundPin),
  screen = new (require("jsupm_jhd1313m1").Jhd1313m1)(i2cBus, 0x3E, 0x62);

  ctx = new mic.thresholdContext();
  ctx.averageReading = 0;
  ctx.runningAverage = 0;
  ctx.averagedOver = 2;
}

// Colors used for the RGB LED
// Colors used for the RGB LCD display
var COLORS = {
  blue: [0, 0, 255],
  red: [255, 0, 0],
  white: [255, 255, 255],
  black: [0, 0, 0]
};

// Sets the background color on the RGB LED
exports.color = function(string) {
  screen.setColor.apply(screen, COLORS[string] || COLORS.white);
}

// Displays a message on the RGB LED
exports.message = function(string, line) {
  // pad string to avoid display issues
  while (string.length < 16) { string += " "; }

  screen.setCursor(line || 0, 0);
  screen.write(string);
}

// reads audio level from mic
exports.checkNoise = function(threshold) {
  var buffer = new mic.uint16Array(128),
      len = sound.getSampledWindow(2, 128, buffer);

  if (!len) { return; }

  var noise = sound.findThreshold(ctx, threshold, buffer, len);
  return noise;
}
