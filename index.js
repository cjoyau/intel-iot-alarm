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

// The program is using the Node.js built-in `fs` module
// to load the config.json and any other files needed
var fs = require("fs");

// The program is using the Node.js built-in `path` module to find
// the file path to needed files on disk
var path = require("path");

// Load configuration data from `config.json` file. Edit this file
// to change to correct values for your configuration
var config = JSON.parse(
  fs.readFileSync(path.join(__dirname, "config.json"))
);

var datastore = require("./datastore");
var services = require("./services");

var TIMEOUT = 30 * 1000;

var CODE = config.CODE || "1234";

var VALIDATED = false,
    ALARM_IN_PROGRESS = false,
    ALARM_DISABLED = false,
    BLOCK_INPUT = false;

// Initialize the hardware for whichever kit we are using
var board;
if (config.kit) {
  board = require("./" + config.kit + ".js");
} else {
  board = require('./grove.js');
}
board.init(config);

// Store record in the remote datastore and/or mqtt server
// when access control event has occurred
function log(event) {
  var msg = new Date().toISOString() + " " + event;
  console.log(msg);

  var payload = { value: msg };
  datastore.log(config, payload);
  services.log(config, payload);
}

// Turns on the alarm
function startAlarm() {
  log("alarm-starting");
  ALARM_IN_PROGRESS = true;

  board.color("red");
  board.message("ALARM");
}

// Turns off the alarm
function stopAlarm() {
  log("alarm-stopping");
  ALARM_IN_PROGRESS = false;
}

// Check for the alarm activation state
function check(interval, timeout) {
  if (VALIDATED) {
    log("validated-entry");
    VALIDATED = false;

    if (ALARM_IN_PROGRESS) { stopAlarm(); }
    if (timeout) { clearTimeout(timeout); }

    if (ALARM_DISABLED) {
      log("alarm-disabled");
      board.color("black");
      board.message("");
    } else {
      BLOCK_INPUT = true;
      log("alarm-waiting");
      board.color("white");
      board.message("Waiting 30s");
      if (interval) { clearInterval(interval); }
      setTimeout(lookForNoise, TIMEOUT);
    }
  }
}

// Noise detected, listen for code and set off alarm
// if we don't get it in time
function alert() {
  log("noise-detected");

  board.color("blue");
  board.message("ALERT");

  var timeout = setTimeout(startAlarm, TIMEOUT);

  // check if code was entered
  var interval = setInterval(function() {
    check(interval, timeout);
  }, 100);
}

// Check the noise sensor every 20 millisecond
function lookForNoise() {
  var prev = false,
      interval;

  BLOCK_INPUT = false;
  log("looking-for-noise");

  board.color("white");
  board.message("READY");

  interval = setInterval(function() {
    check();
    var noise = board.checkNoise(config.NOISE_THRESHOLD);

    if (!prev && noise && !ALARM_IN_PROGRESS && !ALARM_DISABLED) {
      console.log("Noise value: ", noise);
      clearInterval(interval);
      alert();
    }

    prev = noise;
  }, 20);
}

// Starts the built-in web server for the web page
// used to enter code after triggering the noise sensor
function server() {
  var app = require("express")();

  // Serve up the main web page used to enter code after triggering
  // noise sensor
  function index(req, res) {
    function serve(err, data) {
      if (err) { return console.error(err); }
      res.send(data);
    }

    fs.readFile(path.join(__dirname, "index.html"), {encoding: "utf-8"}, serve);
  }

  // Called by the web page to submit the access code and "defuse"
  // the alarm system
  function defuse(req, res) {
    if (!BLOCK_INPUT) {
      if (req.query.code === CODE) { VALIDATED = true; ALARM_DISABLED = false; }
      if (req.query.code !== CODE) { log("invalid-code " + req.query.code); }
    }
    res.send("");
  }

  // Called by the web page to submit the access code and "disable"
  // the alarm system
  function disable(req, res) {
    if (!BLOCK_INPUT) {
      if (req.query.code === CODE) { VALIDATED = true; ALARM_DISABLED = true; }
      if (req.query.code !== CODE) { log("invalid-code " + req.query.code); }
    }
    res.send("");
  }

  // styles for the web page
  function styles(req, res) {
    res.sendFile(path.join(__dirname, "styles.css"));
  }

  app.get("/", index);
  app.get("/styles.css", styles);
  app.get("/alarm", defuse);
  app.get("/disable", disable);

  app.listen(3000);
}

// The main function calls `server()` to start up
// the built-in web server used to enter the access code
// after triggering the alarm.
// It also calls the `lookForNoise()` function which monitors
// the noise sensor.
function main() {
  server();
  lookForNoise();
}

main();
