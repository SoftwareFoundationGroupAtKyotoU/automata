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
        url = url || '#';
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

    return {
        hash: deserialize(node.value) || {},
        history: hist,
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
            var dummy;
            return this.set(keys, dummy);
        },
        set: function(keys, value) {
            if (!(keys instanceof Array)) keys = [keys];
            if (keys.length <= 0) keys.push('');
            var focus = keys[0];
            var key = keys.pop();

            var entry = keys.reduce(function(r, x) {
                if (typeof r[x] == 'undefined') r[x] = {};
                return r[x];
            }, this.hash);
            var diff = !deepEq(entry[key], value);
            entry[key] = value;

            if (diff) {
                this.hash.focus = focus;
                hist.push(this.hash);
            }
            this.reset(this.hash);
            return this;
        },
        get: function(keys) {
            if (!(keys instanceof Array)) keys = [keys];
            if (keys.length <= 0) keys.push('');

            return keys.reduce(function(r, x) {
                return (r||{})[x];
            }, this.hash);
        }
    };
};
Persistent.Entry = function(parent, keys) {
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
            return this.parent.del(this.keys.concat(keys));
        },
        set: function(keys, value) {
            if (!(keys instanceof Array)) keys = [keys];
            this.parent.set(this.keys.concat(keys), value);
            return this;
        },
        get: function(keys) {
            if (!(keys instanceof Array)) keys = [keys];
            return this.parent.get(this.keys.concat(keys));
        }
    };
};

var ReportView = function() {
    var self = {};
    var map = {};

    self.add = function(id, token, fields) {
        map[id] = map[id] || {};
        map[id][token] = fields;
    };

    self.activate = function() {
    };

    self.deactivate = function() {
    };

    self.open = function(id, token) {
        var f = map[id][token];
        if (f) f.open();
    };

    self.close = function(id) {
        var fs = map[id];
        for (var t in fs) {
            var f = fs[t];
            if (f.isOpen()) f.close();
        }
    };

    return self;
};

var SummaryView = function() {
    var self = {};
    return self;
};

var showDropdown = function(target, list, callback) {
    var parent = target.parentNode;

    var selector = GNN.UI.$new('select', {
        child: list.map(function(x) {
            var opt = GNN.UI.$new('option', {
                attr: { value: x.value }, child: x.label
            });
            if (x.selected) opt.selected = 'selected';
            return opt;
        })
    });
    new GNN.UI.Observer(selector, 'onchange', function(e) {
        e.target().blur();
        callback(e.target().value);
    });

    parent.replaceChild(selector, target);
    selector.focus();

    new GNN.UI.Observer(selector, 'onblur', function(e) {
        parent.replaceChild(target, e.target());
    });
};

var StatusWindow = function(id, tabs, persistent) {
    var make = function(tag, what) {
        return GNN.UI.$new(tag, {
            id: [ id, 'status', what ].join('_'),
            klass: [ 'status', what ].join('_')
        });
    };
    var window = make('div', 'window');
    var header = make('div', 'header');
    var toolbar = make('ul', 'toolbar');
    var tabbar = make('ul', 'tabbar');
    var view = make('div', 'view');
    window.appendChild(header);
    window.appendChild(view);
    header.appendChild(toolbar);
    header.appendChild(tabbar);

    var makeTabId = function(name) {
        return [ id, name, 'tab' ].join('_');
    };

    var self = {
        persistent: new Persistent.Entry(persistent, 'tabs'),
        window: window,
        target: null,
        tabs: {},
        add: function(tab) {
            this.tabs[tab.name] = tab;
            var self = this;
            var a = GNN.UI.$new('a', { attr: { href: '.' } });
            a.appendChild(GNN.UI.$text(tab.label));
            new GNN.UI.Observer(a, 'onclick', function(e) {
                e.stop();
                persistent.history.track(function() {
                    if (self.target) self.show(self.target, tab.name, true);
                });
            });
            var button = this.tabButton(tab.name, a);
            tabbar.appendChild(button);
        },
        tabButton: function(name, a) {
            var tabButtonId = [ makeTabId(name), 'button' ].join('_');
            var button = GNN.UI.$(tabButtonId);
            if (!button) {
                button = GNN.UI.$new('li', {
                    id: tabButtonId,
                    child: a || [],
                    klass: 'status_tabbar_button'
                });
            }
            return button;
        },
        set: function(node) {
            GNN.UI.removeAllChildren(view);
            if (!node) return;
            if (!(node instanceof Array)) node = [ node ];
            node.forEach(function(e){
                view.appendChild(GNN.UI.$node(e));
            });
        },
        show: function(target, tabName, force) {
            this.target = target;
            var lastTab = this.persistent.get('selected');
            tabName = (!force && lastTab) || tabName;
            this.persistent.set('selected', tabName);

            for (var t in this.tabs) {
                var tab = this.tabs[t];
                var e = GNN.UI.$([ makeTabId(tab.name), 'button' ].join('_'));
                if (!e) continue;

                if (tab.name == tabName) {
                    GNN.UI.appendClass(e, 'selected');
                    GNN.UI.removeAllChildren(toolbar);
                    GNN.UI.removeAllChildren(view);
                    var tb = {
                        parent: toolbar,
                        reset: function() {
                            GNN.UI.removeAllChildren(this.parent);
                        },
                        add: function(node, klass) {
                            this.parent.appendChild(GNN.UI.$new('li', {
                                child: node, klass: klass || ''
                            }));
                            return this;
                        },
                        addButton: function(node) {
                            this.add(node, 'toolbutton');
                        }
                    };
                    tab.show(target, tb, self);
                } else {
                    GNN.UI.removeClass(e, 'selected');
                }
            }

            window.style.display = 'block';
        },
        hide: function() {
            window.style.display = 'none';
        }
    };

    (tabs||[]).forEach(function(t){ self.add(t) });

    self.hide();

    return self;
};

var ToolButton = function(button) {
    var dummy = GNN.UI.$node('');
    return {
        button: button,
        parent: button.parentNode,
        alternative: null,
        enable: function() {
            if (button.parentNode == this.parent) return;
            this.parent.replaceChild(button, this.alternative);
        },
        disable: function(alternative) {
            if (button.parentNode != this.parent) return;
            if (alternative) alternative = GNN.UI.$node(alternative);
            this.alternative = alternative || dummy;
            button.blur();
            this.parent.replaceChild(this.alternative, button);
        }
    };
};

var editMode = function(makeForm, confirm, view, button, restore) {
    var submit = GNN.UI.$new('input', { attr: {
        type: 'submit', value: '変更'
    } });
    var cancel = GNN.UI.$new('input', { attr: {
        type: 'button', value: 'キャンセル'
    } });

    var form = GNN.UI.$new('form', { attr: { action: '.' } });
    makeForm(form);
    form.appendChild(submit);
    form.appendChild(cancel);

    var onConfirm = function(e) {
        e.stop();
        button.enable();
        confirm();
    };
    var onCancel = function(e) {
        button.enable();
        view.set(restore);
    };
    new GNN.UI.Observer(form, 'onsubmit', onConfirm);
    new GNN.UI.Observer(cancel, 'onclick', onCancel);

    button.disable('編集中');
    view.set(form);
};
