var User = React.createClass({
    mixins: [Router.State],

    render: function() {
        return (
                <div>
                <SummaryList token={this.getParams().token} admin={this.props.admin}/>
                <RouteHandler token={this.getParams().token} report={this.getParams().report} admin={this.props.admin}/>
                </div>
        );
    }
});

var tabs = [
    { path: 'log',      name: 'ログ',         handler: LogView },
    { path: 'answer',   name: '解答状況',     handler: AnswerView },
    { path: 'result',   name: 'テスト結果',   handler: ResultView },
    { path: 'file',     name: 'ファイル一覧', handler: FileView },
    { path: 'comment',  name: 'コメント',     handler: CommentView },
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
        <DefaultRoute handler={LogView}/>
        </Route>
);
