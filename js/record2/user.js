var React = require('react');
window.React = React;
var Router = require('react-router');
var Route = Router.Route;
var DefaultRoute = Router.DefaultRoute;
var RouteHandler = Router.RouteHandler;
var $ = require('jquery');
require('jquery.cookie');

var LogView = require('./log_view.js');
var SummaryList = require('./summary_list.js');
var StatusHeader = require('./status_header.js');

var User = React.createClass({
    mixins: [Router.State],

    render: function() {
        var token = this.getParams().token;
        var report = this.getParams().report;
        $.cookie('default-report', report);
        return (
                <div>
                <SummaryList token={token} report={report} admin={this.props.admin} scheme={this.props.scheme}/>
                <div className="status_window">
                <StatusHeader/>
                <RouteHandler token={token} report={report} admin={this.props.admin} key={token + report}/>
                </div>
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
