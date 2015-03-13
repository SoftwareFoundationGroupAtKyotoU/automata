var React = require('react');
var $ = require('jquery');

var AnswerEdit = require('./answer_edit.js');
var UserModule = require('./user.js');
var StatusHeader = require('./status_header.js');
var Solved = UserModule.Solved;
var Unsolved = UserModule.Unsolved;

var Solved = React.createClass({
    render: function() {
        var solved = this.props.solved.map(function(s) {
            return (
                <li>{s}</li>
            );
        });
        return (
                <ul>
                <h3>解答済み</h3>
                {solved}
                </ul>
        );
    }
});

var Unsolved = React.createClass({
    render: function () {
        var unsolved;

        if (this.props.unsolved.length != []) {
            unsolved = this.props.unsolved.map(function(us) {
                return (
                        <li>{us[0]}</li>
                );
            });
        } else {
            unsolved = (<li>なし</li>);
        }

        return (
                <ul>
                <h3>未回答</h3>
                {unsolved}
                </ul>
        );
    }
});

var AnswerView = React.createClass({
    getInitialState: function() {
        return {
            solved_list: {solved:[]},
            unsolved_list: {unsolved:[]},
            clicked: false,
            mounted: false
        };
    },

    componentDidMount: function() {
        $.get('../api/user.cgi',
              {
                  user: this.props.token,
                  report: this.props.report,
                  type: 'status',
                  status: 'solved',
                  action: 'get',
              },
              function(result) {
                  this.setState({
                      solved_list: result[0].report[this.props.report]
                  });
              }.bind(this));
        $.get('../api/user.cgi',
              {
                  user: this.props.token,
                  report: this.props.report,
                  type: 'status',
                  status: 'record',
                  action: 'get',
              },
              function(result) {
                  this.setState({
                      unsolved_list: result[0].report[this.props.report],
                      mounted: true
                  });
              }.bind(this));
    },

    onClick: function() {
        this.setState({
            clicked: !this.state.clicked
        });
    },

    toolBar: function() {
        return (
                <ul className="status_toolbar">
                <li className="toolbutton">
                <a onClick={this.onClick}>✏編集</a>
                </li>
                </ul>
        );
    },

    posted: function(solved, unsolved) {
        this.setState({
            clicked: false,
            solved_list: solved,
            unsolved_list: unsolved,
        });
    },

    render: function() {
        if (!this.state.mounted) {
            return (
                    <div className="status_window">
                    <StatusHeader tabName='answer' toolBar={this.toolBar}/>
                    <div className="status_view">
                    <img src="./loading.gif" />
                    </div>
                    </div>
            );
        }
        else if(!this.state.clicked && this.state.mounted) {
            return (
                    <div className="status_window">
                    <StatusHeader tabName='answer' toolBar={this.toolBar}/>
                    <div className="status_view">
                    <Solved solved={this.state.solved_list.solved}/>
                    <Unsolved unsolved={this.state.unsolved_list.unsolved}/>
                    </div>
                    </div>
            );
        }
        else {
            return (
                    <div className="status_window">
                    <StatusHeader tabName='answer'/>
                    <div className="status_view">
                    <AnswerEdit token={this.props.token}
                                report={this.props.report}
                                solved={this.state.solved_list.solved}
                                unsolved={this.state.unsolved_list.unsolved}
                                onclick={this.onClick}
                                posted={this.posted} />
                    </div>
                    </div>
            );
        };
    }
});

module.exports = {
    answerView: AnswerView,
    solved: Solved,
    unsolved: Unsolved
};
