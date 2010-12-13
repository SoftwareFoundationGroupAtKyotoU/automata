var init = function(id) {
    with (GNN.UI) {
        var div = GNN.UI.$(id);
        var uri = GNN.URI.location();
        uri.local.push('json.cgi')
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

            // put timestamp
            $('timestamp').appendChild($text(json.timestamp||''));

            // textify function specific to the field
            var toText = function(obj, klass) {
                switch (klass) {
                case 'status':
                    return obj ? '提出済' : '';
                case 'unsolved':
                    return obj.map(function(x) {
                        if (x[1] == 1) {
                            return x[0];
                        } else {
                            return x[0] + 'のうち残り' + x[1] + '問';
                        }
                    }).join(', ');
                case 'optional':
                    // return obj.length+'';
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
                default:
                    return obj;
                }
            };

            // records
            json.scheme.forEach(function(sc) { // for each report
                var table = $new('table', {
                    id: sc.id,
                    summary: sc.id,
                    child: $new('tr', { child: sc.data.map(function(col) {
                        return $new('th', {
                            klass: col.field,
                            child: col.label
                        });
                    }) })
                });
                json.data.forEach(function(student) { // for each student
                    var tr = $new('tr');
                    sc.data.forEach(function(col) {
                        var fld = student[col.field];
                        fld = fld || (student.report[sc.id]||{})[col.field];
                        if (fld) {
                            tr.appendChild($new('td', {
                                klass: col.field,
                                child: toText(fld, col['field'])
                            }));
                        }
                    });
                    table.appendChild(tr);
                });
                div.appendChild(table);
            });
        });
    }
};
