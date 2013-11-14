var Selector = function(cmd, select, unselect) {
    var self = { selected: null };
    var elements = {};
    var fun = function(f) {
        if (typeof f == 'string') {
            return function(e, id) {
                var func = e[f] || function(){};
                func.call(e, e, id);
            };
        }
        f = f || function(){};
        return function(e, id) {
            return f.call(e, e, id);
        };
    };
    cmd = cmd || {};
    cmd.select = fun(cmd.select);
    cmd.unselect = fun(cmd.unselect);
    select = fun(select);
    unselect = fun(unselect);

    self.add = function(id, element) {
        elements[id] = element;
        return element;
    };
    self.forEach = function(f) {
        for (var id in elements) f(id, elements[id]);
    };
    self.select = function(id) {
        self.forEach(function(id_, value) {
            return id_ == id ? select(elements[id_]) : unselect(elements[id_]);
        });
        self.selected = elements[id];
        if (self.selected) return cmd.select(elements[id], id);
    };
    self.unselect = function(id) {
        unselect(elements[id]);
        if (self.selected == elements[id]) {
            self.selected = null;
            return cmd.unselect(elements[id], id);
        }
    };
    self.get = function(id){ return elements[id]; };

    return self;
};

var CompoundView = function(selector) {
    var s = function(x) {
        var recv = selector.selected||{}; var f = recv[x] || function(){};
        return function(){ return f.apply(recv, arguments); };
    };
    var a = function(x) {
        return function() {
            var args = arguments;
            selector.forEach(function(key, value) {
                value[x].apply(value, args);
            });
        };
    };
    return {
        setup: function(rs, us, conf){ a('setup')(rs, us, conf); },
        put: function(id, token, fields){ a('put')(id, token, fields); },
        activate: function(){ return s('activate')(); },
        deactivate: function(){ return s('deactivate')(); },
        open: function(){ a('open').apply(null, arguments); },
        close: function(){ a('close').apply(null, arguments); },
        keymap: function(){ return s('keymap')(); }
    };
};

