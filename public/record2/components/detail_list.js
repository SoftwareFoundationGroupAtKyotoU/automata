var Router = ReactRouter;

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

    getInitialState: function() {
        return {
            users: [],
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
              function(result) {
                  this.setState({
                      users: result
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
                    return (<td className='name'>{user.name}</td>);
                } else if (r.field === 'status') {
                    return (<StatusCell user={user} report={this.props.scheme.id}/>);
                } else if (/^optional/.test(r.field)) {
                    var answered = ['report', this.props.scheme.id, 'optional'].reduce(function(r, k) {
                        if (typeof r[k] === 'undefined') r[k] = {};
                        return r[k];
                    }, user);
                    if (!Array.isArray(answered)) answered = [];
                    return (<OptionalCell name={r.field} answered={answered}/>);
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
        return (
                <table className="record">
                <tr>{ths}</tr>
                {users}
                </table>
        );
    }
});

var DetailList = React.createClass({
    getInitialState: function() {
        return {
            scheme: [],
        };
    },

    componentDidMount: function() {
        $.get('../api/scheme.cgi',
              {
                  record: true,
              },
              function(result) {
                  this.setState({
                      scheme: result
                  });
              }.bind(this));
    },

    render: function() {
        var reports = this.state.scheme.map(function(s) {
            return (
                    <ReportList scheme={s}/>
            );
        });
        return (
                <div className="view">{reports}</div>
        );
    }
});
