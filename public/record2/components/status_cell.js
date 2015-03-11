var StatusCell = React.createClass({
    mixins: [Router.Navigation],

    status_map: {
        'none':     '未提出',
        'OK':       '受理',
        'NG':       '要再提出',
        'build':    '確認中',
        'check':    '確認中',
        'build-NG': '要再提出',
        'check-NG': '要再提出',
        'report':   'レポート確認中',
    },

    render: function() {
        var status = ['report', this.props.report, 'status'].reduce(function(r, k) {
            if (typeof r[k] === 'undefined') r[k] = {};
            return r[k];
        }, this.props.user);

        if (status === 'build:NG') {
            status = 'build-NG';
        } else if (status === 'check:NG') {
            status = 'check-NG';
        } else if (typeof status !== 'string') {
            status = 'none';
        }
        var props = {
            className: 'status ' + status
        };
        if (this.props.isButton) {
            var transTo = function() {
                this.transitionTo('user', {
                    token: this.props.user.token,
                    report: this.props.report,
                });
            }.bind(this);
            props.className += ' selectable';
            props.onClick = transTo;
        }
        return (
                <td {...props}>
                {this.status_map[status]}
               </td>
        );
    }
});
