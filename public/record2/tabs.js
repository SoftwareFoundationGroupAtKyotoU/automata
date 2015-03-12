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

var LogView = function(prefix, id, admin) {
    var pre = function(x) {
        return GNN.UI.$new('pre', { child: GNN.UI.$node(x) });
    };

    var defs = [
        { prop: 'timestamp',
          label: 'ステータス更新日時',
          node: GNN.UI.$node
        },
        { prop: 'submit',
          label: '提出日時',
          node: GNN.UI.$node
        },
        { prop: 'initial_submit',
          label: '初回提出',
          node: GNN.UI.$node
        },
        { prop: 'message',
          label: 'メッセージ',
          node: GNN.UI.$node,
          editable: true
        },
        { prop: 'error',
          label: 'エラー',
          node: pre,
          editable: true
        },
        { prop: 'reason',
          label: 'エラーの詳細',
          node: pre,
          editable: true
        },
        { prop: 'test',
          label: 'テスト通過率',
          node: function(test) {
              var rate;
              if (test === null) {
                  rate = GNN.UI.$node('0/0');
              } else {
                  rate = GNN.UI.$node(test.passed+'/'+test.number);
                  if (test.passed !== test.number) {
                      rate = GNN.UI.$new('em', { child: rate });
                  }
              }
              return rate;
          }
        }
    ];

    var ppLog = function(parent, logs, edit) {
        var r = [];
        var params = {};
        defs.forEach(function(def) {
            var l = logs.reduce(function(r, x) {
                return r || x[def.prop];
            }, null);
            if (l || (def.editable && edit)) {
                parent.appendChild(GNN.UI.$new('dt', {
                    klass: def.prop, child: def.label
                }));

                var node;
                if (edit && def.editable) {
                    node = GNN.UI.$new('textarea', {
                        attr: { cols: 80, rows: 2 },
                        child: l || ''
                    });
                    params[def.prop] = node;
                } else {
                    node = def.node(l);
                }
                parent.appendChild(GNN.UI.$new('dd', {
                    klass: def.prop, child: node
                }));
                r.push(def.prop);
            }
        });
        return { keys: r, params: params };
    };

    var makeLogMsg = function(record) {
        if (!record.timestamp && !record.log) return 'なし';

        var dl = GNN.UI.$new('dl', { klass: 'log_msg' });
        var list = ppLog(dl, [ record, record.log ]).keys;
        for (var prop in record.log) {
            if (list.indexOf(prop) < 0) {
                dl.appendChild(GNN.UI.$new('dt', {
                    klass: 'etc', child: prop
                }));
                dl.appendChild(GNN.UI.$new('dd', {
                    klass: 'etc', child: pre(record.log[prop])
                }));
            }
        }

        return dl;
    };

    var logEditMode = function(target, record, view, button, restore) {
        var dl = GNN.UI.$new('dl', { klass: 'log_msg' });
        var params = ppLog(dl, [ record, record.log ], true).params;

        editMode(function(form){ form.appendChild(dl); }, function() {
            var args = {};
            for (var k in params) {
                var param = params[k];
                if (param.value.length != 0) args[k] = param.value;
            }
            args.id = record.submit; args.user = target; args.report = id;
            var update = function(){ admin.update(id, target); };
            admin.editLog(args, update, update);
        }, view, new ToolButton(button), restore);
    };

    var self = {
        name: 'log',
        label: 'ログ',
        show: function(target, toolbar, view) {
            view.set(loadingIcon());

            GNN.XHR.json.retrieve({ user: api('user', {
                report: id, user: target,
                type: 'status', status: 'record', log: 1
            }) }, function(json) {
                var record = ((json.user[0]||{}).report||[])[id];
                var msg = makeLogMsg(record || {});
                view.set(msg);

                if (admin && record) {
                    var a = GNN.UI.$new('a', {
                        attr: { href: '.' }, child: '\u270f 編集'
                    });
                    toolbar.reset();
                    toolbar.addButton(a);
                    new GNN.UI.Observer(a, 'onclick', function(e) {
                        e.stop();
                        logEditMode(target, record, view, e.target(), msg);
                    });
                }
            }, function() {
                view.set('読み込み失敗');
            });
        }
    };

    return self;
};

