var SummaryList = React.createClass({
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
              }.bind(this));
        var data = { type: 'status' };
        if (this.props.token) data.user = this.props.token;
        $.get('../api/user.cgi',
              data,
              function(result) {
                  this.setState({
                      users: result
                  });
              }.bind(this));
    },

    render: function() {
        var ths = this.state.scheme.map(function(s) {
            return (
                    <th key={s.label}>{s.label}</th>
            );
        });
        if (ths.length > 0) ths.unshift (<th key='名前'>名前</th>);
        var users = this.state.users.map(function(user) {
            var kadais = this.state.scheme.map(function(s) {
                return (<StatusCell user={user} report={s.id} isButton={true}/>);
            });
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
