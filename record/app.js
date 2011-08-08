var init = function(id) {
    var apiMaster = api('master', { year: true, token: true });
    var apiUser   = api('user', { type: 'status', status: 'record', log: 1 });
    var apiScheme = api('scheme', { record: true });
    var apiTempl  = api('template', { type: 'record', links: true });

    var persistent = {};

    with (GNN.UI) {

        var div = GNN.UI.$(id);

        var showRecord = function(json) {
            removeAllChildren(div);

            // textify function specific to the field
            var toText = function(obj, klass) {
                if (obj == null) return '';
                if (/^optional/.test(klass)) {
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
                    switch (obj) {
                    case 'OK': return '提出済';
                    case 'NG': return '要再提出';
                    case 'build': /* pass through */
                    case 'check': return '確認中';
                    case 'build:NG': return '要再提出';
                    case 'check:NG': return '提出済';
                    }
                    return '';
                case 'unsolved':
                    return obj.map(function(x) {
                        if (x[1] == 1) {
                            return x[0];
                        } else {
                            return x[0] + 'のうち残り' + x[1] + '問';
                        }
                    }).join(', ');
                default:
                    return obj;
                }
            };

            var ppLog = function(k, msg) {
                switch (k) {
                case 'error':
                case 'test case':
                case 'detail': return $new('pre', { child: $node(msg) });
                default: return $node(msg);
                }
            };

            var makeLogMsg = function(record) {
                if (!record.timestamp && !record.log) return null;

                var dl = $new('dl', { klass: 'log-msg' });
                if (record.timestamp) {
                    dl.appendChild($new('dt', {
                        child: $node('last update')
                    }));
                    dl.appendChild($new('dd', {
                        child: $node(record.timestamp)
                    }));
                }

                if (record.log) {
                    if (record.detail) record.log.detail = record.detail;
                    var log = record.log;
                    for (var k in log) {
                        var msg = log[k];
                        dl.appendChild($new('dt', { child: $node(k) }));
                        dl.appendChild($new('dd', { child: ppLog(k, msg) }));
                    }
                }

                return dl;
            };

            // records
            (json.scheme||[]).forEach(function(sc) { // for each report
                var pers = persistent[sc.id] || {};
                persistent[sc.id] = pers;

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

                var log = $new('div', {
                    id: [ sc.id, 'log' ].join('_'),
                    klass: 'log'
                });
                var closeLog = function() {
                    removeAllChildren(log);
                };
                var setLog = function(id) {
                    closeLog();
                    var student = json.user.reduce(function(r, u) {
                        return id == u.token ? u : r;
                    }, { report: {} });
                    var record = student.report[sc.id]||{};
                    var msg = makeLogMsg(record);
                    if (msg) log.appendChild(msg);
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
                    closeLog();

                    var id = pers.selected;
                    if (!id) return;

                    if (json.user.length > 1) { // highlight
                        var elem = $(makeStatusId(pers.selected));
                        if (elem) {
                            var parent = getParent(elem);
                            appendClass(parent, 'selected');
                        }
                    }

                    setLog(id);
                };

                (json.user||[]).forEach(function(student) { // for each student
                    var tr = $new('tr');
                    var id = student.token;
                    var record = (student.report||{})[sc.id]||{};
                    var autoUpdate;

                    var makeStatusNode = function(text) {
                        if (json.user.length == 1) {
                            pers.selected = student.token;
                        } else if (json.user.length > 1) {
                            if (typeof pers.selected == 'undefined') {
                                pers.selected = json.master.token;
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
                                if (pers.selected == id) {
                                    pers.selected = null;
                                } else {
                                    pers.selected = id;
                                }
                                updateSelectedRow();
                            });
                        }
                        return text;
                    };

                    sc.record.forEach(function(col) {
                        var td = $new('td', { klass: col.field });
                        tr.appendChild(td);

                        var fld = student[col.field];
                        fld = fld || record[col.field];
                        var text = toText(fld, col.field);

                        if (col.field == 'status') {
                            if (text.length > 0) {
                                text = makeStatusNode(text);
                            }
                            if (fld == 'check') {
                                autoUpdate = true;
                                td.appendChild($new('img', {
                                    klass: 'loading',
                                    attr: { src: 'loading.gif' }
                                }));
                            }
                            if ((fld||'').length > 0) {
                                fld = fld.replace(/[^0-9a-zA-Z]/g, '-');
                                appendClass(td, fld);
                            }
                        }

                        td.appendChild($node(text));
                    });

                    if (autoUpdate) {
                        var updateRecord = function() {
                            GNN.JSONP.retrieve({
                                user: apiUser.refresh()
                            }, function(json2) {
                                json2.master = json.master;
                                json2.scheme = json.scheme;
                                showRecord(json2);
                            });
                        };
                        setTimeout(updateRecord, 2000);
                    }
                    table.appendChild(tr);
                });
                div.appendChild(table);
                div.appendChild(log);

                updateSelectedRow();
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
            scheme: showRecord
        };

        GNN.JSONP.retrieve({
            master:   apiMaster,
            user:     apiUser,
            scheme:   apiScheme,
            template: apiTempl,
            async: async
        }, function(json) {
            // show records
            showRecord(json);
        }, jsonpFailure);
    }
};