var SolvedView = function(prefix, id, admin) {
    var List = function(target) {
        var getUserRecord = function(record, what) {
            record = record.reduce(function(r, u) {
                return u.token == target ? u : r;
            }, {}).report;
            record = ((record||{})[id]||{})[what];
            if (!record) return;
            record = record.map(function(r) {
                return r instanceof Array ? r[0] : r;
            });
            return record;
        };

        var makeList = function(record, name, label) {
            record = getUserRecord(record, name);
            if (!record) return;
            var h = GNN.UI.$new('h3', { child: label });
            var list = [ h ];

            if (record.length > 0) {
                var ul = GNN.UI.$new('ul', { klass: name });
                record.forEach(function(r) {
                    ul.appendChild(GNN.UI.$new('li', { child: r }));
                });
                list.push(ul);
            } else {
                list.push(GNN.UI.$new('p', { child: 'なし' }));
            }

            return list;
        };

        var solvedEditMode = function(solved, view, button, restore) {
            view.set(loadingIcon());
            var btn = new ToolButton(button);
            btn.disable();

            var ul = GNN.UI.$new('ul', { klass: 'ex' });
            var div = GNN.UI.$new('div', { klass: 'list_view', child: ul });

            var uri = api('scheme', { id: id, exercise: true });
            GNN.XHR.json.retrieve({ result: uri }, function(json) {
                var exs = json.result[0].exercise;
                makeExerciseSelector(ul, exs, solved, ['ex', id].join('_'));

                editMode(function(form){ form.appendChild(div); }, function() {
                    var checks = ul.getElementsByTagName('input');
                    var checked = [];
                    for (var i=0; i<checks.length; i++) {
                        if (checks[i].checked) checked.push(checks[i].value);
                    }

                    var update = function(){ admin.update(id, target); };
                    admin.editSolved({
                        user: target, report: id, exercise: checked.join(',')
                    }, update, update);
                }, view, btn, restore);
            }, function() {
                view.set(restore);
            });
        };

        return {
            show: function(toolbar, view) {
                view.set(loadingIcon());

                var apiSolved = api('user', {
                    user: target, report: id, type: 'status', status: 'solved'
                });
                var apiUnsolved = api('user', {
                    user: target, report: id, type: 'status', status: 'record'
                });
                GNN.XHR.json.retrieve({
                    solved: apiSolved, unsolved: apiUnsolved
                }, function(json) {
                    var ls1 = makeList(json.solved, 'solved', '解答済み');
                    if (!ls1) {
                        view.set('なし');
                        return;
                    }
                    var ls2 = makeList(json.unsolved, 'unsolved', '未解答');
                    var ls = ls1.concat(ls2 || []);
                    view.set(ls);

                    if (admin) {
                        var a = GNN.UI.$new('a', {
                            attr: { href: '.' }, child: '\u270f 編集'
                        });
                        toolbar.reset();
                        toolbar.addButton(a);
                        new GNN.UI.Observer(a, 'onclick', function(e) {
                            e.stop();
                            var solved = getUserRecord(json.solved, 'solved');
                            solvedEditMode(solved||[], view, e.target(), ls);
                        });
                    }
                }, function() {
                    view.set('読み込み失敗');
                });
            }
        };
    };
    var lists = {};

    return {
        name: 'solved',
        label: '解答状況',
        show: function(target, toolbar, view) {
            if (!lists[target]) lists[target] = new List(target);
            lists[target].show(toolbar, view);
        }
    };
};