var Field = (function() {
    var defs = {
        status: [
            [ '',         '未提出'   ],
            [ 'OK',       '受理'     ],
            [ 'NG',       '要再提出' ],
            [ 'build',    '確認中'   ],
            [ 'check',    '確認中'   ],
            [ 'build:NG', '要再提出' ],
            [ 'check:NG', '要再提出' ],
            [ 'report',   'レポート確認中' ]
        ]
    };

    var isNode = GNN.UI.isNode;

    var makeEditButton = function(current, status) {
        var edit = GNN.UI.$new('a', {
            child: '\u270f',
            klass: 'edit',
            attr: { href: '.', title: '変更する' }
        });
        var self = { node: edit, callback: null };
        new GNN.UI.Observer(edit, 'onclick', function (e) {
            e.stop();

            showDropdown(status, defs.status.map(function(x) {
                return {
                    value: x[0], label: x[0]+' ('+x[1]+')',
                    selected: x[0] == current
                };
            }), self.callback || function(){});
        });
        return self;
    };

    var Field = GNN.inherit(function(conf, prefix, klass, u, node) {

        var data = u[klass] || (u.record||{})[klass];
        if (!data && !u.record) data = loadingIcon();
        var extra = u.record || {};
        extra.prefix = prefix;
        extra.id = [ prefix, u.token, klass ].join('-');

        var self = conf(node, data, klass, extra);
        self.node = node;
        self.data = data;

        return self;
    }, {
        name_: function(parent, data, klass, x) {
            parent.id = x.id;
            return Field.other(parent, data, klass, x);
        },
        status: function(parent, data, klass, x) {
            if (isNode(data)) return Field.other(parent, data, klass, x);
            if (typeof data == 'boolean' && data) data = 'OK';
            var k = (data||'none').replace(/[^a-zA-Z]/g, '-');
            GNN.UI.appendClass(parent, k);
            var label = defs.status.reduce(function(r, x) {
                return r || (x[0] == (data||'') && x[1]);
            }, null) || '';
            var a = GNN.UI.$new('a', {
                id: x.id, klass: [ x.prefix, klass ].join('-'),
                child: label, attr: { href: '.' }
            });
            var self = Field.other(parent, a, klass, x);
            self.label = label;
            self.a = a;
            self.edit = makeEditButton(data||'', a);
            return self;
        },
        unsolved: function(parent, data, klass, x) {
            if (isNode(data)) return Field.other(parent, data, klass, x);
            data = (data||[]).map(function(x) {
                if (x[1] == 1) {
                    return x[0];
                } else {
                    return x[0] + 'のうち残り' + x[1] + '問';
                }
            }).join(', ');
            return Field.other(parent, data, klass, x);
        },
        test: function(parent, data, klass, x) {
            if (isNode(data)) return Field.other(parent, data, klass, x);
            if (x.log && x.log.test) {
                var t = x.log.test;
                if (t.passed == t.number) {
                    data = t.passed+'/'+t.number;
                } else {
                    data = GNN.UI.$new('span', { child: [
                        GNN.UI.$new('em', { child: t.passed }),
                        '/'+t.number
                    ] });
                }
            }
            return Field.other(parent, data, klass, x);
        },
        optional: function(parent, data, klass, x) {
            if (isNode(data)) return Field.other(parent, data, klass, x);
            if (data == null) return Field.other(parent, '', klass, x);
            if (data.length == 0) return Field.other(parent, '0', klass, x);
            var a = GNN.UI.$new('a', {
                attr: { href: '.' }, child: data.length+''
            });
            var show = false;
            new GNN.UI.Observer(a, 'onclick', function(e) {
                e.stop();
                var elem = e.event.element;
                var a = e.target();
                GNN.UI.removeAllChildren(a);
                if (show) {
                    a.appendChild(GNN.UI.$text(data.length));
                } else {
                    a.appendChild(GNN.UI.$text(data.join(', ')));
                }
                show = !show;
            });
            return Field.other(parent, a, klass, x);
        },
        other: function(parent, data, klass, x) {
            parent.appendChild(GNN.UI.$node(data));
            return {};
        },
        factory: function(prefix, klass, u, td) {
            var conf = Field[klass] || Field[klass+'_'];
            if (!conf) {
                if (/^optional/.test(klass)) {
                    conf = Field.optional;
                } else {
                    conf = Field.other;
                }
            }
            td = td || GNN.UI.$new('td', { klass: klass });
            return new Field(conf, prefix, klass, u, td);
        }
    });
    return Field;
})();

var notifyUnreadCount = function(node, unreads) {
    var args = { root: node, tag: 'div', klass: 'unread' };
    GNN.UI.$select(args).forEach(function(child) {
        child.parentNode.removeChild(child);
    });

    if (unreads <= 0) return;

    var notifier = GNN.UI.$new('div', {
        klass: 'unread', child: unreads+''
    });
    if (node.firstChild) {
        node.insertBefore(notifier, node.firstChild);
    } else {
        node.appendChild(notifier);
    }
};

