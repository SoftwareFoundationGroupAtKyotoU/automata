var React = require('react');
var $ = require('jquery');

var Report = React.createClass({
    getInitialState: function() {
        var solved = this.props.solved;
        var check_list = [];
        var report_list = this.props.report_list;

        report_list.forEach(function(report) {
            var ex_name = report[0];
            var index = solved.indexOf(ex_name);

            if (index != -1) {
                check_list[ex_name] = true;
            }
            else {
                check_list[ex_name] = false;
            }
        });

        return {
            checked: check_list,
            post: false,
            cancel: false
        };
    },

    handleChange: function(e) {
        var check_list = this.state.checked;
        var name = e.target.value;
        var solved = check_list[name];

        check_list[name] = !solved;

        this.setState({
            checked: check_list
        });
    },

    onClick: function(e) {
        var check_list = this.state.checked;
        var report_list = this.props.report_list;
        var solved_list = {solved:[]};
        var unsolved_list = {unsolved:[]};

        for (var key in check_list) {
            if (check_list[key]) {
                solved_list.solved.push(key);
            }
            else {
                report_list.forEach(function(report) {
                    var ex_name = report[0];
                    var attr = report[1];

                    if (attr !== null) {
                        if (attr.required == 1 && ex_name == key) {
                            var unsolved = [key, attr.required];
                            unsolved_list.unsolved.push(unsolved);
                        }
                    }
                });
            }
        }

        $.ajax({
            url: "../api/admin_solved.cgi",
            type: 'POST',
            data: {
                'user': this.props.user,
                'report': this.props.report,
                'exercise[]': solved_list.solved
            },
            success: function(data) {
                this.props.posted(solved_list, unsolved_list);
            }.bind(this),
            error: function(xhr, status, err) {
                console.log(status);
            }
        });
    },

    render: function() {
        var report_name = this.props.report;
        var solved = this.props.solved;
        var check_list = this.state.checked;
        var reports = [];
        var handlechange = this.handleChange;

        this.props.report_list.forEach(function(report) {
            var name = report[0];
            var label = "ex_" + report_name + name;

            reports.push
            (
                    <li>
                    <input type="checkbox" checked={check_list[name]}
                           onChange={handlechange}
                           value={name} />
                    <label>{name}</label>
                    </li>
            );
        });
        return (
                <div>
                <div className="list_view">
                <ul className="ex">
                {reports}
                </ul>
                </div>
                    <button onClick={this.onClick} >変更</button>
                    <button onClick={this.props.onclick} >キャンセル</button>
                </div>
        );
    }
});

var AnswerEdit = React.createClass({

    getInitialState: function() {
        return {
            report_list: undefined,
        };
    },

    componentDidMount: function() {
        $.get('../api/scheme.cgi',
              {
                  id: this.props.report,
                  exercise: true,
                  action: 'get',
              },
              function(result) {
                  this.setState({
                      report_list: result[0].exercise
                  });
              }.bind(this));
    },

    render: function() {
        if (typeof (this.state.report_list) == 'undefined') {
            return (
                    <div>
                    <div className="list_view">
                    </div>
                    </div>
            );
        } else {
            return (
                    <Report user={this.props.token}
                            report={this.props.report}
                            solved={this.props.solved}
                            unsolved={this.props.unsolved}
                            report_list={this.state.report_list}
                            onclick={this.props.onclick}
                            posted={this.props.posted} />
            );
        }
    }
});

module.exports = AnswerEdit;
