var React = require('react');
window.React = React;
var Router = require('react-router');
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var RouteHandler = Router.RouteHandler;

var LogView = require('./log_view.js');
var SummaryList = require('./summary_list.js');
var StatusHeader = require('./status_header.js');

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

var routes = StatusHeader.tabs.map(function(tab) {
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

module.exports = UserRoute;
