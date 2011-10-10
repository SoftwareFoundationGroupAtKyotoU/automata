var init = function() {
    with (GNN.UI) {
        var Uploader = function() {
            var self = {};

            var form = $('form');
            new Observer(form, 'onsubmit', function(e) {
                if ($('file').value == '') {
                    e.stop();
                    alert('ファイルを選択して下さい');
                }
            });

            self.reset = function() {
                self.unselectAll();
                if (!self.selected) {
                    var selected = $('report_id').value;
                    if (selected && selected.length && self.scheme) {
                        self.selected = self.scheme.reduce(function(r, x) {
                            return x.id == selected ? x : r;
                        }, null);
                    }
                }
                self.select(self.selected || (self.scheme||[])[0]);
            };

            self.setScheme = function(scheme) {
                scheme.forEach(function(report) {
                    var selector = $('selector');
                    var li = $new('li', { id: 'button_'+report.id });
                    selector.appendChild(li);

                    var button = $new('a', {
                        attr: { href: '.' },
                        child: $text(report.name)
                    });
                    new Observer(button, 'onclick', function(e) {
                        e.stop();
                        self.unselectAll();
                        self.select(report);
                    });
                    li.appendChild(button);
                });
                self.scheme = scheme;
                return self;
            };

            self.setSolved = function(solved) {
                self.solved = solved;
                return self;
            };

            self.unselect = function(id) {
                var button = $('button_'+id);
                button.className = '';
            };

            self.unselectAll = function() {
                if (!self.scheme) return;
                self.scheme.forEach(function(report){
                    self.unselect(report.id);
                });
            };

            self.select = function(report) {
                if (!report) return;
                self.selected = report;
                $('report_id').value = report.id;

                // report selector
                var button = $('button_'+report.id);
                button.className = 'selected';

                // show selected report
                var selected = $('selected_report');
                removeAllChildren(selected);
                selected.appendChild($node(report.name));

                // requirements depending on selected exercises
                var nodeOfReq = function(r) {
                    var li = $new('li');
                    switch (r.type) {
                    case 'code':
                        li.appendChild($new('code', {
                            child: $node(r.value)
                        }));
                        break;
                    case 'html':
                        li.innerHTML = r.value;
                        break;
                    case 'text':
                        li.appendChild($node(r.value));
                        break;
                    default:
                        return;
                    }
                    return li;
                };
                var updateReqs = function() {
                    var reqs = report.requirements;
                    if (reqs && reqs.dynamic) {
                        reqs.dynamic.forEach(function(d) {
                            var target = $(d.target);
                            if (!target) return;
                            removeAllChildren(target);

                            var list = d['default'];
                            for (var x in d) {
                                var node = $('ex'+x);
                                if (node && node.checked) {
                                    d[x].forEach(function(r) {
                                        list = list.map(function(s) {
                                            return s.name == r.name ? r : s;
                                        });
                                    });
                                    var rest = d[x].filter(function(r) {
                                        return !list.some(function(s) {
                                            return s.name == r.name;
                                        });
                                    });
                                    list = list.concat(rest);
                                }
                            }

                            list.forEach(function(r) {
                                var node = nodeOfReq(r);
                                if (node) target.appendChild(node);
                            });
                        });
                    }
                };

                // exercise selector
                var ul = $('ex');
                removeAllChildren(ul);

                var solved = self.solved || {};
                solved = (solved[report.id]||{}).solved || [];
                if (solved.length <= 0) solved = null;
                var exercises = report.exercise||[];
                makeExerciseSelector(ul, exercises, solved, 'ex', updateReqs);

                // requirements
                reqs = $('requirements')
                removeAllChildren(reqs);
                if (report.requirements) {
                    sttc = report.requirements['static'];
                    if (sttc) {
                        sttc.forEach(function(r) {
                            node = nodeOfReq(r);
                            if (node) reqs.appendChild(node);
                        });
                    }
                }
                updateReqs();
            };

            return self;
        };

        var uploader = new Uploader();

        var async = {
            template: function(json) {
                // fill page template
                setTitle(json.template);
                addLinks(json.template.links);
            },
            master: function(json) {
                // set login name
                var login = $('login');
                login.appendChild($node(json.master.user));

                // load solved data
                new GNN.JSONP(api('user', {
                    user: json.master.user,
                    type: 'status',
                    status: 'solved'
                }), function(user) {
                    user = user[0]||{};
                    var report;
                    if (user.token==json.master.token) report=user.report;
                    uploader.setSolved(report||{});
                    uploader.reset();
                });
            },
            scheme: function(json) {
                uploader.setScheme(json.scheme);
                uploader.reset();

                // get exercise list
                var apis = { async: {} };
                json.scheme.forEach(function(report, i) {
                    apis[report.id] = api('scheme', {
                        id: report.id, type: 'post', exercise: true
                    });
                    apis.async[report.id] = function(r) {
                        report.exercise = r[report.id][0].exercise;
                        uploader.reset();
                    };
                });
                GNN.JSONP.retrieve(apis, null, jsonpFailure);
            },
            reqs: {
                keys: 'scheme reqs'.split(' '),
                callback: function(json) {
                    json.scheme.forEach(function(rep) {
                        var req = json.reqs.requirements[rep.id];
                        if (req) rep.requirements = req;
                    });
                    uploader.reset();
                }
            }
        };

        GNN.JSONP.retrieve({
            master: api('master', { year: true, user: true, token: true }),
            template: api('template', { type: 'none', links: true }),
            scheme: api('scheme', { type: 'post' }),
            reqs: api('template', { type: 'post', requirements: true }),
            async: async
        }, null, jsonpFailure);
    }
};
