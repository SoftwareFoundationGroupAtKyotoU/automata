var React = require('react');
var $ = require('jquery');

var StatusCell = require('./status_cell.js');

module.exports = React.createClass({
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

    componentDidMount: function() {
        var data = {
            type: 'status',
        };
        if (this.props.token) data.user = this.props.token;
        if (this.props.filtered) data.filter = true;
        $.get('../api/user.cgi', data,
              function(users) {
                  var tokens = users.map(function(user) { return user.token; });
                  this.props.scheme.forEach(function(s) {
                      $.get('../api/comment.cgi',
                            {
                                action: 'list_news',
                                report: s.id,
                                user: tokens
                            },
                            function(result) {
                                Object.keys(result).map(function(key) {
                                    var user = users.filter(function(user) {
                                        return user.token === key;
                                    })[0];
                                    ['report', s.id, 'comment'].reduce(function(r, k) {
                                        if (!r[k]) r[k] = {};
                                        return r[k];
                                    }, user);
                                    user['report'][s.id]['comment'] = result[key];
                                }, this);
                                this.setState({
                                    users: users,
                                });
                            }.bind(this));
                  }, this);
              }.bind(this));
    },

    render: function() {
        if (!this.state) return (<img src="../image/loading.gif"/>);

        var scheme = this.props.scheme.map(function(s) {
            return {
                id: s.id,
                label: s.record.filter(function(r) {
                    return r.field === 'status';
                })[0].label
            };
        });
        var ths = scheme.map(function(s) {
            return (
                    <th>{s.label}</th>
            );
        });
        if (ths.length > 0) ths.unshift (<th>名前</th>);
        var users = this.state.users.map(function(user) {
            var kadais = scheme.map(function(s) {
                var unreads = ['report', s.id, 'comment', 'unreads'].reduce(function(r, k) {
                    if (!r[k]) r[k] = {};
                    return r[k];
                }, user);
                return (<StatusCell user={user} report={s.id} isButton={true} admin={this.props.admin} updateStatus={this.updateStatus} unRead={unreads} isSelected={this.props.report === s.id}/>);
            }.bind(this));
            return (
                    <tr key={user.token}><td className="name">{user.name}</td>{kadais}</tr>
            );
        }.bind(this));
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