var ReportView = function(parent, persistent, r, conf) {
    var VIEW_ID = 'report';
    var self = { id: VIEW_ID };
    var list = [];

    var selector = new Selector({
        select: function(rf, t){ rf.open(); },
        unselect: function(rf, t) {
            rf.close();
            status.hide();
            selector.forEach(function(t_, rf_){ rf_.show(true); }); // redraw
        }
    }, 'show', 'hide');

    var table = GNN.UI.$new('table', {
        id: r.id, klass: 'record',
        attr: { summary: r.id },
        child: GNN.UI.$new('tr', { child: r.record.map(function(col) {
            return GNN.UI.$new('th', {
                klass: col.field,
                child: col.label
            });
        }) })
    });

    var updater = {
        record: function(rid, uid) {
            var rf = selector.get(uid);
            if (rf && (rf.fields||{}).update) {
                rf.fields.update();
                rf.fields.update.comment();
            }
        },
        comment: function(rid, uid) {
            var rf = selector.get(uid);
            if (rf && (rf.fields||{}).update) rf.fields.update.comment();
        }
    };

    var status = makeStatus(persistent, self, r, conf, updater);
    var admin = conf.admin && new Admin(updater);

    parent.appendChild(table);
    parent.appendChild(status.window);

    var onFocus = function() {
        persistent.parent.set('focus', r.id);
    };
    new GNN.UI.Observer(table, 'onclick', onFocus);
    new GNN.UI.Observer(status.window, 'onclick', onFocus);

    var onClose = function() {
        if (conf.openAlways) return;
        persistent.history.track(function(){ self.close(); });
        return true;
    };

    var keymap = new KeyMap.Proxy(self);
    keymap.define(
        'Down', 'next',
        'j',    'next',
        'Up',   'prev',
        'k',    'prev',
        'Esc', onClose,
        'Return', function() {
            if (conf.openAlways || list.length == 0) return;
            if (selector.selected) return onClose();
            persistent.history.track(function(){ self.open(r.id, list[0]); });
            return true;
        }
    );

    var RecordFields = function(node, fields) {
        var id = fields.token;
        var self = { id: id, fields: fields, node: node };

        if (conf.admin) {
            GNN.UI.appendClass(node, 'selectable');
            new GNN.UI.Observer(node, 'onclick', function(e) {
                self.toggle();
                e.stop();
            });
        }

        var updateRecord = function() {
            updater.record(r.id, self.fields.token);
        };

        self.isOpen = function() {
            return persistent.get('selected') == id;
        };
        self.open = function() {
            persistent.set('selected', id);
            self.show();
        };
        self.close = function() {
            if (self.isOpen()) {
                persistent.del('selected');
                status.hide();
            }
            self.hide();
        };
        self.toggle = function() {
            persistent.history.track(function() {
                if (self.isOpen()) {
                    selector.unselect(id);
                } else {
                    selector.select(id);
                }
            });
        };
        self.show = function(noRedraw, noStatus) {
            var u = self.fields;
            var id = u.token;
            var record = u.record;

            var tr = self.node;
            var selected = persistent.get('selected');
            if (typeof selected == 'undefined' || self.isOpen()) {
                tr.style.display = '';
                if (self.isOpen()) {
                    selector.selected = self;
                    if (!noStatus) status.show(id, 'log');
                    GNN.UI.appendClass(tr, 'selected');
                } else {
                    GNN.UI.removeClass(tr, 'selected');
                }
            } else {
                self.hide();
            }
            if (noRedraw) return;
            GNN.UI.removeAllChildren(tr);

            r.record.forEach(function(col) {
                var prefix = [ VIEW_ID, r.id ].join('-');
                var klass = col.field;
                var fld = Field.factory(prefix, klass, u);

                if (klass == 'status') {
                    if (fld.a) {
                        if (conf.openAlways) {
                            persistent.set('selected', id);
                            var label = GNN.UI.$node(fld.label);
                            fld.node.replaceChild(label, fld.a);
                        } else {
                            new GNN.UI.Observer(fld.a, 'onclick', function(e) {
                                e.stop();
                                self.toggle();
                            });
                        }
                    }

                    if (fld.edit && conf.admin) {
                        fld.node.appendChild(fld.edit.node);
                        fld.edit.callback = function(v) {
                            admin.editStatus({
                                id: record.submit, user: id,
                                report: r.id, status: v
                            }, updateRecord, updateRecord);
                        };
                    }

                    if (fld.data == 'check' && r.update == 'auto') {
                        u.autoUpdate = true;
                        var node = fld.node;
                        node.insertBefore(loadingIcon(), node.firstChild);
                    }
                }

                tr.appendChild(fld.node);
            });

            self.updateComment();
        };
        self.hide = function() {
            self.node.style.display = 'none';
        };
        self.updateComment = function() {
            var u = self.fields;
            var count = u.comment || {};
            var id = u.token;
            var name = GNN.UI.$([VIEW_ID, r.id, id, 'name'].join('-'));
            if (name) notifyUnreadCount(name, count.unreads || 0);

            if (!self.isOpen()) return;

            var comment = (status.tabs||{}).comment;
            if (comment) {
                var btn = status.tabButton('comment');
                var link = btn.lastChild;
                notifyUnreadCount(btn, count.unreads || 0);

                GNN.UI.removeAllChildren(link);
                var label = comment.label+'('+(count.comments||0)+')';
                link.appendChild(GNN.UI.$node(label));
            }
        };

        return self;
    };

    self.put = function(id, token, fields) {
        var rf = selector.get(token);
        if (!rf) {
            rf = new RecordFields(GNN.UI.$new('tr'), fields);
            table.appendChild(rf.node);
            selector.add(token, rf);
            list.push(token);
        }
        rf.fields = fields;
        if (fields.reason == 'comment') {
            rf.updateComment();
        } else {
            rf.show(false, fields.reason != 'record');
        }
    };
    self.open = function(id, token) {
        selector.select(token);
    };
    self.close = function(id) {
        persistent.del('selected');
        if (selector.selected) selector.unselect(selector.selected.id);
    };
    self.next = function() {
        var i = list.indexOf((selector.selected||{}).id);
        if (0 <= i && i+1 < list.length) {
            persistent.history.track(function() {
                selector.select(list[i+1]);
            });
            return true;
        }
    };
    self.prev = function() {
        var i = list.indexOf((selector.selected||{}).id);
        if (0 < i) {
            persistent.history.track(function() {
                selector.select(list[i-1]);
            });
            return true;
        }
    };
    self.focus = function() {
        if (!conf.openAlways) GNN.UI.appendClass(table, 'focus');
        var pos = GNN.UI.getPosition(table);
        window.scrollTo(pos.x, pos.y);
    };
    self.blur = function() {
        GNN.UI.removeClass(table, 'focus');
    };
    self.keymap = function() {
        keymap.parent = status.keymap();
        return keymap;
    };

    return self;
};

