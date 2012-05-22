var init = function(id) {
    var apiMaster = api('master', { year: true, token: true, admin: true });
    var apiUser   = api('user');
    var apiRecord = api('user', { type: 'status', status: 'record', log: 1 });
    var apiScheme = api('scheme', { record: true });
    var apiTempl  = api('template', { type: 'record', links: true });
    var apiCommentConf  = api('comment', { action: 'config' });

    var defs = {
        status: [
            [ '',         '未提出'   ],
            [ 'OK',       '提出済'   ],
            [ 'NG',       '要再提出' ],
            [ 'build',    '確認中'   ],
            [ 'check',    '確認中'   ],
            [ 'build:NG', '要再提出' ],
            [ 'check:NG', '提出済'   ]
        ]
    };

    var persistent = new Persistent(GNN.UI.$('persistent'));

    with (GNN.UI) {
        var div = GNN.UI.$(id);
        div.appendChild(loadingIcon());

        var RecordFields = function(sc, student, status) {
            var tr = $new('tr');
            var pers = status.persistent.parent;
            var id = student.token;
            var self = { tr: tr, openAlways: false, admin: null, token: null };
            var updateRecord = function(){ self.update(); };

            // textify function specific to the field
            var toText = function(obj, klass, record) {
                if (isNode(obj)) return obj;
                if (/^optional/.test(klass)) {
                    if (obj == null) return '';
                    if (obj.length == 0) return '0';
                    var a = $new('a', {
                        attr: { href: '.' },
                        child: obj.length+''
                    });
                    var show = false;
                    new Observer(a, 'onclick', function(e) {
                        e.stop();
                        var elem = e.event.element;
                        removeAllChildren(a);
                        if (show) {
                            a.appendChild($text(obj.length));
                        } else {
                            a.appendChild($text(obj.join(', ')));
                        }
                        show = !show;
                    });
                    return a;
                }

                switch (klass) {
                case 'status':
                    if (typeof obj == 'boolean' && obj) obj = 'OK';
                    return defs.status.reduce(function(r, x) {
                        return r || (x[0] == (obj||'') && x[1])
                    }, null) || '';
                case 'unsolved':
                    if (obj == null) return '';
                    return obj.map(function(x) {
                        if (x[1] == 1) {
                            return x[0];
                        } else {
                            return x[0] + 'のうち残り' + x[1] + '問';
                        }
                    }).join(', ');
                case 'test':
                    if (record.log && record.log.test) {
                        var t = record.log.test;
                        if (t.passed == t.number) {
                            return t.passed+'/'+t.number;
                        } else {
                            return $new('span', { child: [
                                $new('em', { child: t.passed }),
                                '/'+t.number
                            ] });
                        }
                    }
                    return '';
                default:
                    return obj;
                }
            };

            var makeStatusId = function(x) {
                return [ x, sc.id, 'status' ].filter(function(x) {
                    return !!x;
                }).join('-');
            };

            var updateSelectedRow = function() {
                var getParent = function(e) {
                    return e.parentNode.parentNode;
                };

                $select({
                    tag: 'a', klass: makeStatusId()
                }).forEach(function(e) {
                    removeClass(getParent(e), 'selected');
                });
                status.hide();

                var id = pers.get('selected');
                if (!id) return;

                if (self.openAlways) {
                    status.show(id, 'log');
                } else { // highlight
                    var elem = $(makeStatusId(id));
                    if (elem) {
                        var parent = getParent(elem);
                        appendClass(parent, 'selected');
                        status.show(id, 'log');
                    }
                }
            };

            var makeStatusNode = function(text) {
                if (self.openAlways) {
                    pers.set('selected', student.token);
                } else {
                    if (typeof pers.get('selected') == 'undefined') {
                        pers.set('selected', self.token);
                    }

                    var klass = makeStatusId();
                    text = $new('a', {
                        id: makeStatusId(id),
                        klass: klass,
                        attr: { href: '.' },
                        child: text
                    });
                    new Observer(text, 'onclick', function(e) {
                        e.stop();
                        if (pers.get('selected') == id) {
                            pers.del('selected');
                        } else {
                            pers.set('selected', id);
                        }
                        updateSelectedRow();
                    });
                }
                return text;
            };

            var makeEditButton = function(current, status) {
                var edit = $new('a', {
                    child: '\u270f',
                    klass: 'edit',
                    attr: { href: '.', title: '変更する' }
                });
                new Observer(edit, 'onclick', function (e) {
                    e.stop();

                    showDropdown(status, defs.status.map(function(x) {
                        return {
                            value: x[0],
                            label: x[0]+' ('+x[1]+')',
                            selected: x[0] == current.status
                        };
                    }), function(v) {
                        self.admin.editStatus({
                            id: current.id, user: id, report: sc.id,
                            status: v
                        }, updateRecord, updateRecord);
                    });
                });
                return edit;
            };

            var updateRecordFields = function(record) {
                removeAllChildren(tr);

                var id = student.token;
                var autoUpdate;

                sc.record.forEach(function(col) {
                    var td = $new('td', { klass: col.field });
                    tr.appendChild(td);

                    var fld = student[col.field];
                    fld = fld || (record||{})[col.field];
                    if (!fld && !record) fld = loadingIcon();
                    var text = toText(fld, col.field, record);

                    if (col.field == 'status') {
                        text = makeStatusNode(text);

                        if (self.admin && fld && fld.length > 0) {
                            var edit = makeEditButton({
                                id: record.submit, status: fld
                            }, text);
                            text = [ text, edit ];
                        }

                        if (fld == 'check' && sc.update == 'auto') {
                            autoUpdate = true;
                            td.appendChild(loadingIcon());
                        }
                        if ((fld||'').length > 0) {
                            fld = fld.replace(/[^0-9a-zA-Z]/g, '-');
                            appendClass(td, fld);
                        }
                    }

                    if (!(text instanceof Array)) text = [text];
                    text.forEach(function(t){ td.appendChild($node(t)); });
                });

                if (autoUpdate) {
                    setTimeout(function(){ self.update(); }, 2000);
                }
            };

            self.update = function() {
                updateRecordFields();

                GNN.JSONP.retrieve({ user: api('user', {
                    report: sc.id, user: student.token,
                    type: 'status', status: 'record', log: 1
                }) }, function(json) {
                    var record = (json.user[0].report||{})[sc.id]||{};
                    updateRecordFields(record);

                    var id = pers.get('selected');
                    if (id && id == student.token) updateSelectedRow();
                }, jsonpFailure);
            };

            return self;
        };

        var updater = {};
        var updateRecord = function(scid, token) {
            var f = updater[scid][token];
            if (typeof f == 'function') f();
        };

        var showRecord = function(json) {
            var required = [ 'master', 'scheme', 'comment', 'user' ];
            if (!required.every(function(x){ return json[x]; })) return;
            removeAllChildren(div);

            json.scheme.forEach(function(sc) { // for each report
                var pers = new Persistent.Entry(persistent, sc.id);
                updater[sc.id] = {};

                var table = $new('table', {
                    id: sc.id,
                    attr: { summary: sc.id },
                    child: $new('tr', { child: sc.record.map(function(col) {
                        return $new('th', {
                            klass: col.field,
                            child: col.label
                        });
                    }) })
                });

                var admin;
                if ((json.master||{}).admin) admin = new Admin(updateRecord);

                var logView = new LogView(sc.id, admin);
                var solvedList = new SolvedView(sc.id, admin);
                var testResult = new TestResultView(sc.id, admin);
                var fileBrowser = new FileBrowserView(sc.id);
                var comment = new CommentView(sc.id, updateRecord, admin);
                var tabs = [ logView, solvedList ];
                if (sc.record.some(function(col){return col.field=='test';})) {
                    tabs.push(testResult);
                }
                tabs.push(fileBrowser);
                if ((json.comment||{}).enable) {
                    if ((json.comment||{}).enable != 'admin' ||
                        (json.master||{}).admin) tabs.push(comment);
                }
                var status = new StatusWindow(sc.id, tabs, pers);

                json.user.forEach(function(student) { // for each student
                    var fields = new RecordFields(sc, student, status);
                    fields.admin = admin;
                    fields.openAlways = (json.user.length == 1);
                    fields.token = json.master.token;
                    fields.update();

                    table.appendChild(fields.tr);
                    updater[sc.id][student.token] = function() {
                        fields.update();
                    };
                });

                div.appendChild(table);
                div.appendChild(status.window);
            });
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

        GNN.JSONP.retrieve({
            master:   apiMaster,
            user:     apiUser,
            scheme:   apiScheme,
            template: apiTempl,
            comment:  apiCommentConf,
            timeout: 60000,
            async: async
        }, null, jsonpFailure);
    }
};
