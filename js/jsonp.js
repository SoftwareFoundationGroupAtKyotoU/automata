(function() {
    var JSONP = GNN.inherit(function(uri, callback, error) {
        return JSONP.add(uri, callback, error);
    }, {
        add: function(uri, callback, error) {
            if (typeof uri == 'string') uri = new GNN.URI(uri);
            callback = callback || function(){};
            error = error || function(){};

            var self = { uri: uri+'' };
            self.callback = function() {
                var r = callback.apply(null, arguments);
                self.done = true;
                self.stop();
                return r;
            };
            self.error = function() {
                var r = error.apply(null, arguments);
                self.done = true;
                self.stop();
                return r;
            };

            if (typeof uri.params['timestamp'] == 'undefined') {
                uri.params['timestamp'] = encodeURI(new Date());
            }

            if (typeof XMLHttpRequest == 'undefined' ||
                typeof JSON == 'undefined') {
                var cb = [
                    [ '%', '_' ],
                    [ '-', '_' ],
                    [ '\\*', '_' ],
                    [ '\\.', '_' ]
                ].reduce(function(r, x) {
                    return r.replace(new RegExp(x[0], 'g'), x[1]);
                }, escape(encodeURIComponent(self.uri)));
                while (JSONP.callback[cb]) cb += '_';

                self.stop = function() {
                    delete JSONP.callback[cb];
                };
                JSONP.callback[cb] = self.callback;
                uri.params['callback'] = 'GNN.JSONP.callback'+'.'+cb;

                self.script = document.createElement('script');
                self.script.src = uri+'';
                self.script.type = 'text/javascript';

                var head = document.getElementsByTagName('head')[0];
                head.appendChild(self.script);
            } else { // use XHR
                var req = new XMLHttpRequest();
                self.req = req;
                self.stop = function() {
                    self.callback = function(){};
                    self.error = function(){};
                };

                req.open('GET', uri+'');
                req.onreadystatechange = function(e) {
                    if (req.readyState == 4) {
                        if (200 <= req.status && req.status < 300) {
                            var obj;
                            try {
                                obj = JSON.parse(req.responseText);
                            } catch (e) {
                                // ignore
                            }
                            self.callback(obj);
                        } else {
                            self.error(req);
                        }
                    }
                }
                req.send(null);
            }

            return self;
        },
        retrieve: function(hash, callback, error) {
            var t = 10000;
            if (typeof hash.timeout != 'undefined') {
                t = hash.timeout;
                delete hash.timeout;
            }

            var asyncCallback = function(){};
            if (typeof hash.async == 'object' ) {
                var async = hash.async;
                var done = {};
                delete hash.async;
                for (var x in async) async[x].done = false;

                asyncCallback = function(w, r) {
                    for (var x in async) {
                        var ks = async[x].keys || [ x ];
                        if (!done[x] &&
                            ks.every(function(k){ return w.indexOf(k)<0; })) {
                            done[x] = true;
                            var callback = async[x].callback || async[x];
                            if (typeof callback == 'function') callback(r);
                        }
                    }
                };
            }
            callback = callback || function(){};

            var keys = [];
            var result = {};
            var timedout = false;
            var jsonp = {};

            for (var k in hash) keys.push(k);
            var wait = keys.concat([]);

            var run = function() {
                if (keys.length > 0) {
                    var k = keys.shift();
                    jsonp[k] = new JSONP(hash[k], function(obj) {
                        result[k] = obj;
                        wait = wait.filter(function(v){return v!=k;});
                        asyncCallback(wait, result);
                        if (!wait.length && !timedout) callback(result);
                    });
                    setTimeout(run, 0);
                }
            };
            run();

            error && setTimeout(function() {
                if (wait.length) {
                    keys = [];
                    timedout = true;
                    wait.forEach(function(k){ jsonp[k] && jsonp[k].stop(); });
                    error(jsonp, wait);
                }
            }, t);
        },
        callback: {}
    });
    GNN.JSONP = JSONP;
})();
