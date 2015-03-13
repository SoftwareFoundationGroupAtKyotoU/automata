var React = require('react');
window.React = React;
var Router = require('react-router');
var $ = require('jquery');

var StatusCell = require('./status_cell.js');

var OptionalCell = React.createClass({
    getInitialState: function() {
        return {
            expand: false,
        };
    },

    toggleDetail: function() {
        this.setState({
            expand: !this.state.expand
        });
        return false;
    },

    render: function() {
        var content;
        if (this.props.answered.length > 0) {
            var detail = this.props.answered.length;
            if (this.state.expand) {
                detail = this.props.answered.join(', ');
            }
            content = (
                    <a href="javascript:void(0)" onClick={this.toggleDetail}>
                    {detail}
                    </a>
            );
        }
        return (
                <td className={this.props.name}>
                {content}
                </td>
        );
    }
});

var ReportList = React.createClass({
    mixins: [Router.Navigation],

    updateStatus: function(token, report) {
        $.get('../api/user.cgi',
              {
                  type: 'status',
                  user: token,
                  report: report,
              },
              function(result) {
                  this.setState({
                      users: this.state.users.map(function(user) {
                          if (user.token === token) {
                              user.report[report].status = result[0].report[report].status;
                          }
                          return user;
                      })
                  });
              }.bind(this));
    },

    getInitialState: function() {
        return {
            users: [],
            users_init: false,
        };
    },

    componentDidMount: function() {
        $.get('../api/user.cgi',
              {
                  type: 'status',
                  report: this.props.scheme.id,
                  status: 'record',
                  log: true,
              },
              function(users) {
                  var tokens = users.map(function(user) { return user.token; });
                  $.ajax({
                      url: '../api/comment.cgi',
                      data: {
                          action: 'list_news',
                          report: this.props.scheme.id,
                          user: tokens
                      },
                      success: function(comments) {
                          Object.keys(comments).map(function(key) {
                              var user = users.filter(function(user) {
                                  return user.token === key;
                              })[0];
                              ['report', this.props.scheme.id, 'comment'].reduce(function(r, k) {
                                  if (!r[k]) r[k] = {};
                                  return r[k];
                              }, user);
                              user['report'][this.props.scheme.id]['comment'] = comments[key];
                          }, this);
                          this.setState({
                              users: users,
                              users_init: true,
                          });
                      }.bind(this),
                      traditional: true
                  });
              }.bind(this));
    },

    render: function() {
        var ths = this.props.scheme.record.map(function(r) {
            return (
                    <th className={r.field}>{r.label}</th>
            );
        });
        var users = this.state.users.map(function(user) {
            var tds = this.props.scheme.record.map(function(r) {
                if (r.field === 'name') {
                    var unreads = ['report', this.props.scheme.id, 'comment', 'unreads'].reduce(function(r, k) {
                        if (!r[k]) r[k] = {};
                        return r[k];
                    }, user);
                    if (unreads > 0) {
                        unreads = (<div className="unread">{unreads}</div>);
                    }
                    return (<td className="name">{unreads}{user.name}</td>);
                } else if (r.field === 'status') {
                    return (<StatusCell user={user} report={this.props.scheme.id} admin={this.props.admin} updateStatus={this.updateStatus}/>);
                } else if (/^optional/.test(r.field)) {
                    var answered = ['report', this.props.scheme.id, 'optional'].reduce(function(r, k) {
                        if (typeof r[k] === 'undefined') r[k] = {};
                        return r[k];
                    }, user);
                    if (!Array.isArray(answered)) answered = [];
                    return (<OptionalCell name={r.field} answered={answered}/>);
                } else if (r.field === 'unsolved') {
                    var unsolved = ['report', this.props.scheme.id, 'unsolved'].reduce(function(r, k) {
                        if (typeof r[k] === 'undefined') r[k] = {};
                        return r[k];
                    }, user);
                    if (!Array.isArray(unsolved)) unsolved = [];
                    var str = unsolved.map(function(l) {
                        var r = l[0];
                        if (l[1] > 1) r += 'のうち残り' + l[1] + '問';
                        return r;
                    }).join(', ');
                    return (<td className="unsolved">{str}</td>);
                } else if (r.field === 'test') {
                    var test = ['report', this.props.scheme.id, 'log', 'test'].reduce(function(r, k) {
                        if (!r[k]) r[k] = {};
                        return r[k];
                    }, user);
                    var str;
                    if ('passed' in test && 'number' in test) {
                        str = test.passed + '/' + test.number;
                    }
                    return (<td className="test">{str}</td>);
                } else {
                    return (<td></td>);
                }
            }.bind(this));
            var transTo = function() {
                this.transitionTo('user', {
                    token: user.token,
                    report: this.props.scheme.id,
                });
            }.bind(this);
            return (
                    <tr className="selectable" onClick={transTo}>{tds}</tr>
            );
        }.bind(this));
        if (!this.state.users_init) {
            users = (
                    <tr><td colSpan={ths.length}><img src="./loading.gif"/></td></tr>
            );
        }
        return (
                <table className="record">
                <thead>
                <tr>{ths}</tr>
                </thead>
                <tbody>
                {users}
                </tbody>
                </table>
        );
    }
});

var DetailList = React.createClass({
    getInitialState: function() {
        return {
            scheme: [],
            scheme_init: false,
        };
    },

    componentDidMount: function() {
        $.get('../api/scheme.cgi',
              {
                  record: true,
              },
              function(result) {
                  this.setState({
                      scheme: result,
                      scheme_init: true,
                  });
              }.bind(this));
    },

    render: function() {
        if (!this.state.scheme_init) {
            return (
                    <div><img src="./loading.gif"/></div>
            );
        }
        var reports = this.state.scheme.map(function(s) {
            return (
                    <ReportList scheme={s} admin={this.props.admin}/>
            );
        }.bind(this));
        return (
                <div className="view">{reports}</div>
        );
    }
});

module.exports = DetailList;
