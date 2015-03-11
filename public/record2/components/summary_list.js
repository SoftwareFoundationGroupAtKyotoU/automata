var SummaryList = React.createClass({
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
                              user.report[report] = result[0].report[report];
                          }
                          return user;
                      })
                  });
              }.bind(this));
    },

    getInitialState: function() {
        return {
            scheme: [],
            users: [],
        };
    },

    componentDidMount: function() {
        $.get('../api/scheme.cgi',
              {
                  record: true,
              },
              function(result) {
                  var scheme = result.map(function(s) {
                      var label = s.record.reduce(function(n, r) {
                          if (r.field === 'status') {
                              return r.label;
                          } else {
                              return n;
                          }
                      }, '');
                      return {
                          id: s.id,
                          label: label,
                      };
                  });
                  this.setState({
                      scheme: scheme
                  });

                  var data = { type: 'status' };
                  if (this.props.token) data.user = this.props.token;
                  $.get('../api/user.cgi',
                        data,
                        function(users) {
                            var tokens = users.map(function(user) { return user.token });
                            this.state.scheme.forEach(function(s) {
                                $.ajax({
                                    url: '../api/comment.cgi',
                                    data: {
                                        action: 'list_news',
                                        report: s.id,
                                        user: tokens
                                    },
                                    success: function(result) {
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
                                            users: users
                                        });
                                    }.bind(this),
                                    traditional: true
                                });
                            }, this);
                        }.bind(this));
              }.bind(this));
    },

    render: function() {
        var ths = this.state.scheme.map(function(s) {
            return (
                    <th>{s.label}</th>
            );
        });
        if (ths.length > 0) ths.unshift (<th>名前</th>);
        var users = this.state.users.map(function(user) {
            var kadais = this.state.scheme.map(function(s) {
                var unreads = ['report', s.id, 'comment', 'unreads'].reduce(function(r, k) {
                    if (!r[k]) r[k] = {};
                    return r[k];
                }, user);
                return (<StatusCell user={user} report={s.id} isButton={true} admin={this.props.admin} updateStatus={this.updateStatus} unRead={unreads}/>);
            }.bind(this));
            return (
                    <tr key={user.token}><td className="name">{user.name}</td>{kadais}</tr>
            );
        }.bind(this));
        return (
                <table className="record">
                <tr>{ths}</tr>
                {users}
                </table>
        );
    }
});
