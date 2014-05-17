(function(w){

    if (!w.jasine) {
        w.jasine = {
            init: init,
            load: load
        };
    }

    var options = {
        element: 'body',
        excludeLayout: 'layout',
        uriStatic: '/static/'
    };

    var historyActive = false;

    function init(opts) {
        if (opts.tagName) {
            return initElement(opts);
        }
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
            if (links[i].getAttribute('data-no-jasine')) {
                continue;
            }
            var url = links[i].getAttribute('data-href') || links[i].getAttribute('href');
            if (options.uriStatic && url.substr(0, options.uriStatic.length) === options.uriStatic) {
                continue;
            }
            links[i].addEventListener('click', open, false);
        }
        var forms = element.querySelectorAll('form[action^="/"],form[data-action^="/"],form:not([action])');
        for (var i = 0, l = forms.length; i < l; i++) {
            if (forms[i].getAttribute('data-no-jasine')) {
                continue;
            }
            forms[i].addEventListener('submit', submit, false);
        }
    }

    function popstate(event) {
        if (historyActive && event.state && event.state.url) {
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
        if (0 === event.button) {
            event.preventDefault();
            return load(elementOpts(this));
        }
    }

    function submit(event) {
        event.preventDefault();
        var opts = elementOpts(this);

        switch (this.enctype) {
            case "multipart/form-data":
                opts.post = new FormData(this);
                break;
            case "text/json":
                opts.post = JSON.stringify(formData(this));
                opts.postType = this.enctype;
                break;
            default:
                opts.postType = "application/x-www-form-urlencoded";
                var query = '';
                var data = formData(this);
                for (var i in data) {
                    query += encodeURIComponent(i) + '=' + encodeURIComponent(data[i]) + '&';
                }
                if (query) {
                    query = query.substr(0, query.length - 1);
                }
                if ('post' === this.method.toLowerCase()) {
                    opts.post = query;
                } else {
                    if (opts.url) {
                        opts.url = opts.url.replace(/\?.*$/, '') + '?' + query;
                    }
                    if (opts.dataUrl) {
                        opts.dataUrl = opts.dataUrl.replace(/\?.*$/, '') + '?' + query;
                    }
                }
                break;
        }

        return load(opts);
    }

    function formData(form) {
        var data = {};
        for (var i = 0, l = form.elements.length; i < l; i++) {
            var e = form.elements[i];
            if (!e.name && !e.id) {
                continue;
            }

            var v = '';
            var tag = e.tagName.toLowerCase();
            if ('button' === tag || (e.type && e.type.match(/^(submit|reset|button)$/i))) {
                continue;
            } else if ('select' === tag) {
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

            data[e.name || e.id] = v;
        }
        return data;
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
        var path = a.pathname.replace(/^\//, '');
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

        if (opts.onelementbeforeload) {
            element.addEventListener('elementbeforeload', opts.onelementbeforeload, false);
        }
        if (opts.onelementload) {
            element.addEventListener('elementload', opts.onelementload, false);
        }
        if (opts.onelementafterload) {
            element.addEventListener('elementafterload', opts.onelementafterload, false);
        }

        var req = new XMLHttpRequest();

        if (!fire(element, 'elementbeforeload', true, true, {options: opts, request: req})) {
            return;
        }

        req.onreadystatechange = function() {
            try {
                if (4 === req.readyState) {
                    if (200 === req.status) {
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

                        if (!fire(element, 'elementload', true, true, {options: opts, request: req, data: data})) {
                            return;
                        }

                        element.innerHTML = jsin.include(data.template || path, data) || '';
                        initElement(element);

                        if (!opts.post && opts.url && '#' !== opts.url[0]) {
                            if (w.history && w.history.pushState) {
                                history.pushState(opts, document.title, opts.url);
                            }
                            historyActive = true;
                        }

                        fire(element, 'elementafterload', true, true, {options: opts, request: req, data: data});
                    } else {
                        throw new Error('Request status code: ' + req.status);
                    }
                }
            } catch (err) {
                fire(element, 'elementload', true, true, {options: opts, request: req, error: err});
            }
        };
        if (opts.post) {
            req.open('POST', a.href, true);
            if (opts.postType) {
                req.setRequestHeader('Content-Type', opts.postType);
            }
            req.send(opts.post);
        } else {
            req.open('GET', a.href, true);
            req.send();
        }

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
        return target.dispatchEvent(evt);
    }

})(window);
