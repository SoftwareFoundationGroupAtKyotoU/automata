var React = require('react');

var FileEntry = (function() {
    var humanReadableSize = function(size) {
        var prefix = [ '', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y' ];
        var i;
        for (i=0; size >= 1024 && i < prefix.length-1; i++) {
            size /= 1024;
        }
        if (i > 0) size = size.toFixed(1);
        return size + prefix[i];
    };

    return React.createClass({
        onclick: function (e) {
            e.preventDefault();

            var p = this.props;
            if (p.entry.type === 'bin') return;

            p.open(p.path+'/'+p.entry.name, p.entry.type);
        },

        render: function() {
            var p = this.props;
            var entry = p.entry;
            var uri = FileView.rawPath(p.token, p.report, p.path+'/'+p.entry.name);
            var onclick = this.onclick;
            var suffix = entry.type === 'dir' ? '/' : '';

            return (
                <tr>
                    <td className="file">
                        <img className="icon"
                             src={"./" + entry.type + ".png"} />
                        <a href={uri} onClick={onclick}>{entry.name + suffix}</a>
                    </td>
                    <td className="size">{humanReadableSize(entry.size)}</td>
                    <td className="time">{entry.time}</td>
                </tr>
            );
        }
    });
})();

var Breadcrum = (function() {
    var descend = function(path) {
        return path.split('/').reduce(function(r, p) {
            r[1].push(p);
            r[0].push({ name: p, path: r[1].join('/') });
            return r;
        }, [ [], [] ])[0];
    };

    return React.createClass({
        rawPath: function(path) {
            return FileView.rawPath(this.props.token, this.props.report, path);
        },

        render: function() {
            var p = this.props;
            var list = descend(p.path).map(function(p) {
                p.type = 'dir';
                return p;
            });
            last = list[list.length-1];
            last.type = p.type;

            var toolButton = last.type === 'dir' ? null :
                <li className="toolbutton">
                    <a href={this.rawPath(last.path)}>⏎ 直接開く</a></li>;

            var self = this;
            var items = list.map(function(loc) {
                if (loc.name == '.') loc.name = p.report;

                var onclick = function(e) {
                    e.preventDefault();
                    p.open(loc.path, loc.type);
                };
                var uri = self.rawPath(loc.path);
                return <li><a href={uri} onClick={onclick}>{loc.name}</a></li>;
            });

            return (<ul id={"summary-" + p.report + "_status_toolbar"}
                         className="status_toolbar">
                        <li>場所:
                            <ul id={p.report + '-breadcrum'}
                                className='breadcrums'>{items}</ul>
                        </li>
                        {toolButton}
                    </ul>);
        }
    });
})();

var FileBrowser = React.createClass({
    render: function() {
        var p = this.props;
        var rows = p.entries.map(function(entry) {
            return (<FileEntry entry={entry}
                               path={p.path}
                               token={p.token}
                               report={p.report}
                               parent={self}
                               open={p.open}
                    />);
        });

        return (
            <table className="file_browser">
                <tr>
                    <th className="file">ファイル</th>
                    <th className="size">サイズ</th>
                    <th className="time">更新日時</th>
                </tr>
                {rows}
            </table>
        );
    }
});

var FileViewer = (function() {
    return React.createClass({
        render: function() {
            var content = this.props.content;

            // line number
            var ln = '';
            var i = 1, arr;
            var re = new RegExp("\n", 'g');
            while ((arr = re.exec(content)) !== null) {
                ln += i++ + "\n";
            }

            return <table className="file_browser file"><tr>
                <td className="linenumber"><pre>{ln}</pre></td>
                <td className="content"><pre>{ {__html: content} }</pre></td>
            </tr></table>;
        }
    });
})();

var FileView = (function() {

    var d = document;

    var applyStyle = function(rules) {
        if (d.styleSheets[0].addRule) { // IE
            rules.forEach(function(s) {
                d.styleSheets[0].addRule(s.selector, s.style);
            });
            return true;
        } else {
            var style = $('<style type="text/css" />');
            style.append(rules.map(function(s) {
                return s.selector+'{'+s.style+'}';
            }).join("\n"));

            var head = d.getElementsByTagName('head')[0];
            if (head) {
                head.appendChild(style[0]);
                return true;
            }
        }
    };

    var applyStyleFromSource = function(source) {
        source = source.replace(/[\r\n]/g, '');
        var regex = '<style[^>]*>(?:<!--)?(.*?)(?:-->)?</style>';
        if (new RegExp(regex).test(source)) {
            var rawcss = RegExp.$1;
            var arr;
            var re = new RegExp('\\s*([^\{]+?)\\s*{([^\}]*)}','g');
            var rules = [];
            while ((arr = re.exec(rawcss)) !== null) {
                if (arr[1].charAt(0) == '.') {
                    rules.push({selector: arr[1], style: arr[2]});
                }
            }
            return applyStyle(rules);
        }
    };

    return React.createClass({
        browseAPI: function(path, success, error) {
            $.ajax({
                method: 'GET',
                url:    '../api/browse.cgi',
                data: {
                    user:   this.props.token,
                    report: this.props.report,
                    path:   path,
                    type:   'highlight',
                },
                success: function(res) { success(res); },
                error:   function(jqxhr, status, err) {
                    error();
                },
            });
        },

        open: function(path, type) {
            if (type === 'bin') return;

            this.browseAPI(path, function(res) {
                if (type === 'dir') {
                    this.replaceState({
                        path: path,
                        type: 'dir',
                        entries: res
                    });
                } else {
                    var div = $('<div />')[0];
                    var content = res.replace(/<pre>\n/, '<pre>');
                    div.innerHTML = content;
                    var pre = div.getElementsByTagName('pre')[0];
                    if (content.charAt(content.length-1) != "\n") {
                        content += "\n";
                    }
                    applyStyleFromSource(res);

                    this.replaceState({
                        path: path,
                        type: type,
                        content: pre.innerHTML+''
                    });
                }
            }.bind(this), function() {
                this.replaceState({
                    path:  path,
                    type:  type,
                    error: true
                });
            });
        },

        getInitialState: function() {
            this.open('.', 'dir');
            return {
                path: '.',
                type: 'dir',
                entries: []
            };
        },

        render: function() {
            var s = this.state;
            var p = this.props;
            var open = this.open;

            var toolBar = function() {
                return <Breadcrum token={p.token}
                                  report={p.report}
                                  path={s.path}
                                  type={s.type}
                                  open={open}/>;
            }.bind(this);

            var render = s.error ?
                '読み込み失敗' :
                s.type === 'dir' ?
                <FileBrowser token={p.token}
                             report={p.report}
                             path={s.path}
                             entries={s.entries}
                             open={open} /> :
                <FileViewer  content={s.content} />;

            return (<div id={"summary-" + p.report + "_status_window"}
                         style={ {display: "block"} }>
                          <div id={"summary-" + p.report + "_status_view"}
                               className="status_view">
                              {render}
                          </div>
                    </div>);
        }
    });
})();

FileView.encodePath = function(path) {
    return [
        [ '&', '%26' ],
        [ '\\?', '%3F' ]
    ].reduce(function(r, x) {
        return r.replace(new RegExp(x[0], 'g'), x[1]);
    }, encodeURI(path));
};

FileView.rawPath = function(user, report, path) {
    var uri = $(location);
    var pathname = uri.attr('pathname').split('/');
    pathname.pop(); pathname.pop();
    var epath = FileView.encodePath(path);
    pathname.push('browse', user, report, epath);
    var param = path != epath ? ('?path=' + epath) : '';
    return uri.attr('protocol') + '//' + uri.attr('host') + pathname.join('/') + param;
};

module.exports = FileView;