ReportView.Parent = function(parent, persistent) {
    var selector = new Selector({}, 'focus', 'blur');

    persistent.addHook(function(keys, store) {
        if (keys[0] == 'focus') {
            selector.select(store.focus);
        } else if (keys[0] == 'report') {
            selector.select(keys[1]);
            store.focus = keys[1];
        }
    });

    var self = { id: 'report', label: '課題ごと' };
    var list = [];
    var active = false;

    var keymap = new KeyMap.Proxy(self);
    keymap.define(
        'Left',  'prev',
        'h',     'prev',
        'Right', 'next',
        'l',     'next'
    );

    var div = GNN.UI.$new('div', { id: 'report_view', klass: 'view' });
    parent.appendChild(div);

    self.setup = function(rs, us, conf) {
        GNN.UI.removeAllChildren(div);
        rs.forEach(function(r){ self.push(r, conf); });
        if (!selector.selected) {
            var rid = persistent.get('focus') || (rs[0]||{}).id;
            selector.select(rid);
        }
    };
    self.push = function(r, conf) {
        var pers = new Persistent.Entry(persistent, 'report', r.id);
        selector.add(r.id, new ReportView(div, pers, r, conf));
        list.push(r.id);
    };
    self.put = function(id, token, fields) {
        var view = selector.get(id);
        selector.add(id, view);
        view.put(id, token, fields);
    };
    self.activate = function() {
        div.style.display = '';
        active = true;
    };
    self.deactivate = function() {
        div.style.display = 'none';
        active = false;
    };
    self.open = function(id, token) {
        var view = selector.get(id);
        if (view) view.open(id, token);
    };
    self.close = function(id) {
        var view = selector.get(id);
        if (view) view.close(id);
    };
    self.keymap = function() {
        var focus = persistent.get('focus');
        var view = focus && selector.get(focus);
        if (view) keymap.parent = view.keymap();
        return keymap;
    };
    self.next = function() {
        var focus = persistent.get('focus');
        if (!focus) return;
        var i = list.indexOf(focus);
        if (0 <= i && i+1 < list.length) {
            persistent.set('focus', list[i+1]);
            return true;
        }
    };
    self.prev = function() {
        var focus = persistent.get('focus');
        if (!focus) return;
        var i = list.indexOf(focus);
        if (0 < i) {
            persistent.set('focus', list[i-1]);
            return true;
        }
    };

    return self;
};

