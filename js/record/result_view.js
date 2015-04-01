var React = require('react');
var $ = require('jquery');
var api = require('../api');

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
    runTest: function() {
        api.post({
            api: 'admin_runtest',
            data: {
                user: this.props.token,
                report: this.props.report
            }
        }).done(function() {
            this.componentDidMount();
        }.bind(this));

        this.setState({
            init: false
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
            init: false
        };
    },

    componentDidMount: function() {
        api.get({
            api: 'test_result',
            data: {
                user: this.props.token,
                report: this.props.report
            }
        }).done(function(result) {
            if (this.isMounted()) {
                this.setState({
                    test_result: result,
                    init: true
                });
            }
        }.bind(this));
    },

    render: function() {
        if (!this.state.init) {
            return (
                    <div className="status_view">
                    <img src="../image/loading.gif"/>
                    </div>
            );
        }

        if ($.isEmptyObject(this.state.test_result)) {
            return (
                    <div>
                    <div className="status_header">{this.toolBar()}</div>
                    <div className="status_view">なし</div>
                    </div>
            );
        } else {
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
                )
            }
            var passed = this.state.test_result.passed;
            var number = this.state.test_result.number;
            var rate = passed === number
                ? (<p>{passed}/{number}</p>)
                : (<p><em>{passed}</em>/{number}</p>);
            return (
                    <div>
                    <div className="status_header">{this.toolBar()}</div>
                    <div className="status_view">
                    <h3>通過率</h3>
                    <p>{this.state.test_result.passed}/{this.state.test_result.number}</p>
                    <h3>詳細</h3>
                    {testcase}
                    </div>
                    </div>
            );
        }
    }
});
