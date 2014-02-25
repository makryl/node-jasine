/* Compiled with jsinc v 0.1.10 */
(function(w){

if (!w.jsin) w.jsin = {compiled: {}};

w.jsin.compiled['click-me'] = function() {
with(this){with(__data){
print("<a href=\"#click-me\" data-href=\"/click-me?count=");
print(count + 1);
print("\">\n    click me: ");
print(count);
print("\n</a>\n\n");
try { if (clickmeController && clickmeTemplate) {;
print("    <h2>Click me controller: <code>public/click-me.js</code></h2>\n    <pre><code>");
printh(clickmeController);
print("</code></pre>\n    <h2>Click me template: <code>public/click-me.jsin</code></h2>\n    <pre><code>");
printh(clickmeTemplate);
print("</code></pre>\n");
}} catch (err) {};
}}
};

w.jsin.compiled['foo'] = function() {
with(this){with(__data){
layout('layout', function(){;
print("\n<h1>Test foo</h1>\n<p>\n    <a href=\"/\">main</a>\n    <a href=\"/foo\">foo</a>\n    <a href=\"/boo/\">boo index</a>\n    <a href=\"/boo/index-check\">boo index-check</a>\n<p>\n    ");
printh(foo);
print("\n\n<h2>Controller: <code>public/foo.js</code></h2>\n<pre><code>");
printh(codeController);
print("</code></pre>\n<h2>Template: <code>public/foo.jsin</code></h2>\n<pre><code>");
printh(codeTemplate);
print("</code></pre>\n<h2>Layout: <code>public/layout.jsin</code></h2>\n<pre><code>");
printh(codeLayout);
print("</code></pre>\n\n");
});
}}
};

w.jsin.compiled['index'] = function() {
with(this){with(__data){
layout('layout', function(){;
print("\n<h1>Test index ");
printh(boo);
print("</h1>\n<p>\n    <a href=\"/\">main</a>\n    <a href=\"/foo\">foo</a>\n    <a href=\"/boo/\">boo index</a>\n    <a href=\"/boo/index-check\">boo index-check</a>\n\n<p id=\"click-me\">\n");
include('click-me', {count: 0});
print("</p>\n\n<h2>Controller: <code>public/index.js</code></h2>\n<pre><code>");
printh(codeController);
print("</code></pre>\n<h2>Template: <code>public/index.jsin</code></h2>\n<pre><code>");
printh(codeTemplate);
print("</code></pre>\n<h2>Layout: <code>public/layout.jsin</code></h2>\n<pre><code>");
printh(codeLayout);
print("</code></pre>\n\n\n");
});
}}
};

w.jsin.compiled['layout'] = function() {
with(this){with(__data){
print("<!doctype html>\n<html>\n<head>\n    <meta charset=\"utf-8\">\n    <title>Test</title>\n    <link rel=\"stylesheet\" href=\"http://yandex.st/highlightjs/8.0/styles/default.min.css\">\n</head>\n<body>\n\n");
contents();
print("\n<!-- Jasine -->\n<script src=\"/static/jsin.compiled.js\"></script>\n<script src=\"/static/jasine.js\"></script>\n<script>\n    jasine.init();\n</script>\n\n<!-- Highlight.js -->\n<script src=\"http://yandex.st/highlightjs/8.0/highlight.min.js\"></script>\n<script>\n    hljs.initHighlightingOnLoad();\n\n    addEventListener('elementload', function(e) {\n        var blocks = e.target.querySelectorAll('pre code');\n        Array.prototype.forEach.call(blocks, hljs.highlightBlock);\n    }, false);\n</script>\n\n</body>\n</html>\n");
}}
};

w.jsin.compiled['boo/index'] = function() {
with(this){with(__data){
layout('layout', function(){;
print("\n<h1>Check index controller</h1>\n<p>\n    <a href=\"/\">main</a>\n    <a href=\"/foo\">foo</a>\n    <a href=\"/boo/\">boo index</a>\n    <a href=\"/boo/index-check\">boo index-check</a>\n<p>\n    ");
print(text);
print("\n\n<h2>Controller: <code>public/boo/index.js</code></h2>\n<pre><code>");
printh(codeController);
print("</code></pre>\n<h2>Template: <code>public/boo/index.jsin</code></h2>\n<pre><code>");
printh(codeTemplate);
print("</code></pre>\n<h2>Layout: <code>public/layout.jsin</code></h2>\n<pre><code>");
printh(codeLayout);
print("</code></pre>\n\n");
});
}}
};

var compiled = jsin.compiled;

function include(template, data, callback) {
    template = template.replace(/\.jsin$/, '');

    if ('function' === typeof data) {
        callback = data;
        data = null;
    }

    try {
        if (!compiled[template]) {
            throw new Error('Template not compiled: ' + template);
        } else if ('function' !== typeof compiled[template]) {
            throw compiled[template];
        } else {
            var ctx = new context(data, callback);
            compiled[template].call(ctx);
            return ctx.return();
        }
    } catch (err) {
        if (callback) {
            callback(err);
        }
    }
}

function context(data, callback) {
    this.__data     = data;
    this.__callback = callback;
    this.__result   = [''];
    this.__current  = 0;
    this.__waiting  = 1;
    this.__contents = -1;
}

context.prototype.print = function(string) {
    this.__result[this.__current] += string;
};

var ehs = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
};

function eh(s) {
    return ehs[s] || s;
}

context.prototype.printh = function(string) {
    this.print(string.replace(/[&<>"]/g, eh));
};

var ess = {
    "\\": "\\\\",
    "\n": "\\n",
    "\r": "\\r",
    '"': '\\"',
    "'": "\\'"
};

function es(s) {
    return ess[s] || s;
}

context.prototype.prints = function(string) {
    this.print(string.replace(/[\\\n\r"']/g, es));
}

context.prototype.include = function(template, data) {
    if (!data) {
        data = this.__data;
    }

    var self = this;
    var inc = this.__hold();

    ++this.__waiting;
    include(template, data, function(err, res) {
        if (err) {
            if (self.__callback) {
                self.__callback(err);
            }
        } else {
            self.__result[inc] = res;
            self.return();
        }
    });
};

context.prototype.layout = function(template, data, callback) {
    if (!callback) {
        callback = data;
        data = this.__data;
    }

    if (data.excludeLayout && -1 !== data.excludeLayout.indexOf(template)) {
        callback();
        return;
    }

    var self = this;
    var bgn = this.__hold();
    callback();
    var end = this.__hold();

    ++this.__waiting;
    include(template, data, function(err, res) {
        if (err) {
            if (self.__callback) {
                self.__callback(err);
            }
        } else {
            self.__result[bgn] = res[0];
            self.__result[end] = res[1];
            self.return();
        }
    });
};

context.prototype.contents = function() {
    this.__contents = ++this.__current;
    this.__result[this.__current] = '';
};

context.prototype.return = function() {
    if (0 === --this.__waiting) {
        var res;
        if (this.__contents >= 0) {
            res = [
                this.__result.splice(0, this.__contents).join(''),
                this.__result.join('')
            ];
        } else {
            res = this.__result.join('');
        }
        if (this.__callback) {
            this.__callback(null, res);
        }
        return res;
    }
};

context.prototype.__hold = function() {
    var ph = ++this.__current;
    this.__result[++this.__current] = '';
    return ph;
};

w.jsin.include = include;
w.jsin.context = context;

})(window);
