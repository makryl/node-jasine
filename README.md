## DEVELOPEMENT VERSION, DON'T USE IT ATM

# Jasine

Router for Node.js's HTTP(S) server, calls JS controller and [JSIN](https://github.com/Aequiternus/node-jsin) template using URL.

    $ npm install jasine
    $ npm start

When you open any URL, Jasine first looks for `.js` file with same path in working directory:

    http://localhost:8008/boo       -> public_dir/boo.js
    http://localhost:8008/boo/      -> public_dir/boo/index.js
    http://localhost:8008/          -> public_dir/index.js

This `.js` file should be node module exporting one function:

    module.exports = function(request, response, callback) {
        if (1 !== 1) {
            callback(new Error("Something went wrong: 1 !== 1"));
        } else {
            callback(null, {
                boo: "booooo",
                foo: "fooooo"
            });
        }
    };

Data object, passed in callback, will be passed to [JSIN](https://github.com/Aequiternus/node-jsin) template at same file path, but `.jsin` extension.

If `.js` file wasn't found, Jasine will looks for `.jsin` file at same path, and call it without data.

If you open URL ending with `.json` extension, Jasine will look for `.js` module at same path, and response generated data as json, without using [JSIN](https://github.com/Aequiternus/node-jsin) template.

    http://localhost:8008/boo.json  -> public_dir/boo.js

You can pass path to config file in JSON format as argument to server start. Default config:

    {
        "protocol":     "http",
        "host":         "localhost",
        "port":         "8008",
        "logLevel":     "info",
        "directory":    "./pub",
        "error":        "./pub/",
        "mimeDefault":  "text/html",
        "mimeJSON":     "text/json",
        "charset":      "UTF-8"
    }

- `protocol`: `http`, `https`.
- `directory`: where controllers/templates placed. Should be overwritten.
- `logLevel`: `debug`, `info`, `warn`, `error`.
- `error`: universal controller for all errors.
    Ending `/` means `/index` like in URL.
- `errorXXX`: controller/template for specified error code.
    Example: `"error404": "/path/to/error404"` will look for `/path/to/error404.js` and/or `/path/to/error404.jsin`.

## License

Copyright © 2014 Maksim Krylosov <Aequiternus@gmail.com>

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