var TestResultView = function(prefix, id, admin) {
    var $new = GNN.UI.$new;

    var List = function(target) {
        var header = function(name) {
            return $new('h3', { child: name });
        };

        var pre = function(x) {
            return GNN.UI.$new('pre', { child: GNN.UI.$node(x) });
        };

        var isPassed = function(t) {
            if (typeof t != 'string') t = t.result;
            return new RegExp('^\\s*ok\\s*', 'i').test(t);
        };

        var isBrief = function(t) {
            return defs.map(function(x){
                return t[x.prop];
            }).filter(function(x) {
                return !!x;
            }).length <= 1;
        };

        var defs = [
            { prop: 'result',
              name: 'result',
              node: function(x){ return isPassed(x) ? 'passed' : 'failed'; }
            },
            { prop: 'description',
              name: 'test',
              node: pre
            },
            { prop: 'expected',
              name: 'expected',
              node: pre
            },
            { prop: 'returned',
              name: 'returned',
              node: pre
            },
            { prop: 'exception',
              name: 'error',
              node: pre
            }
        ];

        return {
            show: function(toolbar, view) {
                view.set(loadingIcon());

                if (admin) {
                    var a = $new('a', {
                        attr: { href: '.' }, child: '\u26a1 テストを再実行'
                    });
                    toolbar.reset();
                    toolbar.addButton(a);

                    new GNN.UI.Observer(a, 'onclick', function(e) {
                        e.stop();
                        admin.runTest(target, id, function() {
                            admin.update(id, target);
                        });
                    });
                }

                var uri = api('test_result', { user: target, report: id });
                GNN.XHR.json.retrieve({ test: uri }, function(json) {
                    var t = json.test;
                    if (!t ||
                        typeof t.passed == 'undefined' ||
                        typeof t.number == 'undefined') {
                        view.set('なし');
                        return;
                    }

                    var list = [
                        header('通過率'),
                        $new('p', {
                            child: t.passed == t.number ?
                                    t.passed+'/'+t.number :
                                    [ GNN.UI.$new('em', { child: t.passed }),
                                      '/'+t.number ]
                        }),
                        header('詳細')
                    ];

                    if (t.detail) {
                        var testcase = $new('dl', {
                            klass: 'testcase',
                            child: t.detail.reduce(function(list, c) {
                                if (!c.result) c.result = 'fail';

                                var table = $new('table', {
                                    child: defs.reduce(function(r, d) {
                                        var val = c[d.prop];
                                        if (val) {
                                            var node = d.node(val);
                                            var tr = $new('tr', { child: [
                                                $new('th', { child: d.name }),
                                                $new('td', { child: node })
                                            ] });
                                            return r.concat([ tr ]);
                                        } else {
                                            return r;
                                        }
                                    }, [])
                                });
                                if (isBrief(c)) table = '';

                                var k = isPassed(c) ? 'passed' : 'failed';
                                return list.concat([
                                    $new('dt', { child: c.name, klass: k }),
                                    $new('dd', { child: table, klass: k })
                                ]);
                            }, [])
                        });
                        list.push(testcase);
                    } else {
                        list.push(GNN.UI.$new('p', { child: '非公開' }));
                    }

                    view.set(list);
                }, function() {
                    view.set('読み込み失敗');
                });
            }
        };
    };
    var lists = {};

    return {
        name: 'test',
        label: 'テスト結果',
        show: function(target, toolbar, view) {
            if (!lists[target]) lists[target] = new List(target);
            lists[target].show(toolbar, view);
        }
    };
};

