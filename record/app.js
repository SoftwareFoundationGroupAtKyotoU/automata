var init = function(id) {
    var apiMaster = api('master', { year: true, token: true, admin: true });
    var apiUser   = api('user');
    var apiRecord = api('user', { type: 'status', status: 'record', log: 1 });
    var apiScheme = api('scheme', { record: true });
    var apiTempl  = api('template', { type: 'record', links: true });
    var apiCommentConf  = api('comment', { action: 'config' });

    var div = GNN.UI.$(id);
    var history = new History();
    var persistent = new Persistent(GNN.UI.$('persistent'), history);
    var urlhash = '#';
    if (/#debug$/.test(location.href)) {
        GNN.UI.appendClass(GNN.UI.$('persistent'), 'debug');
        uslhash = '#debug';
        history.debug = true;
    }

    //// view selector

    var sw = {
        div: GNN.UI.$new('div', { id: 'view_switch' }),
        label: GNN.UI.$text('表示:'),
        ul: GNN.UI.$new('ul')
    };
    sw.div.appendChild(sw.label);
    sw.div.appendChild(sw.ul);
    div.appendChild(sw.div);
    var loading = loadingIcon();
    div.appendChild(loading);

    var selector = new Selector({
        select: function(view) {
            persistent.set('view', view.id);
        }
    }, function(view) {
        var button = GNN.UI.$('sw_view_'+view.id);
        if (button) GNN.UI.appendClass(button, 'selected');
        view.activate();
    }, function(view) {
        var button = GNN.UI.$('sw_view_'+view.id);
        if (button) GNN.UI.removeClass(button, 'selected');
        view.deactivate();
    });

    var addView = function(id, view) {
        selector.add(id, view);
        var a = GNN.UI.$new('a', {
            id: 'sw_view_' + view.id, child: view.label, attr: { href: '.' }
        });
        new GNN.UI.Observer(a, 'onclick', function(e) {
            persistent.history.track(function() {
                selector.select(id);
            });
            e.stop();
        });
        var li = GNN.UI.$new('li', { child: a });
        sw.ul.appendChild(li);
    };

    addView('report', new ReportView.Parent(div, persistent));
    addView('summary', new SummaryView(div, persistent));

    var views = new CompoundView(selector);

    //// key map

    var keymap = {
        global: new KeyMap(null),
        nil: new KeyMap(null)
    };
    new GNN.UI.Observer(document, 'onkeypress', function(e) {
        var map = views.keymap() || keymap.nil;
        var ev = e.event;
        if (map.lookup(ev) ? map.exec(ev) : keymap.global.exec(ev)) e.stop();
    });

    //// history

    new GNN.UI.Observer(window, 'onpopstate', function(e) {
        if (e.event.state) {
            var hash = e.event.state;
            var vid = (hash||{})['view'] || 'report';
            var view = selector.get(vid);
            var record = (hash||{})[vid] || {};
            var last = (persistent.hash||{})[vid] || {};

            var keys = [];
            for (var k in record) {
                if (!deepEq(record[k], last[k])) keys.push(k);
            }

            keys.forEach(function(k) {
                var token = record[k].selected;
                if (!token) view.close(k);
            });

            var focus = hash.focus;
            delete hash.focus;

            persistent.reset(hash);

            keys.forEach(function(k) {
                var token = (record[k]||{}).selected;
                if (token) view.open(k, token);
            });

            persistent.set('focus', focus);
            var view = persistent.get('view');
            selector.select(vid);
        }
    });

    //// controller

    var showRecord = function(json) {
        var required = [ 'master', 'scheme', 'comment', 'user' ];
        if (!required.every(function(x){ return json[x]; })) return;

        div.removeChild(loading);

        var conf = new Model.Config(json);
        var reports = json.scheme.map(function(sc) {
            return new Model.Report(sc);
        });
        var users = json.user.map(function(u) {
            return new Model.User(u);
        });
        var rid = persistent.get('focus') || (reports[0]||{}).id;

        persistent.set('focus', rid);
        views.setup(reports, users, conf);

        reports.forEach(function(r) {
            if (conf.token && conf.openAlways) {
                selector.forEach(function(view) {
                    var p = new Persistent.Entry(persistent, view, r.id);
                    if (!p.get('selected')) p.set('selected', conf.token);
                });
            }

            users.forEach(function(u) {
                var uid = u.token;
                var rid = r.id;
                var self = {};
                var update = function() {
                    u.getFields(rid, function(fields) {
                        self.fields = fields;
                        fields.update = update;
                        fields.comment = self.comment || {};
                        fields.reason = 'record';
                        fields.autoUpdate = false;
                        views.put(rid, uid, fields);
                        if (fields.autoUpdate) {
                            setTimeout(function(){ fields.update(); }, 5000);
                        }
                    });
                };
                update.comment = function() {
                    u.getCommentCount(rid, function(comment) {
                        var fields = self.fields || u;
                        self.comment = comment;
                        fields.comment = comment || {};
                        fields.update = update;
                        fields.reason = 'comment';
                        views.put(rid, uid, fields);
                    });
                };
                u.comment = {};
                u.update = update;
                u.reason = 'initialize';
                views.put(rid, uid, u);
                u.update();
                u.update.comment();
            });

            selector.forEach(function(view) {
                if (!persistent.get(view, r.id)) {
                    persistent.set([ view, r.id ], {});
                }
            });
        });

        var view = 'report';
        if (conf.admin) view = 'summary';
        selector.select(persistent.get('view') || view);
        views.activate();

        // initial state
        if (rid) {
            persistent.set('focus', rid);
            if (conf.token && conf.openAlways) {
                selector.forEach(function(_, v){ v.open(rid, conf.token); });
            }
        }

        history.track(function(){ history.push(persistent.hash, urlhash); });
    };

    async = {
        template: function(json) {
            // fill page template
            setTitle(json.template);
            addLinks(json.template.links);
        },
        master: showRecord,
        user: showRecord,
        scheme: showRecord,
        comment: showRecord
    };

    GNN.XHR.json.retrieve({
        master:   apiMaster,
        user:     apiUser,
        scheme:   apiScheme,
        template: apiTempl,
        comment:  apiCommentConf,
        timeout: 60000,
        async: async
    }, null, jsonpFailure);
};
