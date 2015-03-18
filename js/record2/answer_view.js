var React = require('react');
var $ = require('jquery');

var AnswerEdit = require('./answer_edit.js');
var UserModule = require('./user.js');
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

        if (this.props.unsolved.length != 0) {
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
            solved: [],
            unsolved: [],
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
                  var report = result[0].report

                  if (typeof (report) === 'undefined') {
                      this.setState({
                          solved: this.state.solved
                      });
                  }
                  else {
                      this.setState({
                          solved: result[0].report[this.props.report].solved
                      });
                  };
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
                  var report = result[0].report

                  if (typeof (report) === 'undefined') {
                      this.setState({
                          unsolved: this.state.unsolved_list,
                          mounted: true
                      });
                  }
                  else {
                      this.setState({
                          unsolved: result[0].report[this.props.report].unsolved,
                          mounted: true
                      });
                  }
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
                <a href="javascript:void(0)" onClick={this.onClick}>✏ 編集</a>
                </li>
                </ul>
        );
    },

    posted: function(solved, unsolved) {
        this.setState({
            clicked: false,
            solved: solved,
            unsolved: unsolved,
        });
    },

    render: function() {
        if (!this.state.mounted) {
            return (
                    <div>
                    <div className="status_view">
                    <img src="./loading.gif" />
                    </div>
                    </div>
            );
        }
        else if(!this.state.clicked && this.state.mounted &&
                this.state.solved.length === 0) {
            return (
                    <div>
                    <div className="status_view">
                    なし
                    </div>
                    </div>
            );
        }
        else if(!this.state.clicked && this.state.mounted &&
                this.props.admin) {
            return (
                    <div>
                    <div className="status_header">{this.toolBar()}</div>
                    <div className="status_view">
                    <Solved solved={this.state.solved}/>
                    <Unsolved unsolved={this.state.unsolved}/>
                    </div>
                    </div>
            );
        }
        else if(!this.state.clicked && this.state.mounted &&
                !this.props.admin) {
            return (
                    <div>
                    <div className="status_header"></div>
                    <div className="status_view">
                    <Solved solved={this.state.solved}/>
                    <Unsolved unsolved={this.state.unsolved}/>
                    </div>
                    </div>
            );
        }
        else {
            return (
                    <div>
                    <div className="status_view">
                    <AnswerEdit token={this.props.token}
                                report={this.props.report}
                                solved={this.state.solved}
                                unsolved={this.state.unsolved}
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
