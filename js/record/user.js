var _ = require('lodash');
var React = require('react');
var Router = require('react-router');
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var RouteHandler = Router.RouteHandler;
var $ = require('jquery');
require('jquery.cookie');

var LogView = require('./log_view.js');
var SummaryList = require('./summary_list.js');
var StatusHeader = require('./status_header.js');
var NavButton = require('./nav_button.js');

var User = React.createClass({
    mixins: [Router.State],

    reloadView: function(e)  {
        e.preventDefault();
        this.setState({
            counter: this.state.counter + 1
        });
    },

    getInitialState: function() {
        return {
            counter: 0
        };
    },

    render: function() {
        var token = this.getParams().token;
        var report = this.getParams().report;
        $.cookie('default-report', report);

        var user = _.find(this.props.users, function(user) {
            return user.token === token
        });
        var comments = _.chain(this.props.comments)
                        .result(report).result(token).result('comments').value();
        return (
                <div>
                <SummaryList report={report}
                             admin={this.props.admin}
                             scheme={this.props.scheme}
                             users={[user]}
                             updateStatus={this.props.updateStatus}/>
                <div className="status_window">
                <StatusHeader comments={comments}
                              reload={this.reloadView}
                              admin={this.props.admin}
                              interact={this.props.interact} />
                <RouteHandler key={token + report + this.state.counter}
                              token={token}
                              report={report}
                              admin={this.props.admin}
                              interact={this.props.interact}
                              loginUser={this.props.loginUser}
                              updateNews={_.partial(this.props.updateNews, token, report)}/>
                </div>
                <NavButton name={user.name}/>
                </div>
        );
    }
});

var routes = [];
StatusHeader.tabs.forEach(function(tab) {
    routes.push(
        <Route name={tab.path} path={tab.path} handler={tab.handler} key={tab.path}/>
    );
    if (tab.pathParam) {
        var name = tab.path + '-pathParam';
        routes.push(
            <Route name={name} path={tab.path + '/*'} handler={tab.handler} key={name}/>
        );
    }
});

var UserRoute = (
        <Route name="user" path=":token/:report" handler={User}>
        {routes}
        <DefaultRoute handler={LogView}/>
        </Route>
);

module.exports = UserRoute;