var FileBrowserView = function(prefix, id) {
    var $new = GNN.UI.$new;
    var $text = GNN.UI.$text;

    var Breadcrum = function(browser, parent) {
        var ul = $new('ul', {
            id: [ prefix, 'breadcrum' ].join('_'),
            klass: 'breadcrums'
        });

        var descend = function(path) {
            return path.split('/').reduce(function(r, p) {
                r[1].push(p);
                r[0].push({ name: p, path: r[1].join('/') });
                return r;
            }, [ [], [] ])[0];
        };
        return {
            set: function(location) {
                if (!GNN.UI.$([ prefix, 'breadcrum' ].join('_'))) {
                    parent.add([ '場所:', ul ]);
                }
                GNN.UI.removeAllChildren(ul);

                var list = descend(location.path).map(function(p) {
                    p.type = 'dir';
                    return p;
                });
                list[list.length-1].type = location.type;

                list.forEach(function(loc) {
                    if (loc.name == '.') loc.name = id;

                    var a = $new('a', {
                        child: loc.name,
                        attr: { href: browser.path2uri(loc.path) }
                    });
                    new GNN.UI.Observer(a, 'onclick', function(e) {
                        e.stop();
                        browser.onMove(loc);
                    });

                    ul.appendChild($new('li', { child: a }));
                });
            }
        };
    };

    var Browser = function(target, location) {
        var encodePath = function(path) {
            return [
                [ '&', '%26' ],
                [ '\\?', '%3F' ]
            ].reduce(function(r, x) {
                return r.replace(new RegExp(x[0], 'g'), x[1]);
            }, encodeURI(path));
        };
        var apiBrowse = function(params) {
            params.path = encodePath(params.path);
            return api('browse', params);
        };
        var rawPath = function(user, report, path) {
            var uri = base();
            var epath = encodePath(path);
            uri.local.push('browse', user, report, epath);
            if (path != epath) uri.params.path = epath;
            return uri+'';
        };

        var self = {
            location: { path: '.', type: 'dir' },
            breadcrum: null,
            toolbar: null,
            view: null,
            persistent: null,
            reset: function(location) {
                this.view.set(loadingIcon());
                this.location = location;
                this.persistent.set('location', location);

                this.toolbar.reset();
                this.breadcrum.set(location);
            },
            path2uri: function(path) {
                return rawPath(target, id, path);
            },
            path: function(location){ return this.path2uri(location.path); },
            icon: function(location) {
                return $new('img', {
                    attr: { src: './'+location.type+'.png' },
                    klass: 'icon'
                });
            },
            dir: function(location, callback) {
                if (location.path == '.') location.name = id;
                this.reset(location);

                new GNN.XHR.json(apiBrowse({
                    user: target,
                    report: id,
                    path: location.path
                }), function(entries) {
                    callback(entries);
                    self.view.set(callback(entries));
                }, function() {
                    self.view.set($text('読み込み失敗'));
                });
            },
            file: function(location) {
                delete location.time;
                this.reset(location);
                this.toolbar.addButton($new('a', {
                    child: '\u23ce 直接開く',
                    attr: { href: this.path2uri(location.path) }
                }));

                var req = new XMLHttpRequest();
                var uri = apiBrowse({
                    user: target, report: id, type: 'highlight',
                    path: location.path
                });
                uri.params['timestamp'] = encodeURI(new Date());
                req.open('GET', uri+ '');
                req.onreadystatechange = function(e) {
                    if (req.readyState == 4) {
                        if (200 <= req.status && req.status < 300 &&
                            req.responseText) {
                            var div = $new('div');
                            var text = req.responseText;
                            text = text.replace(/<pre>\n/, '<pre>');
                            div.innerHTML = text;

                            pre = div.getElementsByTagName('pre')[0];
                            fileViewer.open(pre.innerHTML+'');
                            fileViewer.applyStyleFromSource(req.responseText);

                            self.view.set(fileViewer.view);
                        } else {
                            self.view.set($text('読み込み失敗'));
                        }
                    }
                };
                req.send(null);
            },
            onMove: function(location) {
                var self = this;
                this.persistent.history.track(function() {
                    self.move(location);
                });
            }
        };

        var fileViewer = new FileBrowser.FileViewer();
        var browser = new FileBrowser({ handler: self });

        self.move = function(location) {
            browser.move(location);
        };

        self.show = function(toolbar, view) {
            this.breadcrum = new Breadcrum(this, toolbar);
            this.toolbar = toolbar;
            this.view = view;

            var keys = [ target, 'browser' ];
            this.persistent = new Persistent.Entry(this.view.persistent, keys);

            this.move(this.persistent.get('location') || this.location);
        };

        return self;
    };
    var browsers = {};

    return {
        name: 'file',
        label: 'ファイル一覧',
        show: function(target, toolbar, view) {
            if (!browsers[target]) browsers[target] = new Browser(target);
            browsers[target].show(toolbar, view);
        }
    };
};

