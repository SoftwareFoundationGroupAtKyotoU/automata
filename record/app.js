var init = function(id) {
    var base = function() {
        var uri = GNN.URI.location();
        uri.local.pop(); uri.local.pop();
        return uri;
    };
    var api = function(name, args) {
        var uri = base();
        uri.local.push('api');
        uri.local.push(name+'.cgi');
        uri.params = args || {};
        return uri;
    };
    var apiMaster = api('master', { year: true });
    var apiUser = api('user', { type: 'status', status: 'record', log: 1 });
    var apiScheme = api('scheme', { record: true });

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
                    if (typeof obj == 'boolean') obj = 'OK';
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
                case 'error': return $new('pre', { child: $node(msg) });
                case 'test case': return $new('pre', { child: $node(msg) });
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
            json.scheme.forEach(function(sc) { // for each report
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
                json.user.forEach(function(student) { // for each student
                    var setLog = function() {
                        closeLog();
                        var msg = makeLogMsg(record);
                        if (msg) log.appendChild(msg);
                    };

                    var tr = $new('tr');
                    var record = student.report[sc.id]||{};
                    sc.record.forEach(function(col) {
                        var td = $new('td', { klass: col.field });
                        tr.appendChild(td);

                        var fld = student[col.field];
                        fld = fld || record[col.field];
                        var text = toText(fld, col.field);

                        if (col.field == 'status' && (fld||'').length > 0) {
                            appendClass(td, fld.replace(/[^0-9a-zA-Z]/g, '-'));
                        }
                        if (col.field == 'status' && json.user.length > 1) {
                            var klass = sc.id+'-status';
                            text = $new('a', {
                                klass: klass,
                                attr: { href: '.' },
                                child: text
                            });
                            new Observer(text, 'onclick', function(e) {
                                var getParent = function(e) {
                                    return e.parentNode.parentNode;
                                };
                                e.stop();
                                var elem = e.event.target;
                                var parent = getParent(elem);

                                closeLog();
                                if (hasClass(parent, 'selected')) {
                                    removeClass(parent, 'selected');
                                } else {
                                    $select({
                                        tag: 'a', klass: klass
                                    }).forEach(function(e) {
                                        removeClass(getParent(e), 'selected');
                                    });
                                    appendClass(parent, 'selected');
                                    setLog();
                                }
                            });
                        } else if (col.field == 'status' && fld == 'check') {
                            var updateRecord = function() {
                                GNN.JSONP.retrieve({
                                    user: apiUser
                                }, function(json2) {
                                    json2.scheme = json.scheme;
                                    showRecord(json2);
                                });
                            };
                            setTimeout(updateRecord, 2000);
                            td.appendChild($new('img', {
                                klass: 'loading',
                                attr: { src: 'loading.gif' }
                            }));
                        }

                        td.appendChild($node(text));

                    });
                    table.appendChild(tr);

                    if (json.user.length == 1) setLog()
                });
                div.appendChild(table);
                div.appendChild(log);
            });
        };

        GNN.JSONP.retrieve({
            master: apiMaster,
            user: apiUser,
            scheme: apiScheme
        }, function(json) {
            setYear(json.master.year);
            showRecord(json);
        });
    }
};
