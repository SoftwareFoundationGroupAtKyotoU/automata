var Model = {};

Model.Config = function(json) {
    var conf = json.master || {};
    conf.comment = json.comment || {};
    if (conf.comment.enable) {
        conf.comment.enable = (conf.comment.enable != 'admin' || conf.admin);
    }
    conf.openAlways = (json.user.length == 1);
    return conf;
};

Model.Report = function(r) {
    r.hasTest = r.record.some(function(col){return col.field=='test';});
    return r;
};

Model.User = function(u) {
    u.getFields = function(rid, callback) {
        GNN.XHR.json.retrieve({ user: api('user', {
            report: rid, user: u.token,
            type: 'status', status: 'record', log: 1
        }) }, function(json) {
            var fields = GNN.inherit(fields, u);
            fields.record = (json.user[0].report||{})[rid]||{};
            callback(fields);
        }, jsonpFailure);
    };
    u.getCommentCount = function(rid, callback) {
        GNN.XHR.json.retrieve({ comment: api('comment', {
            report: rid, user: u.token, action: 'news'
        }) }, function(json) {
            callback(json.comment||{});
        });
    };
    return u;
};

Model.UserList = function(users) {
    users = users.map(function(u) { return new Model.User(u); });

    users.getFields = function(rid, callback) {
        GNN.XHR.json.retrieve({ user: api('user', {
            report: rid, type: 'status', status: 'record', log: 1
        }) }, function(json) {
            var token_to_user = {};
            json.user.forEach(function(u) { token_to_user[u.token] = u; });

            var fieldsList = users.map(function(u) {
                var fields = GNN.inherit(fields, u);
                fields.record = (token_to_user[u.token].report||{})[rid]||{};
                return fields;
            });
            callback(fieldsList);
        }, jsonpFailure);
    };

    users.getCommentCount = function(rid, callback) {
        GNN.XHR.json.retrieve({ comment: api('comment', {
            report: rid,
            /* dirty hack for concatenating query parameters for 'user' with '&' */
            dummy: GNN.URI.encode('%') + '&' +
                users.map(function (u) {
                    return 'user=' + GNN.URI.encode(u.token);
                }).join('&'),
            action: 'list_news'
        }) }, function(json) {
            callback(json.comment||{});
        });
    };

    return users;
};

var History = function() {
    var self = {};
    var tracking = false;
    var last;

    var pushState = function(){};
    var replaceState = function(){};
    if (window.history.pushState) {
        pushState = function(obj, title, url) {
            window.history.pushState(obj, title, url);
        };
    }
    if (window.history.replaceState) {
        replaceState = function(obj, title, url) {
            window.history.replaceState(obj, title, url);
        };
    }

    self.track = function(block) {
        var trackingStarted = false;
        if (!tracking) {
            tracking = true;
            last = null;
            trackingStarted = true;
        }

        block(self);

        if (trackingStarted) {
            tracking = false;
        }
    };

    self.next = function(block) {
        tracking = false;
        self.track(block);
    };

    self.push = function(obj, url) {
        url = url || (self.debug ? '#debug' : '#');
        if (tracking) {
            var title = document.getElementsByTagName('title')[0] || {};
            if (!last) {
                pushState(obj, GNN.UI.text(title), url);
                last = obj;
            } else {
                replaceState(obj, GNN.UI.text(title), url);
            }
        }
    };

    return self;
};

var Persistent = function(node, hist) {
    if (typeof JSON == 'undefined') {
        return {
            del: function(){ return this; },
            set: function(){ return this; },
            get: function(){ return null; }
        };
    }

    var serialize = function(hash) {
        return JSON.stringify(hash);
    };
    var deserialize = function(text) {
        try {
            return JSON.parse(text);
        } catch (e) {
            // ignore
        }
    };
    var hooks = [];

    return {
        hash: deserialize(node.value) || {},
        history: hist,
        addHook: function(hook) {
            hooks.push(hook);
        },
        move: function(url) {
            var history = this.history;
            var last = this.hash;
            history.next(function() {
                history.push(last, url);
                if (/^#/.test(url)) {
                    location.href = url;
                    history.push(last, url);
                }
            });
            return this;
        },
        reset: function(hash) {
            this.hash = hash;
            node.value = serialize(this.hash);
        },
        del: function(keys) {
            keys = Array.prototype.slice.call(arguments);
            var dummy;
            return this.set(keys, dummy);
        },
        set: function(keys, value) {
            if (!(keys instanceof Array)) keys = [keys];
            if (keys.length <= 0) keys.push('');
            var keys_ = keys.concat([]);
            var key = keys.pop();

            var entry = keys.reduce(function(r, x) {
                if (typeof r[x] == 'undefined') r[x] = {};
                return r[x];
            }, this.hash);
            var diff = !deepEq(entry[key], value);
            entry[key] = value;

            if (diff) {
                var self = this;
                hooks.forEach(function(hook) {
                    hook(keys_, self.hash);
                });
                hist.push(this.hash);
            }
            this.reset(this.hash);
            return this;
        },
        get: function(keys) {
            keys = Array.prototype.slice.call(arguments);
            if (keys.length <= 0) return this.hash;

            return keys.reduce(function(r, x) {
                return (r||{})[x];
            }, this.hash);
        }
    };
};
Persistent.Entry = function(parent, keys) {
    if (arguments.length > 1) {
        keys = Array.prototype.slice.call(arguments, 1);
    }
    if (!(keys instanceof Array)) keys = [keys];
    return {
        parent: parent,
        history: parent.history,
        keys: keys,
        move: function(url) {
            this.parent.move(url);
            return this;
        },
        del: function(keys) {
            keys = Array.prototype.slice.call(arguments);
            return this.parent.del.apply(this.parent, this.keys.concat(keys));
        },
        set: function(keys, value) {
            if (!(keys instanceof Array)) keys = [keys];
            this.parent.set(this.keys.concat(keys), value);
            return this;
        },
        get: function(keys) {
            keys = Array.prototype.slice.call(arguments);
            return this.parent.get.apply(this.parent, this.keys.concat(keys));
        }
    };
};
