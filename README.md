# Jasine

Router for Node.js's HTTP(S) server, calls JS controller and [JSIN](https://github.com/Aequiternus/node-jsin) template using URL.

    $ npm install jasine
    $ ./node_modules/.bin/jasine [config.json]

or

    $ sudo npm install -g jasine
    $ jasine [config.json]

When you open any URL, Jasine first looks for `.js` file with same path in public directory:

    http://localhost:8008/boo  -> public_dir/boo.js
    http://localhost:8008/boo/ -> public_dir/boo/index.js
    http://localhost:8008/     -> public_dir/index.js

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

You can pass HTTP error code (404, 403, etc) to first argument of this function, or just throw this code.

    callback(404);
    // or
    throw 404;

Data object, passed in callback, will be passed to [JSIN](https://github.com/Aequiternus/node-jsin) template at same file path, but `.jsin` extension.

You can override template using property `template` of data object:

    callback(null, {
        template: "overrided_template", // instead of URI + .jsin
        boo: "booooo",
        foo: "fooooo"
    });

Next, Jasine will try to load `index` module in same directory and call exported method with name equal to basename of URL.

For example URL `http://localhost:8008/boo`: if module `public_dir/boo.js` not found, Jasine will try to call method `boo` of module `public_dir/index.js`:

    // public_dir/index.js
    module.exports.index = function(request, response, callback) {...}
    module.exports.boo = function(request, response, callback) {...}

If method was not found, next, Jasine will look for `.jsin` file at same path (`public_dir/boo.jsin`), and call it without data.

If you open URL ending with `.json` extension, Jasine will look for `.js` module or appropriate method in `index.js`, and response generated data as JSON, without using [JSIN](https://github.com/Aequiternus/node-jsin) template.

    http://localhost:8008/boo.json -> public_dir/boo.js or method boo in public_dir/index.js

Default config:

    {
        "protocol":         "http",
        "host":             "localhost",
        "port":             8008,
        "socket":           null,
        "logLevel":         "info",
        "error":            __dirname + "/public/",
        "dirPublic":        __dirname + "/public",
        "dirStatic":        __dirname + "/static",
        "uriStatic":        "/static/",
        "mimeDefault":      "text/html",
        "mimeJSON":         "text/json",
        "charset":          "utf-8",
        "maxPostSize":      1e6
    }

- `protocol`: `http`, `https`.
- `dirPublic`: where controllers/templates located. Should be overwritten.
- `uriStatic`: URL prefix for static files. To disable processing of static files set it to `null`. Will load files from `dirStatic` directory.
- `logLevel`: `debug`, `info`, `warn`, `error`.
- `error`: universal controller for all errors.
    Ending `/` means `/index` like in URL.
- `errorXXX`: controller/template for specified error code.
    Example: `"error404": "/path/to/error404"` will look for `/path/to/error404.js` and/or `/path/to/error404.jsin`.

To make AJAX requests, include compiled [JSIN](https://github.com/Aequiternus/node-jsin) templates and client side script `jasine.js` on html page. Call `jasine.init` at the end of body, or in window `onload` handler.

    <!doctype html>
    <html>
        <head>
            <meta charset="utf-8">
            <title>Test</title>
        </head>
        <body>

            <?js contents() ?>

            <script src="/static/jsin.compiled.js"></script>
            <script src="/static/jasine.js"></script>
            <script>
                jasine.init();
            </script>
        </body>
    </html>

By default all ajax requests attached to `body` element and excludes layout with name `layout`. You can set defaults, passing object with `element` and `excludeLayout` properties as argument to `jasine.init` method.

    <!doctype html>
    <html>
        <head>
            <meta charset="utf-8">
            <title>Test</title>
        </head>
        <body>

            <div id="my-main-content">
                <?js contents() ?>
            </div>

            <script src="/static/jsin.compiled.js"></script>
            <script src="/static/jasine.js"></script>
            <script>
                jasine.init({
                    element: "#my-main-content",
                    excludeLayout: [
                        "myMainLayout",
                        "layouts/additionalMainLayout"
                    ]
                });
            </script>
        </body>
    </html>

Init method adds `onclick` handler to all `a` with `href` starting with `/` and any elements with `data-href` attribute starting with `/`. The handler will add `.json` extension to URL and make `XMLHttpRequest`. Resulting HTML will be generated using JSON response and pre-compiled [JSIN](https://github.com/Aequiternus/node-jsin) templates. Generated HTML will replace inner contents of an element: body by default, or element defined in `init` method, or element defined in `data-element` attribute. You can specify element selector "by id" in `href` attribute, if actual link specified in `data-href` attribute. Also, `data-href` attribute has priority over `href` attribute of `a` element. In addition, you can specify comma-separated list of layout names to exclude in `data-exclude-layout` attribute.

    <a href="/mypage">
        Will load contents of "/mypage"
        to body or default element
        using "/mypage.json"
    </a>

    <a href="/mypage2" data-exclude-layout="MyPage2Layout, MyPage2Layout2">
        Will load contents of "/mypage2"
        to body or default element
        using "/mypage2.json"
        excluding layout "MyPage2Layout" and "MyPage2Layout2" while rendering
    </a>

    <a href="/mypage" data-href="/mypage-priority">
        Will load contents of "/mypage-priority"
        to body or default element
        using "/mypage-priority.json"
    </a>

    <div id="my-block">
        <a href="/ajax/myblock?boo=123" data-element="#my-block">
            Will load contents of "/ajax/myblock?boo=123"
            to div with id "my-block"
            using "/ajax/myblock.json?boo=123"
        </a>
    </div>

    <div id="another-block">
        <a href="#another-block" data-href="/ajax/anotherblock">
            Will load contents of "/ajax/anotherblock"
            to div with id "another-block"
            using "/ajax/anotherblock.json"
        </a>
    </div>

Clicking `a` with `href` starting with `/` will change history state for "back" button in browser. Clicking elements without `href` or `href` starting with `#` will not change history state. Method `jasine.init` adds `popstate` event listener of `window` to handle history "back" and "forward".

AJAX forms works in same manner as links, but with `action` and `data-action` attributes instead of `href` and `data-href`. At the moment AJAX forms works only with `application/x-www-form-urlencoded`. Forms with method `get` will change history state if `action` starts with `/`. Forms with method `post` or `action` starting with `#` will not change history state.

Examples in `test` directory. To start test server run command:

    $ npm test jasine

It will prepare test templates and start test server at `http://localhost:8008/`.

## License

Copyright © 2014 Maksim Krylosov <Aequiternus@gmail.com>

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
