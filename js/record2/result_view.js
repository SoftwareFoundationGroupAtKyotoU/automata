var React = require('react');
var $ = require('jquery');

module.exports = React.createClass({
    runTest: function() {
        $.post('../api/admin_runtest.cgi',
               {
                   user: this.props.token,
                   report: this.props.report
               },
               function() {
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
                <a href="javascript:void(0)" onClick={this.runTest}>⚡ テストを再実行</a>
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
        $.get('../api/test_result.cgi',
              {
                  user: this.props.token,
                  report: this.props.report
              },
              function(result) {
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
                    return [
                        (<dt className="passed">{t.name}</dt>),
                        (<dd className="passed">
                         <table>
                         <tbody>
                         <tr><th>result</th><td>{t.result}</td></tr>
                         <tr><th>test</th><td><pre>{t.description}</pre></td></tr>
                         <tr><th>expected</th><td><pre>{t.expected}</pre></td></tr>
                         <tr><th>returned</th><td><pre>{t.returned}</pre></td></tr>
                         </tbody>
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
