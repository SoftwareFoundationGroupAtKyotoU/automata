var _ = require('lodash');
var React = require('react');
var Router = require('react-router');
var Link = Router.Link;
var $ = require('jquery');
var api = require('../api');
var CopyToClipboard = require('./copy_to_clipboard.js');

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
        render: function() {
            var p = this.props;
            var entry = p.entry;
            var uri = FileView.rawPath(p.token, p.report, p.path+p.entry.name);
            var suffix = entry.type === 'dir' ? '/' : '';
            var name = entry.name + suffix;

            var params = {
                token: p.token,
                report: p.report,
                splat: p.path + name
            };
            var link = (entry.type === 'bin' && entry.name.indexOf('.class') < 0)
                ? (<a href={uri}>{name}</a>)
                : (<Link to="file" params={params}>{name}</Link>);
            return (
                <tr>
                    <td className="file">
                        <img className="icon"
                             src={"./" + entry.type + ".png"} />
                        {link}
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
            r[0].push({ name: p, path: r[1].join('/') + '/' });
            return r;
        }, [ [], [] ])[0];
    };

    return React.createClass({
        rawPath: function(path) {
            return FileView.rawPath(this.props.token, this.props.report, path);
        },

        render: function() {
            var p = this.props;

            var list = descend(p.path);
            list.unshift({ name: p.report, path: '' });

            var self = this;
            var last = list.pop();
            var type;
            if (last.name === '') {
                type = 'dir';
                last = list.pop();
            }
            var items = list.map(function(loc) {
                var params = {
                    token: p.token,
                    report: p.report,
                    splat: loc.path
                };
                return <li><Link to={'file'} params={params}>{loc.name}</Link></li>;
            });
            items.push(<li>{last.name}</li>);
            if (type === 'dir') items.push(<li/>);

            var toolButton = type === 'dir' ? null :
                <li className="toolbutton">
                    <a href={this.rawPath(p.path)}>⏎ 直接開く</a>
                </li>;

            var copyButton = type === 'dir' ? null : (
                <li className="toolbutton">
                    <CopyToClipboard text={this.props.rawContent}
                                     selector={'.file .content'}/>
                </li>
            );

            return (<ul id={"summary-" + p.report + "_status_toolbar"}
                         className="status_toolbar">
                        <li>場所:
                            <ul id={p.report + '-breadcrum'}
                                className='breadcrums'>{items}</ul>
                        </li>
                        {toolButton}
                        {copyButton}
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
                <td className="content"><pre dangerouslySetInnerHTML={
                    {__html: content }
                }/></td>
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
        mixins: [Router.State],

        open: function(path) {
            var data = _.chain({
                user: this.props.token,
                report: this.props.report,
                path: path
            });
            api.get(
                { api: 'browse', data: data.clone().assign({ type: 'highlight' }).value() },
                { api: 'browse', data: data.clone().assign({ type: 'raw' }).value() }
            ).done(function(result, rawContent) {
                var newState = {
                    path: path,
                    rawContent: rawContent,
                    mode: 'show'
                }
                switch (result.type) {
                    case 'dir':
                        _.assign(newState, {
                            type: 'dir',
                            entries: result.body
                        });
                        break;
                    case 'txt':
                        var div = $('<div />')[0];
                        var content = result.body.replace('<pre>\n', '<pre>');
                        div.innerHTML = content;
                        var pre = div.getElementsByTagName('pre')[0];
                        if (content.charAt(content.length-1) != "\n") {
                            content += "\n";
                        }
                        applyStyleFromSource(result.body);
                        _.assign(newState, {
                            type: 'txt',
                            content: pre.innerHTML+''
                        });
                        break;
                    case 'bin':
                        location.href = FileView.rawPath(this.props.token, this.props.report, path);
                    default:
                        _.assign(newState, {
                            mode: 'error'
                        });
                        break;
                }
                this.setState(newState);
            }.bind(this)).fail(function() {
                this.setState({
                    path: path,
                    mode: 'error'
                });
            }.bind(this));

            this.setState({
                mode: 'loading'
            })
        },

        getInitialState: function() {
            return {
                mode: 'loading'
            };
        },

        componentDidMount: function() {
            this.open(_.result(this.getParams(), 'splat', ''));
        },

        componentWillReceiveProps: function() {
            this.open(_.result(this.getParams(), 'splat', ''));
        },

        render: function() {
            var s = this.state;
            var p = this.props;

            var toolBar;
            var render;
            switch (s.mode) {
                case 'loading':
                    render = <i className="fa fa-spinner fa-pulse"/>;
                    break;
                case 'show':
                    toolBar = <Breadcrum token={p.token}
                                         report={p.report}
                                         path={s.path}
                                         rawContent={s.rawContent}/>;

                    if (s.type === 'dir') {
                        render = [(
                            <FileBrowser token={p.token}
                                         report={p.report}
                                         path={s.path}
                                         entries={s.entries}/>
                        )];
                        if (s.path === '') render.unshift(
                            <a className="download"
                               href={api.root+'/download/'+p.token+'/'+p.report+'.zip'}>
                                ☟ダウンロード
                            </a>
                        );
                    } else {
                        render = <FileViewer  content={s.content}/>;
                    }
                    break;
                default:
                    toolBar = <Breadcrum token={p.token}
                                         report={p.report}
                                         path={s.path}
                                         rawContent={s.rawContent}/>;

                    render = 'なし';
            }

            return (<div id={"summary-" + p.report + "_status_window"}
                         style={ {display: "block"} }>
                          <div className="status_header">{toolBar}</div>
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
    var epath = FileView.encodePath(path);
    pathname = '/browse/'+user+'/'+report+'/'+epath;
    var param = path != epath ? ('?path=' + epath) : '';
    return api.root + pathname + param;
};

module.exports = FileView;
