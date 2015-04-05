var React = require('react');
var Router = require('react-router');
var Link = Router.Link;

var LogView = require('./log_view.js');
var AnswerView = require('./answer_view.js');
var ResultView = require('./result_view.js');
var FileView = require('./file_view.js');
var CommentView = require('./comment_view.js');
var InteractView = require('./interact_view.js');

var tabs = [
    { name: 'log',      path: 'log/',      label: 'ログ',         handler: LogView },
    { name: 'answer',   path: 'answer/',   label: '解答状況',     handler: AnswerView },
    { name: 'result',   path: 'result/',   label: 'テスト結果',   handler: ResultView },
    { name: 'file',     path: 'file/*',    label: 'ファイル一覧', handler: FileView },
    { name: 'comment',  path: 'comment/',  label: 'コメント',     handler: CommentView },
    { name: 'interact', path: 'interact/', label: '対話',         handler: InteractView }
];

module.exports = React.createClass({
    mixins: [Router.State],

    render: function() {
        var _tabs = tabs.filter(function(tab) {
            return !(tab.handler.visible) || tab.handler.visible(this.props);
        }, this).map(function(tab) {
            var className = 'status_tabbar_button';
            var tabName = this.getPath().split('/')[3];
            if (!tabName) tabName = 'log';
            var params = {
                token: this.getParams().token,
                report: this.getParams().report,
                splat: ''
            };
            var name = tab.label;
            if (tab.name === 'comment' && this.props.comments > 0) {
                name += '(' + this.props.comments + ')';
            }
            if (tab.name === tabName) {
                return (
                        <li className={className + ' selected'} key={tab.name}>
                        <Link to={tab.name} params={params}
                              onClick={this.props.reload}>{name}</Link>
                        </li>
                );
            } else {
                return (
                        <li className={className} key={tab.name}>
                        <Link to={tab.name} params={params}>{name}</Link>
                        </li>
                );
            }
        }.bind(this));
        return (
                <div className="status_header">
                <ul className="status_tabbar">{_tabs}</ul>
                </div>
        );
    },

    statics: {
        tabs: tabs
    }
});
