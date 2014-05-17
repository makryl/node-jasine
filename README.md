# Jasine

Router for Node.js's HTTP(S) server, calls JS controller and [JSIN](https://github.com/Aequiternus/node-jsin) template using URL.

## Basic

Install:

    $ npm install jasine

Start test server (examples in `node_modules/jasine/test` directory):

    $ npm test jasine

To stop test server use `Ctrl+C`.

Live example, where I'm using and testing Jasine server at the moment: [kawaiinyan.com](http://kawaiinyan.com/).

Start server:

    $ node node_modules/jasine/server config.json

Stop server:

    $ node node_modules/jasine/server config.json stop

Graceful reload server:

    $ node node_modules/jasine/server config.json reload

Kill server:

    $ node node_modules/jasine/server config.json kill

Default config:

    {
        // Server settings
        "protocol":         "http", // http or https
        "host":             "localhost",
        "port":             8008,
        "socket":           null, // UNIX socket instead of host and port
        "workers":          null, // Default: count of CPUs
        "group":            null, // Default: nobody
        "user":             null, // Default: nobody
        "daemon":           false, // In most cases you should set it to TRUE, don't forget to set "pid" and "log" also
        "pid":              null, // Required for stop, reload and kill commands
        "log":              null,
        "logError":         null, // Default: same as "log"

        // Router settings
        "logLevel":         "info", // debug, info, warn, error
        "init":             null, // Module required before server starts (main application module)
        "error":            __dirname + "/public/", // Universal controller for all errors
        // Use errorXXX for specified error code.
        // Example: "error404": "/path/to/error404" will look for /path/to/error404.js and/or /path/to/error404.jsin.
        "dirRoot":          __dirname, // Should be overridden
        "dirPublic":        "public", // Where controllers and templates located
        "dirStatic":        "static", // Where static files located
        "uriStatic":        "/static/", // URL prefix for static files
        "mimeDefault":      "text/html",
        "mimeJSON":         "text/json",
        "charset":          "utf-8"
    }

## Server side

When you open any URL, Jasine first looks for `.js` file with same path in public directory:

    http://localhost:8008/boo  -> public/boo.js
    http://localhost:8008/boo/ -> public/boo/index.js
    http://localhost:8008/     -> public/index.js

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

Also you can set `statusCode` of `response`:

    response.statusCode = 404;

Data object, passed in callback, will be passed to [JSIN](https://github.com/Aequiternus/node-jsin) template at same file path, but `.jsin` extension.

You can override template using property `template` of data object:

    callback(null, {
        template: "overrided_template", // instead of URI + .jsin
        boo: "booooo",
        foo: "fooooo"
    });

If `.js` file was not found at requested path in public dir, next, Jasine will try to load `index` module in same directory and call exported method with name equal to basename of URL.

For example URL `http://localhost:8008/boo`: if module `public/boo.js` not found, Jasine will try to call method `boo` of module `public/index.js`:

    // public/index.js
    module.exports.index = function(request, response, callback) {...}
    module.exports.boo = function(request, response, callback) {...}

If method was not found, next, Jasine will look for `router` method in `index` module and call this method with basename of URL as additional argument.

For example URL `http://localhost:8008/boo`: if module `public/boo.js` not found, method `boo` in `public/index.js` not found also, Jasine will try to call method `router` of module `public/index.js`:

    // public/index.js
    module.exports.router = function(request, response, basename, callback) {
        // basename == 'boo'
        ...
    }

If method was not found, next, Jasine will look for `.jsin` file at same path (`public/boo.jsin`), and call it without data.

If you open URL ending with `.json` extension, Jasine will look for `.js` module or appropriate method in the same way as explained above, and response generated data as JSON, without using [JSIN](https://github.com/Aequiternus/node-jsin) template.

    http://localhost:8008/boo.json -> public/boo.js or method boo in public/index.js

## Client side

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

By default all AJAX requests attached to `body` element and excludes layout with name `layout`. You can set defaults, passing object with `element` and `excludeLayout` properties as argument to `jasine.init` method. URI for static files (by default `/static/`) ignored by Jasine, you can change default using property `uriStatic`.

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
                    ],
                    uriStatic: "/my_static/"
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

AJAX forms works in same manner as links, but with `action` and `data-action` attributes instead of `href` and `data-href`. AJAX forms supports next `enctype`: `application/x-www-form-urlencoded`, `multipart/form-data` (with file upload support) and `text/json`. Forms with method `get` will change history state if `action` starts with `/`. Forms with method `post` or `action` starting with `#` will not change history state.

You can make AJAX request using method `jasine.load`. This method has one argument - options object:

    jasine.load({
        url: '/any_url', // same as "href" or "action"
        dataUrl: '/any_url', // same as "data-href" or "data-action"
        element: '#any-element', // same as "data-element"
        excludeLayout: 'layoutToExclude', // array or string: layouts to exclude, same as "data-exclude-layout"
        post: 'post data', // post data
        postType: 'mime/type', // mime type of post data
        onelementbeforeload: function(event){}, // event listener for "elementbeforeload"
        onelementload: function(event){}, // event listener for "elementload"
        onelementafterload: function(event){} // event listener for "elementafterload"
    });

Jasine AJAX requests has three events:

- `elementbeforeload` - fires before request.
- `elementload` - fires after response received and before HTML and history were changed.
- `elementafterload` - fires after response received and HTML and history were changed.

These events has additional properties:

- `options` - Jasine options of request.
- `request` - current `XMLHttpRequest`.
- `data` - received JSON.
- `error` - error occurred during request.

## License

Copyright © 2014 Maksim Krylosov <Aequiternus@gmail.com>

This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
