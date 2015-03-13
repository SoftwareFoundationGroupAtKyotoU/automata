var React = require('react');
window.React = React;
var Router = require('react-router');
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;

var LogView = require('./log_view.js');
var AnswerViewModule = require('./answer_view.js');
var ResultView = require('./result_view.js');
var FileView = require('./file_view.js');
var CommentView = require('./comment_view.js');

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
    { path: 'comment',  name: 'コメント',     handler: CommentView },
];

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

module.exports = UserRoute;
