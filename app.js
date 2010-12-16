var init = function(id) {
    var lexcmp = function(a, b) {
        if (a.length <= 0 && b.length <= 0) return 0;
        if (a.length <= 0) return -1;
        var a0 = a[0]; var b0 = b[0];
        var isNum = /^\d+$/;
        if (isNum.test(a0) && isNum(b0)) {
            a0 = parseInt(a0); b0 = parseInt(b0);
        }
        return a0 == b0 ? lexcmp(a.slice(1), b.slice(1)) : (a0 < b0 ? -1 : 1);
    };
    with (GNN.UI) {
        var select = function(json, id, name) {
            $('report_id').value = id;
            var selected = $('selected_report');
            removeAllChildren(selected);
            selected.appendChild($node(name));

            var ul = $('ex');
            removeAllChildren(ul);

            var report = json.report[id];
            var exes = [];
            for (var ex in report) exes.push(ex);
            exes.sort(function(a, b) {
                var regex = new RegExp('\\.');
                return lexcmp(a.split(regex), b.split(regex));
            }).forEach(function(ex) {
                var li = $new('li');
                var check = $new('input', {
                    id: ex,
                    attr: {
                        type: 'checkbox',
                        name: ex,
                        value: 'yes'
                    }
                });
                var name = ex;
                if (report[ex].level) {
                    var stars = '';
                    var level = parseInt(report[ex].level);
                    for (var i=0; i < level; i++) stars += '★';
                    name += '['+stars+']';
                }
                if (report[ex].required) {
                    name += ' [必修課題]';
                    check.checked = true;
                }
                var label = $new('label', {
                    child: $node(name),
                    attr: { 'for': ex }
                });
                li.appendChild(check);
                li.appendChild(label);
                ul.appendChild(li);
            });
        };

        var div = $(id);
        var uri = GNN.URI.location();
        uri.local.push('scheme.cgi')
        GNN.JSONP(uri, function(json) {
            // set year
            document.title = [
                document.title,
                ' (Winter Semester ', json.year, ')'
            ].join('');
            var spans = document.getElementsByTagName('span');
            for (var i=0; i < spans.length; i++) {
                if (spans[i].className == 'year') {
                    spans[i].appendChild($text(json.year));
                }
            }

            var login = $('login');
            login.appendChild($node(json.user));

            var scheme = {};
            json.scheme.forEach(function(rep) { scheme[rep.id] = rep; });

            json.post.forEach(function(id) {
                var selector = $('selector');
                var li = $new('li', { id: 'button_'+id });
                selector.appendChild(li);

                var button = $new('a', {
                    attr: { href: '.' },
                    child: $text(scheme[id].name)
                });
                new Observer(button, 'click', function(e) {
                    e.stop();
                    select(json, id, scheme[id].name);
                });
                li.appendChild(button);
            });

            var id = $('report_id').value;
            select(json, id, scheme[id].name);
        });
    }
};
