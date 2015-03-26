var _ = require('lodash');
var $ = require('jquery');
var React = require('react');
var api = require('../api');
var exercise = require('../exercise');
var ui = require('../ui2');

var SubmitForm = React.createClass({
    getInitialState: function() {
        return {
            reports: this.props.reports,
            id: this.props.initial_id,
            fileSelected: false
        };
    },

    report: function() { return this.state.reports[this.state.id]; },

    reactOfReq: function(req, child) {
        switch (req.type) {
        case 'code': return <code>{req.value}</code>;
        case 'html':
          return <div style={ {display: 'inline'} }
                      dangerouslySetInnerHTML={ {__html: req.value} } />;
        case 'text': return req.value;
        default:     return undefined;
        }
    },

    liOfReq: function(req) {
        return <li>{this.reactOfReq(req)}</li>;
    },

    reqOf: function(key) {
        return (this.report().requirements || {})[key] || [];
    },

    reactOfStaticReq: function() {
        return this.reqOf('static').map(this.liOfReq);
    },

    reactOfDynamicReq: function() {
        return this.reqOf('dynamic').map(function(d) {
            var target = d.target;
            var list = d['default'];

            for (var x in d) {
                if (this.report().checkedExs[x]) {
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

            return <li id={target.name}>
                       {this.reactOfReq(target)}
                       <ul id={target.name}>{list.map(this.liOfReq)}</ul>
                   </li>;
        }.bind(this));
    },

    onChangeCheck: function(checkedExs, checked) {
        var rep = this.report();
        checkedExs.forEach(function (ex) {
            rep.checkedExs[ex] = checked;
        });
        var reports = this.state.reports;
        reports[rep.id] = rep;

        this.setState({ reports: reports });
    },

    onChangeFile: function(e) {
        this.setState({ fileSelected: e.target.value !== '' });
    },

    render: function() {
        var s = this.state;
        var report = this.report();
        var selectors = _.values(s.reports).map(function(rep) {
            var clickHandler = function(e) {
                e.preventDefault();
                this.setState({ id: rep.id });
            }.bind(this);

            return <li className={rep.id === report.id ? 'selected' : ''}>
                       <a href='.' onClick={clickHandler}>{rep.name}</a></li>;
        }.bind(this));

        return (<div>
                <input type='hidden' id='report_id'
                       name='report_id' value={report.id} />
                <h4>課題の選択</h4>
                    <ul id='selector'>{selectors}</ul>
                    <h4>提出情報</h4>
                    <dl className='info'>
                        <dt>アカウント名</dt>
                        <dd>{this.props.user}</dd>
                        <dt>提出する課題</dt>
                        <dd id='selected_report'>{report.name}</dd>
                    </dl>
                <h4>解いた問題にチェックして下さい</h4>
                    <ul>
                        <li>はじめは必修課題にはチェックがついています(間に合わなかった問題はチェックを外して下さい)</li>
                        <li>再提出の場合は, すでに提出した問題もすべてチェックして下さい</li>
                    </ul>
                    <div id='list_view' className='list_view'>
                        <exercise.CheckList nodeID='ex'
                                            prefix='ex'
                                            exs={report.exercise}
                                            checkedExs={report.checkedExs}
                                            onChange={this.onChangeCheck} />
                    </div>
                <h4>ファイルの選択</h4>
                    <h5>提出要件</h5>
                    <ul id='requirements'>
                        {this.reactOfStaticReq()}
                        {this.reactOfDynamicReq()}
                    </ul>
                    <label htmlFor='file'>zipファイル: </label>
                    <input type='file' id='file' name='report_file'
                           onChange={this.onChangeFile}/>
                    <input type='submit' id='submit' value='提出'
                           disabled={!s.fileSelected} />
                </div>);
    }
});

$(document).ready(function() {
    api.get(
        { api: 'master',   data: { year: true, user: true, token: true } },
        { api: 'template', data: { type: 'none', links: true } },
        { api: 'scheme',   data: { type: 'post' } },
        { api: 'template', data: { type: 'post', requirements: true } }
    ).done(function (master, template, scheme, reqs) {
        // template
        ui.setTitle(template);
        ui.addLinks(template.links);

        var reports = {};
        scheme.forEach(function(rep) {
            rep.requirements = reqs.requirements[rep.id]
            rep.checkedExs = {}
            reports[rep.id] = rep;
        });

        var params = [{
            api: 'user',
            data: {
                user: master.user,
                type: 'status',
                status: 'solved'
            }
        }].concat(scheme.map(function(report) {
            return {
                api: 'scheme',
                data: { id: report.id, type: 'post', exercise: true },
            };
        }));

        api.get.apply(null, params).done(function() {
            var res = _.toArray(arguments);

            var user = res.shift()[0] || {};
            if (user.token === master.token) {
                _.values(reports, function(rep) {
                    rep.checkedExs = user.report[rep.id] || {};
                });
            }

            res.forEach(function (r) {
                var rep = reports[r[0].id];
                rep.exercise = r[0].exercise;

                if (Object.keys(rep.checkedExs).length === 0) {
                    rep.checkedExs =
                        exercise.transform(rep.exercise).reduce(
                            function(r, ex) {
                                r[ex.name] = ex.label === 'all';
                                return ex.sub.reduce(function(r, sub) {
                                    r[sub.name] = sub.required;
                                    return r;
                                }, r);
                            }, {}
                        );
                }
            });

            React.render(
                <SubmitForm user={master.user}
                            reports={reports}
                            initial_id={(scheme[0]||{}).id} />,
                document.getElementById('form')
            );
        });
    });
});
