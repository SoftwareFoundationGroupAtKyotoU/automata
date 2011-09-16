var StatusWindow = function(id, tabs) {
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
    var lastTab;

    var self = {
        window: window,
        target: null,
        tabs: {},
        add: function(tab) {
            this.tabs[tab.name] = tab;
            var self = this;
            var a = GNN.UI.$new('a', { attr: { href: '.' } });
            var button = GNN.UI.$new('li', {
                id: [ makeTabId(tab.name), 'button' ].join('_'),
                child: a,
                klass: 'status_tabbar_button'
            });
            a.appendChild(GNN.UI.$text(tab.label));
            tabbar.appendChild(button);
            new GNN.UI.Observer(a, 'onclick', function(e) {
                e.stop();
                if (self.target) self.show(self.target, tab.name, true);
            });
        },
        set: function(node) {
            GNN.UI.removeAllChildren(view);
            if (!(node instanceof Array)) node = [ node ];
            node.forEach(function(e){
                view.appendChild(GNN.UI.$node(e));
            });
        },
        show: function(target, tabName, force) {
            this.target = target;
            tabName = (!force && lastTab) || tabName;
            lastTab = tabName;

            for (var t in this.tabs) {
                var tab = this.tabs[t];
                var e = GNN.UI.$([ makeTabId(tab.name), 'button' ].join('_'));
                if (!e) continue;

                if (tab.name == tabName) {
                    GNN.UI.appendClass(e, 'selected');
                    GNN.UI.removeAllChildren(toolbar);
                    GNN.UI.removeAllChildren(view);
                    tab.show(target, toolbar, self);
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

var LogView = function(id, records) {
    var pre = function(x) {
        return GNN.UI.$new('pre', { child: GNN.UI.$node(x) });
    };

    var defs = [
        { prop: 'timestamp',
          label: '最終更新日時',
          node: GNN.UI.$node
        },
        { prop: 'submit',
          label: '提出日時',
          node: GNN.UI.$node
        },
        { prop: 'message',
          label: 'メッセージ',
          node: GNN.UI.$node
        },
        { prop: 'error',
          label: 'エラー',
          node: pre
        },
        { prop: 'reason',
          label: 'エラーの詳細',
          node: pre
        },
        { prop: 'test',
          label: 'テスト通過率',
          node: function(test) {
              return GNN.UI.$node(test.passed+'/'+test.number);
          }
        }
    ]

    var ppLog = function(parent, log) {
        var r = [];
        defs.forEach(function(def) {
            if (log[def.prop]) {
                var l = log[def.prop];
                parent.appendChild(GNN.UI.$new('dt', {
                    klass: def.prop,
                    child: def.label
                }));
                parent.appendChild(GNN.UI.$new('dd', {
                    klass: def.prop,
                    child: def.node(l)
                }));
                r.push(def.prop);
            }
        });
        return r;
    };

    var makeLogMsg = function(record) {
        if (!record.timestamp && !record.log) return null;

        var dl = GNN.UI.$new('dl', { klass: 'log_msg' });
        ppLog(dl, record);
        if (record.log) {
            var list = ppLog(dl, record.log);
            for (var prop in record.log) {
                if (list.indexOf(prop) < 0) {
                    dl.appendChild(GNN.UI.$new('dt', { child: prop }));
                    dl.appendChild(GNN.UI.$new('dd', {
                        child: GNN.UI.$new('pre', { child: record.log[prop] })
                    }));
                }
            }
        }

        return dl;
    };

    var self = {
        name: 'log',
        label: 'ログ',
        show: function(target, toolbar, view) {
            var student = records.reduce(function(r, u) {
                return target == u.token ? u : r;
            }, { report: {} });
            var record = student.report[id]||{};
            var msg = makeLogMsg(record);
            if (msg) view.set(msg);
        }
    };

    return self;
};

var SolvedView = function(id, records) {
    var List = function(target) {
        var getUserRecord = function(record, what) {
            record = record.reduce(function(r, u) {
                return u.token == target ? u : r;
            }, {}).report;
            record = ((record||{})[id]||{})[what] || [];
            record = record.map(function(r) {
                return r instanceof Array ? r[0] : r;
            });
            return record;
        };

        var makeList = function(record, name, label) {
            record = getUserRecord(record, name);
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

        return {
            show: function(toolbar, view) {
                view.set(loadingIcon());

                var uri = api('user', {
                    user: target, report: id, type: 'status', status: 'solved'
                });
                GNN.JSONP.retrieve({ user: uri }, function(json) {
                    var list1 = makeList(json.user, 'solved', '解答済み');
                    var list2 = makeList(records, 'unsolved', '未解答');
                    view.set(list1.concat(list2));
                }, function() {
                    view.set('読み込み失敗')
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

var TestResultView = function(id) {
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

        var defs = [
            { prop: 'result',
              name: 'result',
              node: function(x){ return isPassed(x) ? 'pass' : 'fail'; }
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

                var uri = api('test_result', { user: target, report: id });
                GNN.JSONP.retrieve({ test: uri }, function(json) {
                    var t = json.test;
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

                                var dl = $new('dl', {
                                    child: defs.reduce(function(r, d) {
                                        var val = c[d.prop];
                                        if (val) {
                                            var node = d.node(val);
                                            return r.concat([
                                                $new('dt', { child: d.name }),
                                                $new('dd', { child: node })
                                            ]);
                                        } else {
                                            return r;
                                        }
                                    }, [])
                                });

                                var k = isPassed(c) ? 'passed' : 'failed';
                                return list.concat([
                                    $new('dt', { child: c.name, klass: k }),
                                    $new('dd', { child: dl, klass: k })
                                ]);
                            }, [])
                        });
                        list.push(testcase);
                    } else {
                        list.push(GNN.UI.$new('p', { child: '非公開' }));
                    }

                    view.set(list);
                }, function() {
                    view.set('読み込み失敗')
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

var FileBrowserView = function(id) {
    var $new = GNN.UI.$new;
    var $text = GNN.UI.$text;

    var Breadcrum = function(browser, parent) {
        var ul = $new('ul', {
            id: [ id, 'breadcrum' ].join('_'),
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
                if (!GNN.UI.$([ id, 'breadcrum' ].join('_'))) {
                    parent.appendChild($new('li', { child: [
                        '場所:', ul
                    ]}));
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
                        attr: { href: browser.rawURI(loc.path) }
                    });
                    new GNN.UI.Observer(a, 'onclick', function(e) {
                        e.stop();
                        browser.move(loc);
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
        var humanReadableSize = function(size) {
            var prefix = [ '', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y' ];
            var i;
            for (i=0; size >= 1024 && i < prefix.length-1; i++) {
                size /= 1024;
            }
            if (i > 0) size = size.toFixed(1);
            return size + prefix[i];
        };

        var table = $new('table', {
            klass: 'file_browser'
        });

        var self = {
            view: table,
            location: location || { path: '.', type: 'dir' },
            rawURI: function(path) {
                return rawPath(target, id, path);
            },
            show: function(toolbar, view) {
                this.breadcrum = new Breadcrum(this, toolbar);
                this.toolbar = toolbar;
                view.set(this.view);
                this.move(this.location);
            }
        };

        var replaceView = function(node) {
            var parent = self.view.parentNode;
            GNN.UI.removeAllChildren(parent);
            parent.appendChild(node);
            self.view = node;
        };

        self.move = function(location) {
            GNN.UI.removeAllChildren(this.toolbar);

            replaceView(loadingIcon());
            this.location = location;
            this.breadcrum.set(location);

            if (location.type == 'dir') {
                GNN.JSONP.retrieve({
                    entries: apiBrowse({
                        user: target,
                        report: id,
                        path: location.path
                    })
                }, function(json) {
                    GNN.UI.removeAllChildren(table);
                    table.appendChild($new('tr', {
                        child: [
                            [ 'ファイル', 'file' ],
                            [ 'サイズ', 'size' ],
                            [ '更新日時', 'time' ]
                        ].map(function(t) {
                            return $new('th',{ child: t[0], klass: t[1] });
                        })
                    }));

                    json.entries.forEach(function(f) {
                        var path = location.path+'/'+f.name;
                        var a = $new('a', {
                            attr: { href: self.rawURI(path) },
                            child: $text(f.name + (f.type=='dir' ? '/' : ''))
                        });
                        if (f.type != 'bin') {
                            new GNN.UI.Observer(a, 'onclick', function(e) {
                                e.stop();
                                self.move({ path: path, type: f.type });
                            });
                        }

                        var size = humanReadableSize(f.size);
                        table.appendChild($new('tr', {
                            child: [
                                $new('td', {
                                    child: [
                                        $new('img', {
                                            attr: { src: './'+f.type+'.png' },
                                            klass: 'icon'
                                        }), a ],
                                    klass: 'file' }),
                                $new('td', { child: $text(size),
                                             klass: 'size' }),
                                $new('td', { child: $text(f.time),
                                             klass: 'time' })
                            ]
                        }));
                    });

                    replaceView(table);
                }, function() {
                    replaceView($text('読み込み失敗'));
                });
            } else  {
                var applyStyle = function(text) {
                    text = text.replace(/[\r\n]/g, '');
                    var regex = '<style[^>]*>(?:<!--)?(.*?)(?:-->)?</style>';
                    if (new RegExp(regex).test(text)) {
                        var style = $new('style', {
                            attr: { type: 'text/css' }
                        });

                        var css = '';
                        var rawcss = RegExp.$1;
                        var arr;
                        var re = new RegExp('\\s*([^\{]+?)\\s*{([^\}]*)}','g');
                        var rules = [];
                        while ((arr = re.exec(rawcss)) != null) {
                            if (arr[1].charAt(0) == '.') {
                                rules.push({selector: arr[1], style: arr[2]});
                            }
                        }

                        var d = document;
                        if (d.styleSheets[0].addRule) { // IE
                            rules.forEach(function(s) {
                                d.styleSheets[0].addRule(s.selector, s.style);
                            });
                        } else {
                            var head = d.getElementsByTagName('head')[0];
                            style.appendChild($text(rules.map(function(s) {
                                return s.selector+'{'+s.style+'}';
                            }).join("\n")));
                            head.appendChild(style);
                        }
                    }
                };
                var showContent = function(node) {
                    var row = $new('tr');
                    var view = $new('table', {
                        klass: 'file_browser file',
                        child: row
                    });

                    // line number
                    var content = node.innerHTML+'';
                    if (content.charAt(content.length-1) != "\n") {
                        content += "\n";
                    }
                    var ln = $new('pre');
                    var i = 1, arr;
                    var re = new RegExp("\n", 'g');
                    while ((arr = re.exec(content)) != null) {
                        ln.appendChild($text(i++ + "\n"));
                    }

                    row.appendChild($new('td', {
                        klass: 'linenumber',
                        child: ln
                    }));
                    row.appendChild($new('td', {
                        klass: 'content',
                        child: node
                    }));
                    replaceView(view);
                };

                this.toolbar.appendChild($new('li', {
                    klass: 'toolbutton',
                    child: $new('a', {
                        child: '直接開く',
                        attr: { href: rawPath(target, id, location.path) }
                    })
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
                            showContent(pre);

                            applyStyle(req.responseText);
                        } else {
                            replaceView($text('読み込み失敗'));
                        }
                    }
                }
                req.send(null);
            }
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