var SummaryView = function(parent, persistent) {
    var VIEW_ID = 'summary';
    var self = { id: VIEW_ID, label: '一覧' };
    var list = { rs: [], us: [] };
    var active = false;

    var RecordRow = function(node, selector) {
        var self = { node: node, selector: selector };
        self.show = function() {
            node.style.display = '';
        };
        self.hide = function() {
            selector.forEach(function(id, rf){ rf.close(); });
            node.style.display = 'none';
        };
        return self;
    };

    var FieldSelector = function() {
        var self = { selected: null };

        var rows = new Selector({
        }, 'show', 'hide');

        self.addRow = function(uid, node) {
            var sel = new Selector({
                select: function(rf){ rf.open(); },
                unselect: function(rf){ rf.close(); }
            }, 'show', 'hide');
            return rows.add(uid, new RecordRow(node, sel));
        };
        self.row = function(uid){ return rows.get(uid); };
        self.add = function(rid, uid, rf) {
            var row = rows.get(uid);
            if (row) row.selector.add(rid, rf);
        };
        self.get = function(rid, uid) {
            var row = rows.get(uid);
            if (row) return row.selector.get(rid);
        };
        self.select = function(rid, uid) {
            rows.select(uid);
            var selected = rows.selected;
            if (selected) {
                selected.selector.select(rid);
                self.selected = selected.selector.selected;
            }
        };
        self.unselect = function(rid) {
            var rf = self.selected;
            if (rf && rf.rid == rid) {
                self.selected = null;
                rf.close();
                rows.forEach(function(rid, row){ row.show(); });
            }
        };

        return self;
    };
    var selector = new FieldSelector();

    var div = GNN.UI.$new('div', { id: 'report_view', klass: 'view' });
    parent.appendChild(div);

    var table = GNN.UI.$new('table', {
        id: 'summary', klass: 'record', attr: { summary: 'status summary' }
    });

    var updater = {
        record: function(rid, uid) {
            var rf = selector.get(rid, uid);
            if (rf && (rf.fields||{}).update) {
                rf.fields.update();
                rf.fields.update.comment();
            }
        },
        comment: function(rid, uid) {
            var rf = selector.get(rid, uid);
            if (rf && (rf.fields||{}).update) rf.fields.update.comment();
        }
    };

    var onClose = function() {
        if (selector.selected) {
            var rid = selector.selected.rid;
            persistent.history.track(function(){ self.close(rid); });
            return true;
        }
    };

    var keymap = new KeyMap.Proxy(self);
    keymap.define(
        'Down', 'nextUser',
        'j',    'nextUser',
        'Up',   'prevUser',
        'k',    'prevUser',
        'Left',  'prev',
        'h',     'prev',
        'Right', 'next',
        'l',     'next',
        'Esc', onClose,
        'Return', function() {
            if (list.length == 0) return;
            if (selector.selected) return onClose();
            persistent.history.track(function() {
                self.open(list.rs[0], list.us[0]);
            });
            return true;
        }
    );

    var RecordField = function(node, r, fields, status, conf) {
        var rid = r.id; var uid = fields.token;
        var self = { rid: rid, uid: uid, fields: fields, node: node };
        var pers = new Persistent.Entry(persistent, 'summary');

        var updateRecord = function(){ updater.record(rid, uid); };
        var admin = conf.admin && new Admin(updater);

        self.isOpen = function() {
            return pers.get(rid, 'selected')==uid;
        };
        self.open = function() {
            var hash = pers.get();
            for (var r in hash) pers.del(r, 'selected');
            pers.set([rid, 'selected'], uid);
            pers.set('user', uid);
            self.show();
        };
        self.close = function() {
            if (self.isOpen()) {
                pers.del(rid, 'selected');
                status.hide();
            }
            self.hide();
        };
        self.toggle = function() {
            pers.history.track(function() {
                if (self.isOpen()) {
                    self.close();
                    selector.unselect(rid);
                } else {
                    selector.select(rid, uid);
                }
            });
        };
        self.show = function(noRedraw, noStatus) {
            var u = self.fields;
            var record = u.record;

            var td = self.node;
            var tr = self.node.parentNode;
            if (pers.get('user') == uid || self.isOpen()) {
                tr.style.display = '';
                if (self.isOpen()) {
                    selector.selected = self;
                    if (!noStatus) status.show(uid, 'log');
                    GNN.UI.appendClass(td, 'selected');
                } else {
                    GNN.UI.removeClass(td, 'selected');
                }
            } else if (pers.get('user') == uid) {
                self.hide();
            }
            if (noRedraw) return;
            GNN.UI.removeAllChildren(td);

            var prefix = [ VIEW_ID, rid ].join('-');
            var klass = r.field;
            var fld = Field.factory(prefix, klass, u, td);

            if (klass == 'status') {
                if (fld.a) {
                    new GNN.UI.Observer(fld.a, 'onclick', function(e) {
                        e.stop();
                        self.toggle();
                    });
                }

                if (fld.edit && conf.admin) {
                    fld.node.appendChild(fld.edit.node);
                    fld.edit.callback = function(v) {
                        admin.editStatus({
                            id: record.submit, user: uid,
                            report: rid, status: v
                        }, updateRecord, updateRecord);
                    };
                }

                if (fld.data == 'check' && r.update == 'auto') {
                    u.autoUpdate = true;
                    var node = fld.node;
                    node.insertBefore(loadingIcon(), node.firstChild);
                }
            }

            self.updateComment();
        };
        self.hide = function() {
            GNN.UI.removeClass(self.node, 'selected');
            status.hide();
        };
        self.updateComment = function() {
            var u = self.fields;
            var count = u.comment || {};
            var id = u.token;
            var node = GNN.UI.$([VIEW_ID, rid, uid, 'status'].join('-'));
            node = (node||{}).parentNode;
            if (node) notifyUnreadCount(node, count.unreads || 0);

            if (!self.isOpen()) return;

            var comment = (status.tabs||{}).comment;
            if (comment) {
                var btn = status.tabButton('comment');
                var link = btn.lastChild;
                notifyUnreadCount(btn, count.unreads || 0);

                GNN.UI.removeAllChildren(link);
                var label = comment.label+'('+(count.comments||0)+')';
                link.appendChild(GNN.UI.$node(label));
            }
        };
        self.keymap = function(){ return status.keymap(); };

        return self;
    };

    var status = {};

    self.setup = function(rs, us, conf) {
        GNN.UI.removeAllChildren(div);
        GNN.UI.removeAllChildren(table);
        div.appendChild(table);

        var getLabel = function(r, x, l) {
            r.some(function(c){ return x == c.field ? (l=c.label) : false; });
            return l;
        };
        var cols = rs.map(function(x, i){ return { field: 'status', i: i }; });
        cols.unshift({ field: 'name', i: 0 });
        cols.map(function(x) {
            x.label = getLabel(rs[x.i].record, x.field);
            x.id = rs[x.i].id;
            x.update = rs[x.i].update;
            return x;
        }).filter(function(x){ return x.label; });

        var tr = GNN.UI.$new('tr');
        cols.forEach(function(col) {
            tr.appendChild(GNN.UI.$new('th', {
                className: col.field, child: col.label
            }));
        });
        table.appendChild(tr);

        rs.forEach(function(r) {
            list.rs.push(r.id);

            var pers = new Persistent.Entry(persistent, 'summary', r.id);
            status[r.id] = makeStatus(pers, self, r, conf, updater);
            div.appendChild(status[r.id].window);
        });

        var user = persistent.get('summary', 'user');
        us.forEach(function(u) {
            list.us.push(u.token);

            var tr = GNN.UI.$new('tr');
            table.appendChild(tr);
            var row = selector.addRow(u.token, tr);
            if (user && user != u.token) row.hide();

            cols.forEach(function(col) {
                var r = rs[col.i];
                var td = GNN.UI.$new('td', { klass: col.field });
                tr.appendChild(td);

                var rf;
                if (col.field == 'name') {
                    var st = { show: function(){}, hide: function(){} };
                    rf = new RecordField(td, col, u, st, conf);
                    rf.show();
                } else {
                    rf = new RecordField(td, col, u, status[r.id], conf);
                    GNN.UI.appendClass(td, 'selectable');
                    new GNN.UI.Observer(td, 'onclick', function(e) {
                        rf.toggle();
                        e.stop();
                    });
                    selector.add(r.id, u.token, rf);
                }
            });
        });
    };
    self.put = function(id, token, fields) {
        var rf = selector.get(id, token);
        if (!rf) return;
        rf.fields = fields;
        if (fields.reason == 'comment') {
            rf.updateComment();
        } else {
            rf.show(false, fields.reason != 'record');
        }
    };
    self.activate = function() {
        div.style.display = '';
        active = true;
    };
    self.deactivate = function() {
        div.style.display = 'none';
        active = false;
    };
    self.open = function(id, token) {
        selector.select(id, token);
    };
    self.close = function(id) {
        selector.unselect(id);
    };
    self.next = function() {
        var rf = selector.selected;
        if (!rf) return;
        var i = list.rs.indexOf(rf.rid);
        if (0 <= i && i+1 < list.rs.length) {
            persistent.history.track(function() {
                self.open(list.rs[i+1], rf.uid);
            });
            return true;
        }
    };
    self.prev = function() {
        var rf = selector.selected;
        if (!rf) return;
        var i = list.rs.indexOf(rf.rid);
        if (0 < i) {
            persistent.history.track(function() {
                self.open(list.rs[i-1], rf.uid);
            });
            return true;
        }
    };
    self.nextUser = function() {
        var rf = selector.selected;
        if (!rf) return;
        var i = list.us.indexOf(rf.uid);
        if (0 <= i && i+1 < list.us.length) {
            persistent.history.track(function() {
                self.open(rf.rid, list.us[i+1]);
            });
            return true;
        }
    };
    self.prevUser = function() {
        var rf = selector.selected;
        if (!rf) return;
        var i = list.us.indexOf(rf.uid);
        if (0 < i) {
            persistent.history.track(function() {
                self.open(rf.rid, list.us[i-1]);
            });
            return true;
        }
    };
    self.keymap = function() {
        var rf = selector.selected;
        keymap.parent = rf ? rf.keymap() : null;
        return keymap;
    };

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

var makeStatus = function(persistent, view, r, conf, updater) {
    var prefix = view.id + '-' + r.id;
    var admin = conf.admin && new Admin(updater);
    var logView = new LogView(prefix, r.id, admin);
    var solvedList = new SolvedView(prefix, r.id, admin);
    var testResult = new TestResultView(prefix, r.id, admin);
    var fileBrowser = new FileBrowserView(prefix, r.id);
    var comment = new CommentView(prefix, r.id, updater, admin);
    var tabs = [
        [ true, logView ],
        [ true, solvedList ],
        [ conf.admin || r.hasTest, testResult ],
        [ true, fileBrowser ],
        [ conf.comment.enable, comment ],
        []
    ];
    tabs = tabs.reduce(function(r, x){ return r.concat(x[0]?x[1]:[]); }, []);
    return new StatusWindow(prefix, tabs, persistent);
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
        list: [],
        select: function(name) {
            persistent.history.track(function() {
                if (self.target) self.show(self.target, name, true);
            });
        },
        next: function() {
            var name = this.persistent.get('selected');
            var i = this.list.indexOf(name);
            if (0 <= i && i + 1 < this.list.length) {
                this.select(this.list[i+1]);
                return true;
            } else if (i + 1 == this.list.length) {
                this.select(this.list[0]);
                return true;
            }
        },
        prev: function() {
            var name = this.persistent.get('selected');
            var i = this.list.indexOf(name);
            if (0 < i) {
                this.select(this.list[i-1]);
                return true;
            } else if (i == 0) {
                this.select(this.list[this.list.length-1]);
                return true;
            }
        },
        add: function(tab) {
            this.tabs[tab.name] = tab;
            this.list.push(tab.name);
            var self = this;
            var a = GNN.UI.$new('a', { attr: { href: '.' } });
            a.appendChild(GNN.UI.$text(tab.label));
            new GNN.UI.Observer(a, 'onclick', function(e) {
                e.stop();
                self.select(tab.name);
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

    var keymap = new KeyMap(self);
    keymap.define(
        'Tab',   'next',
        'S-Tab', 'prev'
    );
    self.keymap = function(){ return keymap; };

    (tabs||[]).forEach(function(t){ self.add(t); });

    self.hide();

    return self;
};
