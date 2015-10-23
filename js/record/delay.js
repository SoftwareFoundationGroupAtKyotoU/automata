var _ = require('lodash');
var React = require('react');
var Router = require('react-router');
var Link = Router.Link;
var api = require('../api');
var Loading = require('../loading');

module.exports = React.createClass({
    mixins: [Router.Navigation, Loading.Mixin],

    onEdit: function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            editing: 'edit'
        });
    },

    onCancel: function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({
            editing: 'done'
        });
    },

    changeState: function(e) {
        var id = _.get(this.props.user, ['report', this.props.report, 'submit'],
                       {});
        var new_status = e.target.value;
        api.post({
            api: 'admin_log',
            data: {
                id: id,
                user: this.props.user.token,
                report: this.props.report,
                delay: new_status
            },
            ownError: true
        }).done(function() {
            this.props.changeDelayStatus(this.props.user.token,
                                         this.props.report,
                                         new_status);
        }.bind(this)).fail(function() {
          alert('提出遅れ状態の変更に失敗しました．提出ファイルの更新がないかを確認してください．');
        }).always(function() {
            this.setState({
                editing: 'done'
            });
        }.bind(this));

        this.setState({
            editing: 'exec'
        });
    },

    disable: function(e) {
        e.stopPropagation();
    },

    getInitialState: function() {
        return {
            editing: 'done'
        };
    },

    nowLoading: function() { return this.state.editing === 'exec'; },

    afterLoading: function() {
        switch (this.state.editing) {
        case 'edit':
            return <a className="edit" href="javascript:void(0)"
                      title="キャンセル" onClick={this.onCancel}>
                       <i className="fa fa-times edit"/>
                   </a>;
            break;
        case 'done':
        case 'exec':
            return <a className="edit" href="javascript:void(0)"
                      title="変更する" onClick={this.onEdit}>
                       <i className="fa fa-pencil-square-o edit"/>
                   </a>;
        default:
            console.altert(
                'Invalid state: システム管理者に連絡してください -- '
                    + this.state.editing
            );
        }
    },

    render: function() {
        var delay = _.get(this.props.user,
                          ['report', this.props.report, 'delay'], '');
        var delay_opts = this.props.delayOptions;
        var content;
        if (this.state.editing == 'edit') {
            var opts = delay_opts.map(function(label) {
                return (<option value={label}>{label}</option>);
            });
            content = (
                    <select defaultValue={delay} onClick={this.disable}
                            onChange={this.changeState}>
                      {opts}
                    </select>
            );
        } else {
            content = delay;
        }
        var edit = this.props.admin && delay !== '' && delay_opts.length > 0 &&
                   this.renderLoading();
        return (<div>{content}{edit}</div>);
    }
});
