(function() {
    var JSONP = GNN.inherit(function(uri, obj, method) {
        if (JSONP.callbacks.length || JSONP.queue.length) {
            JSONP.queue.push({ uri: uri, obj: obj, method: method});
            JSONP.deq();
            return null;
        }
        return JSONP.add(uri, obj, method);
    }, {
        add: function(uri, obj, method) {
            uri.params['callback'] = 'GNN.JSONP.callback';
            if (typeof uri.params['timestamp'] == 'undefined') {
                uri.params['timestamp'] = encodeURI(new Date());
            }
            if (typeof(obj) == 'function' && typeof(method) == 'undefined') {
                obj = { callback: obj };
                method = 'callback';
            }

            var self = {};
            if (obj && method) JSONP.addCallback(obj, method);
            self.script = document.createElement('script');
            self.script.src = uri+'';
            self.script.type = 'text/javascript';
            document.getElementsByTagName('head')[0].appendChild(self.script);
            return self;
        },
        addCallback: function(obj, method) {
            JSONP.callbacks.push({ object: obj, method: method });
        },
        callback: function(args) {
            JSONP.callbacks.forEach(function(cb) {
                cb.object[cb.method].call(cb.object, args);
            });
            JSONP.callbacks = [];
        },
        deq: function() {
            if (!JSONP.queue.length) return; // queue is already empty
            if (JSONP.callbacks.length) {
                setTimeout(function(){ JSONP.deq(); }, 200);
                return;
            }
            var q = JSONP.queue.shift();
            JSONP.add(q.uri, q.obj, q.method);
        },
        callbacks: [],
        queue: []
    });
    GNN.JSONP = JSONP;
})();