var CommentView = function(prefix, id, updater, admin) {
    var $new = GNN.UI.$new;

    var acl2text = function(acl) {
        acl = acl || [];
        if (acl.indexOf('user') >= 0 && acl.indexOf('other') >= 0) {
            return '全員に公開';
        } else if (acl.indexOf('user') >= 0) {
            return '提出者に公開';
        } else if (acl.indexOf('other') >= 0) {
            return '提出者以外に公開';
        } else {
            return '非公開';
        }
    };

    var makeForm = function(target, action, config, entry, onCancel) {
        entry = entry || {};
        entry.content = entry.content || '';
        entry.acl = entry.acl || config.acl || [];
        var textarea = $new('textarea', {
            child: entry.content,
            attr: { rows: 6 }
        });
        new GNN.UI.Observer(textarea, 'onkeypress', function(e) {
            e.stopPropagation();
        });
        var submit = $new('input', { attr: {
            type: 'submit', value: 'コメントする'
        } });
        var preview = $new('input', { attr: {
            type: 'button', value: 'プレビュー'
        } });
        var form = $new('div', { klass: 'form', child: [
            textarea, submit, preview
        ] });

        if (onCancel) {
            var cancel = $new('input', { attr: {
                type: 'button', value: 'キャンセル'
            } });
            new GNN.UI.Observer(cancel, 'onclick', onCancel);
            form.appendChild(cancel);
        }

        var aclChecks;
        if (admin) {
            aclChecks = [];
            [ 'user', 'other' ].forEach(function(a) {
                var check_id = [
                    prefix, 'comment'+(entry.id||''), 'acl', a
                ].join('_');
                var check = $new('input', {
                    id: check_id, attr: { type: 'checkbox', name: a }
                });
                if (entry.acl.indexOf(a) >= 0) {
                    check.checked = true;
                }
                var label = $new('label', {
                    child: acl2text([a]),
                    attr: { 'for': check_id }
                } );
                form.appendChild(check);
                form.appendChild(label);
                aclChecks.push(check);
            });
        }

        var onSubmit = function(e) {
            e.stop();
            e.disable();
            if (aclChecks) {
                entry.acl = aclChecks.filter(function(a) {
                    return a.checked;
                }).map(function(a) {
                    return a.name;
                });
            }
            var args = {
                user: target, report: id, action: action,
                acl: entry.acl.join(','),
                message: textarea.value
            };
            if (textarea.value.replace(/\s*/, '') == '') {
                e.enable();
                return;
            }
            if (typeof entry.id != 'undefined') args.id = entry.id+'';
            var update = function(){ updater.record(id, target); };
            apiPost('comment', args, update, function(r) {
                if (r.status == 400) {
                    var res = r.responseText;
                    if (/size limit exceeded/.test(res)) {
                        alert('コメントが長過ぎます');
                        e.enable();
                        return;
                    }
                }
                update();
            });
        };
        var onPreview = function(e) {
            e.stop();
            var preview = e.target();

            apiPost('comment', {
                action: 'preview', message: textarea.value
            }, function(r) {
                var div = $new('div', { klass: 'preview message' });
                div.innerHTML = r.responseText;
                textarea.parentNode.replaceChild(div, textarea);

                var restore = $new('input', { attr: {
                    type: 'button', value: '再編集'
                } });
                new GNN.UI.Observer(restore, 'onclick', function(e) {
                    e.stop();
                    var restore = e.target();
                    div.parentNode.replaceChild(textarea, div);
                    restore.parentNode.replaceChild(preview, restore);
                });
                preview.parentNode.replaceChild(restore, preview);
            }, function(r) {
                alert('プレビュー失敗');
            });
        };
        new GNN.UI.Observer(submit, 'onclick', onSubmit);
        new GNN.UI.Observer(form, 'onsubmit', onSubmit);
        new GNN.UI.Observer(preview, 'onclick', onPreview);

        return form;
    };

    var self = {
        name: 'comment',
        label: 'コメント',
        show: function(target, toolbar, view) {
            view.set(loadingIcon());
            var update = function(){ updater.record(id, target); };

            GNN.XHR.json.retrieve({
                master: api('master', { user: true }),
                config: api('comment', { action: 'config' }),
                entries: api('comment', {
                    user: target, report: id, action: 'get'
                }),
                news: api('comment', {
                    user: target, report: id, action: 'news'
                })
            }, function(json) {
                var ul = $new('ul', { klass: 'comments' });
                var lastId;
                var unreads = (json.news||{}).unreads||0;
                var unreadId;

                json.entries.forEach(function(e, i) {
                    var eid = e.id;
                    var nodeId = [ prefix, target, 'comment'+eid ].join('-');
                    lastId = eid;
                    if (i + unreads == json.entries.length) unreadId = nodeId;

                    var edit_tools = $new('p', { klass: 'edit' });
                    var meta = $new('div', { klass: 'meta', child: [
                        $new('p', { klass: 'author', child: e.user_name }),
                        edit_tools,
                        $new('p', { klass: 'acl', child: acl2text(e.acl) }),
                        $new('p', { klass: 'date', child: e.create })
                    ] });

                    var message = $new('div', { klass: 'message' });
                    message.innerHTML = e.content;

                    ul.appendChild($new('li', { id: nodeId, child: [
                        meta, message
                    ], klass: (e.acl||[]).length==0 ? 'private' : '' }));

                    if (admin || e.user == json.master.user) {
                        var edit = $new('a', { child: '\u270f', attr: {
                            href: '.', title: '編集する'
                        } });
                        var del = $new('a', { child: '\u2716', attr: {
                            href: '.', title: '削除する'
                        }});
                        edit_tools.appendChild(edit);
                        edit_tools.appendChild(del);

                        var onEdit = function(entry) {
                            var u = target;
                            var c = json.config;
                            var parent = message.parentNode;
                            var form;
                            var cancel = function(e) {
                                e.stop();
                                parent.replaceChild(message, form);
                            };
                            form = makeForm(u, 'edit', c, entry, cancel);
                            parent.replaceChild(form, message);

                            var ta = form.getElementsByTagName('textarea');
                            if (ta[0]) ta[0].focus();
                        };
                        new GNN.UI.Observer(edit, 'onclick', function(e) {
                            e.stop();
                            new GNN.XHR.json(api('comment', {
                                user: target, report: id, action: 'get',
                                id: eid, type: 'raw'
                            }), function(entries) {
                                onEdit(entries[0]||{});
                            });
                        });
                        new GNN.UI.Observer(del, 'onclick', function(e) {
                            e.stop();
                            if (confirm('このコメントを削除しますか?')) {
                                apiPost('comment', {
                                    action: 'delete', user: target, report: id,
                                    id: eid+''
                                }, update, update);
                            }
                        });
                    }
                });
                if (lastId) {
                    apiPost('comment', {
                        action: 'read', user: target, report: id, id: lastId+''
                    }, function() {
                        updater.comment(id, target);
                    });
                }

                var form;

                if (json.config.max <= json.entries.length) {
                    form = 'コメント数が上限に達しました';
                } else {
                    form = makeForm(target, 'post', json.config);
                }
                ul.appendChild($new('li', { child: form }));

                view.set(ul);

                if (unreadId) view.persistent.move('#'+unreadId);
            }, function() {
                view.set('読み込み失敗');
            });
        }
    };

    return self;
};
