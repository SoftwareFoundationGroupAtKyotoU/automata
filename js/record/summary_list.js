var _ = require('lodash');
var React = require('react');

var StatusCell = require('./status_cell.js');

module.exports = React.createClass({
    render: function() {
        var scheme = this.props.scheme.map(function(s) {
            return {
                id: s.id,
                label: s.record.filter(function(r) {
                    return r.field === 'status';
                })[0].label
            };
        });
        var ths = [{ label: '名前' }].concat(scheme).map(function(s) {
            return (
                    <th>{s.label}</th>
            );
        });
        var users;
        if (this.props.users.length > 0) {
            users = this.props.users.map(function(user) {
                var kadais = scheme.map(function(s) {
                    var comment = _.chain(user)
                        .result('report').result(s.id).result('comment', {})
                        .value();
                    return (
                            <StatusCell user={user}
                                        report={s.id}
                                        isButton={true}
                                        admin={this.props.admin}
                                        updateStatus={this.props.updateStatus}
                                        comment={comment}
                                        isSelected={this.props.report === s.id}/>
                    );
                }.bind(this));
                return (
                        <tr key={user.token}><td className="name">{user.name}</td>{kadais}</tr>
                );
            }.bind(this));

        // There are no users to show
        } else {
            users = <tr><td colSpan={ths.length}>
                        表示すべきユーザーはいません
                    </td></tr>;
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
