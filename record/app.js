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

    var selector = new Selector({}, 'activate', 'deactivate');
    selector.add('report', new ReportView.Parent(div, persistent));
    selector.add('summary', new SummaryView(div, persistent));
    selector.select('report'); // FIXME
    var views = new CompoundView(selector);
    views.activate();

    new GNN.UI.Observer(window, 'onpopstate', function(e) {
        if (e.event.state) {
            var hash = e.event.state;
            var last = persistent.hash;
            var keys = [];
            for (var k in hash) {
                if (!deepEq(hash[k], last[k])) keys.push(k);
            }

            keys.forEach(function(k) {
                var token = hash[k].selected;
                if (!token) views.close(k);
            });

            var focus = hash.focus;
            delete hash.focus;

            persistent.reset(hash);

            keys.forEach(function(k) {
                var token = (hash[k]||{}).selected;
                if (token) views.open(k, token);
            });

            persistent.set('focus', focus);
        }
    });

    var showRecord = function(json) {
        var required = [ 'master', 'scheme', 'comment', 'user' ];
        if (!required.every(function(x){ return json[x]; })) return;

        var conf = new Model.Config(json);
        var reports = json.scheme.map(function(sc) {
            return new Model.Report(sc);
        });
        var users = json.user.map(function(u) {
            return new Model.User(u);
        });

        views.setup(reports, users, conf);

        reports.forEach(function(r) {
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
                            setTimeout(function(){ fields.update(); }, 2000);
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
                views.put(rid, uid, u);
                u.update();
                u.update.comment();
            });

            var pers = new Persistent.Entry(persistent, r.id);
            var t = pers.get('selected') || conf.token;
            if (!conf.openAlways && t) views.open(r.id, t);
        });

        // initial state
        persistent.set('focus', (reports[0]||{}).id);
        history.track(function(){ history.push(persistent.hash, '#'); });
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
