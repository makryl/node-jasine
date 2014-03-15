(function(w){

    if (!w.jasine) {
        w.jasine = {
            init: init,
            load: load
        };
    }

    var options = {
        element: 'body',
        excludeLayout: 'layout'
    };

    function init(opts) {
        for (var i in opts) {
            options[i] = opts[i];
        }
        initElement(document.body);
        addEventListener('popstate', popstate, false);

        if (w.history && w.history.replaceState) {
            history.replaceState({
                url: location.toString(),
                element: options.element,
                excludeLayout: options.excludeLayout
            }, document.title, location);
        }
    }

    function initElement(element) {
        var links = element.querySelectorAll('a[href^="/"],*[data-href^="/"]');
        for (var i = 0, l = links.length; i < l; i++) {
            links[i].addEventListener('click', open, false);
        }
        var forms = element.querySelectorAll('form[action^="/"],form[data-action^="/"],form:not([action])');
        for (var i = 0, l = forms.length; i < l; i++) {
            if (!forms[i].getAttribute('enctype')) {
                forms[i].addEventListener('submit', submit, false);
            }
        }
    }

    function popstate(event) {
        if (event.state) {
            // avoid history duplicate: remove opts.url
            var opts = event.state;
            if (!opts.dataUrl) {
                opts.dataUrl = opts.url;
            }
            opts.url = null;
            if (!load(opts)) {
                location.reload();
            }
        }
    }

    function open(event) {
        event.preventDefault();
        return load(elementOpts(this));
    }

    function submit(event) {
        event.preventDefault();
        var opts = elementOpts(this);

        var query = '';
        for (var i = 0, l = this.elements.length; i < l; i++) {
            var e = this.elements[i];
            if (!e.name && !e.id) {
                continue;
            }

            var v = '';
            if ('select' === e.tagName.toLowerCase()) {
                v = e.options[e.selectedIndex].value;
            } else if (e.type && e.type.match(/^(checkbox|radio)$/i)) {
                if (e.checked) {
                    v = e.value || 'on';
                } else {
                    continue;
                }
            } else {
                v = e.value;
            }

            if (i > 0) {
                query += '&';
            }
            query += encodeURIComponent(e.name || e.id) + '=' + encodeURIComponent(v);
        }

        if (!this.method || 'get' === this.method.toLowerCase()) {
            opts.url = opts.url.replace(/\?.*$/, '') + '?' + query;
        } else {
            opts.post = query;
        }

        return load(opts);
    }

    function elementOpts(target) {
        var opts = {};
        var isForm = 'form' === target.tagName.toLowerCase();
        var urlAttrName = (isForm ? 'action' : 'href');
        opts.url = target.getAttribute(urlAttrName);
        if (!opts.url && isForm) {
            opts.url = location.toString();
        }
        opts.dataUrl = target.getAttribute('data-' + urlAttrName);
        opts.element = target.getAttribute('data-element');
        opts.excludeLayout = target.getAttribute('data-exclude-layout');
        return opts;
    }

    function load(opts) {
        var a = document.createElement('a');
        a.href = opts.dataUrl || opts.url;
        if (!a.href) {
            return false;
        }
        var path = a.pathname.substr(1);
        if (path.match(/(^$|\/$)/)) {
            path += 'index';
            a.pathname += 'index';
        }
        a.pathname += '.json';

        var element = document.querySelector(
            opts.element || (opts.url && '#' === opts.url[0] ? opts.url : options.element)
        );
        if (!element) {
            return false;
        }

        fire(element, 'elementbeforeload', true, true);

        request(a.href, opts.post, function(err, req) {
            if (err) {
                fire(element, 'elementloaderror', true, true, {request: req, error: err});
            } else {
                var data = JSON.parse(req.responseText);

                var excludeLayout = opts.excludeLayout || options.excludeLayout;
                if (excludeLayout) {
                    if (!data.excludeLayout) {
                        data.excludeLayout = [];
                    }
                    if ('string' === typeof excludeLayout) {
                        excludeLayout = excludeLayout.split(/,\s*/);
                    }
                    for (var i = 0, l = excludeLayout.length; i < l; i++) {
                        data.excludeLayout.push(excludeLayout[i]);
                    }
                }

                element.innerHTML = jsin.include(data.template || path, data);
                initElement(element);

                if (!opts.post && opts.url && '#' !== opts.url[0]) {
                    if (w.history && w.history.pushState) {
                        history.pushState(opts, document.title, opts.url);
                    }
                }

                fire(element, 'elementload', true, true, {request: req});
            }
        });

        return true;
    }

    function fire(target, event, bubbles, cancelable, opts) {
        var evt = document.createEvent('Event');
        evt.initEvent(event, bubbles, cancelable);
        if (opts) {
            for (var i in opts) {
                evt[i] = opts[i];
            }
        }
        target.dispatchEvent(evt);
    }

    function request(url, post, callback) {
        if ('function' === typeof post) {
            callback = post;
            post = null;
        }

        var req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            try {
                if (req.readyState === 4) {
                    if (req.status === 200) {
                        callback(null, req);
                    } else {
                        throw new Error('Request status code: ' + req.status);
                    }
                }
            } catch (err) {
                callback(err, req);
            }
        };
        if (post) {
            req.open('POST', url, true);
            req.send(post);
        } else {
            req.open('GET', url, true);
            req.send();
        }
    }

})(window);
