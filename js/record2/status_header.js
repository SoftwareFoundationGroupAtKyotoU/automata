var React = require('react');
window.React = React;
var Router = require('react-router');
var Link = Router.Link;

var LogView = require('./log_view.js');
var AnswerViewModule = require('./answer_view.js');
var ResultView = require('./result_view.js');
var FileView = require('./file_view.js');
var CommentView = require('./comment_view.js');

var tabs = [
    { path: 'log',      name: 'ログ',         handler: LogView },
    { path: 'answer',   name: '解答状況',     handler: AnswerViewModule.answerView },
    { path: 'result',   name: 'テスト結果',   handler: ResultView },
    { path: 'file',     name: 'ファイル一覧', handler: FileView },
    { path: 'comment',  name: 'コメント',     handler: CommentView }
];

module.exports = React.createClass({
    mixins: [Router.State],

    render: function() {
        var _tabs = tabs.map(function(tab) {
            var className = 'status_tabbar_button';
            var tabName = this.getPath().split('/')[3];
            if (!tabName) tabName = 'log';
            if (tab.path === tabName) {
                className += ' selected';
            }
            return (
                    <li className={className} key={tab.path}>
                    <Link to={tab.path} params={{
                        token: this.getParams().token,
                        report: this.getParams().report,
                    }}>{tab.name}</Link>
                    </li>
            );
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
