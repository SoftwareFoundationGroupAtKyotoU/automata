var init = function() {
    var base = function() {
        var uri = GNN.URI.location();
        uri.local.pop();
        return uri;
    };
    var api = function(name, args) {
        var uri = base();
        uri.local.push('api');
        uri.local.push(name+'.cgi');
        uri.params = args || {};
        return uri;
    };

    with (GNN.UI) {
        var Uploader = function(scheme, solved) {
            var self = {};

            var form = $('form');
            new Observer(form, 'onsubmit', function(e) {
                if ($('file').value == '') {
                    e.stop();
                    alert('ファイルを選択して下さい');
                }
            });

            scheme.forEach(function(report) {
                var selector = $('selector');
                var li = $new('li', { id: 'button_'+report.id });
                selector.appendChild(li);

                var button = $new('a', {
                    attr: { href: '.' },
                    child: $text(report.name)
                });
                new Observer(button, 'click', function(e) {
                    e.stop();
                    self.unselectAll();
                    self.select(report);
                });
                li.appendChild(button);
            });

            self.unselect = function(id) {
                var button = $('button_'+id);
                button.className = '';
                var notice = $('notice_'+id);
                notice.style.display = 'none';
            };

            self.unselectAll = function() {
                scheme.forEach(function(report){ self.unselect(report.id); });
            };

            self.select = function(report) {
                $('report_id').value = report.id;
                var selected = $('selected_report');
                removeAllChildren(selected);
                selected.appendChild($node(report.name));

                var button = $('button_'+report.id);
                button.className = 'selected';
                var notice = $('notice_'+report.id);
                notice.style.display = 'block';

                var ul = $('ex');
                removeAllChildren(ul);

                var lastSolved = (solved[report.id]||{}).solved;
                report.exercise.forEach(function(ex) {
                    var name = ex[0];
                    var option = ex[1];
                    var li = $new('li');
                    var check = $new('input', {
                        id: name,
                        attr: {
                            type: 'checkbox',
                            name: name,
                            value: 'yes'
                        }
                    });
                    if (lastSolved && lastSolved.indexOf(name) >= 0) {
                        check.checked = true;
                    }
                    if (option.level) {
                        var stars = '';
                        var level = parseInt(option.level);
                        for (var i=0; i < level; i++) stars += '★';
                        name += '['+stars+']';
                    }
                    if (option.required) {
                        name += ' [必修課題]';
                        if (!(lastSolved||[]).length) check.checked = true;
                    }
                    var label = $new('label', {
                        child: $node(name),
                        attr: { 'for': name }
                    });
                    li.appendChild(check);
                    li.appendChild(label);
                    ul.appendChild(li);
                });
            };

            self.unselectAll();
            self.select(scheme[0]);

            return self;
        };

        GNN.JSONP.retrieve({
            master: api('master', { year: true, user: true }),
            scheme: api('scheme', { type: 'post', exercise: true })
        }, function(json) {
            // set year
            document.title = [
                document.title,
                ' (Winter Semester ', json.master.year, ')'
            ].join('');
            var spans = document.getElementsByTagName('span');
            for (var i=0; i < spans.length; i++) {
                if (spans[i].className == 'year') {
                    spans[i].appendChild($text(json.master.year));
                }
            }

            // set login name
            var login = $('login');
            login.appendChild($node(json.master.user));

            new GNN.JSONP(api('user', {
                user: json.master.user,
                type: 'status',
                status: 'solved'
            }), function(user) {
                // setup uploader
                user = user[0]||{};
                var report = user.login==json.master.user ? user.report : null;
                new Uploader(json.scheme, report||{});
            });
        });
    }
};
