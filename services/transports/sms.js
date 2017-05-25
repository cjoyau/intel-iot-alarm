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

'use strict';

// The program is using the `superagent` module
// to make the remote calls to the sms service
var request = require("superagent");

function publish(config, payload) {

    if (!config.services && !config.services.sms) {
        return;
    }

    const sms_url = config.services.sms.url;
    const sms_user = config.services.sms.user;
    const sms_pass = config.services.sms.pass;

    if (!sms_url || !sms_user || !sms_pass) {
        console.error("Missing required SMS config values.");
        return;
    }

    function callback(err, res) {
        if (err) {
            return console.error("err:", err);
        } else {
            return console.log("Published to SMS service:", payload);
        }
    }

    console.log("Publishing to SMS service.");

    request
        .get(sms_url)
        .query({user: sms_user})
        .query({pass: sms_pass})
        .query({msg: payload.value})
        .end(callback);

}

module.exports = {
    publish: publish,
}
