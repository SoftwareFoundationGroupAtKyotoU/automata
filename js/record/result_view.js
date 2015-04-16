var _ = require('lodash');
var React = require('react');
var api = require('../api');
var Loading = require('../loading');
var Status = require('./status');

function isPassed(t) {
    if (typeof t !== 'string') t = t.result;
    return t =~ /^\s*ok\s*/i;
}

var defs = [
    {
        key: 'result',
        name: 'result',
        node: function(x) { return isPassed(x) ? 'passed' : 'failed'; }
    },
    {
        key: 'description',
        name: 'test',
        node: function(x) { return (<pre>{x}</pre>); }
    },
    {
        key: 'expected',
        name: 'expected',
        node: function(x) { return (<pre>{x}</pre>); }
    },
    {
        key: 'returned',
        name: 'returned',
        node: function(x) { return (<pre>{x}</pre>); }
    },
    {
        key: 'exception',
        name: 'error',
        node: function(x) { return (<pre>{x}</pre>); }
    }
];

module.exports = React.createClass({
    mixins: [Loading.Mixin],

    runTest: function() {
        api.post({
            api: 'admin_runtest',
            data: {
                user: this.props.token,
                report: this.props.report
            }
        }).done(function() {
            this.updateTestResult();
        }.bind(this));

        this.setState({
            status: 'loading'
        });
    },

    toolBar: function() {
        if (!this.props.admin) return null;
        return (
                <ul className="status_toolbar">
                <li className="toolbutton">
                <a href="javascript:void(0)" onClick={this.runTest}><i className="fa fa-bolt"/> テストを再実行</a>
                </li>
                </ul>
        );
    },

    getInitialState: function() {
        return {
            status: 'loading'
        };
    },

    updateTestResult: function() {
        var data = {
            user: this.props.token,
            report: this.props.report,
        };

        if (!this.isMounted()) return;

        this.setState({
            status: 'loading'
        });

        api.get({
            api: 'user',
            data: _.assign({ type: 'status' }, data)
        }).done(function(u) {
            if (!this.isMounted()) return;

            if (_.isUndefined(u[0].report)) {
              this.setState({
                status: 'none'
              });
              return;
            }

            var status = u[0].report[this.props.report].status;
            switch (status) {
            case 'report':
            case 'OK':
                api.get({
                    api: 'test_result',
                    data: data
                }).done(function(result) {
                    this.setState({
                        test_result: result,
                        status: 'done'
                    });
                }.bind(this));
                break;

            case 'build':
            case 'check':
                this.setState({
                    status: 'loading'
                });
                setTimeout(this.updateTestResult, 3 * 1000);
                break;

            case 'NG':
            case 'build:NG':
            case 'check:NG':
            case 'none':
                this.setState({
                    status: status
                });
                break;
            default:
              throw ("Unknown status '" + status + "' from a server");
            }
        }.bind(this));
    },

    componentDidMount: function() { this.updateTestResult(); },

    nowLoading: function() {
        return this.state.status === 'loading';
    },

    afterLoading: function() {
        var status = this.state.status;
        switch (status) {
        case 'NG':
        case 'build:NG':
        case 'check:NG':
        case 'none':
            return 'なし (' + Status.terms[status] + ')'
            break;

        case 'done':
            return this.renderDoneStatus();
            break;

        default:
            throw ("Unknown status '" + status + "' in a client");
        }
    },

    renderDoneStatus: function() {
        var passed = this.state.test_result.passed;
        var number = this.state.test_result.number;
        if (_.isUndefined(passed) || _.isUndefined(number)) {
            return 'なし';
        }

        var testcase = (<p>非公開</p>);
        if (Array.isArray(this.state.test_result.detail)) {
            var tests = this.state.test_result.detail.map(function(t) {
                var rows = [];
                defs.forEach(function(d) {
                    var x = t[d.key];
                    if (x) {
                        rows.push(
                            <tr><th>{d.name}</th><td>{d.node(x)}</td></tr>
                        );
                    }
                });
                var cname = isPassed(t) ? 'passed' : 'failed';
                return [
                    (<dt className={cname}>{t.name}</dt>),
                    (<dd className={cname}>
                         <table>
                             <tbody>{rows}</tbody>
                         </table>
                     </dd>)
                ];
            });
            testcase = (
                 <dl className="testcase">
                     {Array.prototype.concat.apply([], tests)}
                 </dl>
            );
        }

        var rate = passed === number
            ? (<p>{passed}/{number}</p>)
            : (<p><em>{passed}</em>/{number}</p>);
        return [<h3>通過率</h3>,
                rate,
                <h3>詳細</h3>,
                testcase];
    },

    render: function() {
        return <div>
                   <div className="status_header">{this.toolBar()}</div>
                   <div className="status_view">
                       {this.renderLoading()}
                   </div>
               </div>
    }
});
