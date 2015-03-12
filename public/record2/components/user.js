var React = require('react');
window.React = React;
var Router = require('react-router');
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;

var LogView = require('./log_view.js');
var AnswerViewModule = require('./answer_view.js');
var ResultView = require('./result_view.js');
var FileView = require('./file_view.js');
var CommentViewModule = require('./comment_view.js');

var User = React.createClass({
    mixins: [Router.State],

    render: function() {
        return (
                <div>
                <SummaryList token={this.getParams().token} report={this.getParams().report} admin={this.props.admin}/>
                <RouteHandler token={this.getParams().token} report={this.getParams().report} admin={this.props.admin}/>
                </div>
        );
    }
});

var tabs = [
    { path: 'log',      name: 'ログ',         handler: LogView.logView },
    { path: 'answer',   name: '解答状況',     handler: AnswerViewModule.answerView },
    { path: 'result',   name: 'テスト結果',   handler: ResultView },
    { path: 'file',     name: 'ファイル一覧', handler: FileView },
    { path: 'comment',  name: 'コメント',     handler: CommentViewModule.commentView },
];

var StatusHeader = React.createClass({
    mixins: [Router.State],

    getDefaultProps: function() {
        return {
            toolBar: function() {
                return null;
            }
        };
    },

    render: function() {
        var _tabs = tabs.map(function(tab) {
            var className = 'status_tabbar_button';
            if (tab.path === this.props.tabName) {
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
                {this.props.toolBar()}
                <ul className="status_tabbar">{_tabs}</ul>
                </div>
        );
    }
});

var routes = tabs.map(function(tab) {
    return (
            <Route name={tab.path} path={tab.path} handler={tab.handler} key={tab.path}/>
    );
});

var UserRoute = (
        <Route name="user" path=":token/:report" handler={User}>
        {routes}
        <DefaultRoute handler={LogView.logView}/>
        </Route>
);

module.exports = {
    userRoute: UserRoute,
    statusHeader: StatusHeader
};
