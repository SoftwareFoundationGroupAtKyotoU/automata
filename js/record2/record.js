var React = require('react');
window.React = React;
var Router = require('react-router');
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var Route = Router.Route;
var RouteHandler = Router.RouteHandler;
var $ = require('jquery');
require('jquery.cookie');
var api = require('../api');

var DetailList = require('./detail_list.js');
var SummaryList = require('./summary_list.js');
var UserRoute = require('./user.js');

var Record = React.createClass({
    mixins: [
        Router.Navigation,
        Router.State
    ],

    toggleFilter: function() {
        $.cookie('default-filtered', !this.state.filtered);
        this.setState({
            filtered: !this.state.filtered
        });
    },

    componentDidMount: function() {
        $.when(
            $.get('../api/master.cgi', { admin: true, token: true }),
            $.get('../api/template.cgi', { type: 'record', links: true }),
            $.get('../api/scheme.cgi', { record: true })
        ).done(function(master, template, scheme) {
            master = master[0];
            template = template[0];
            scheme = scheme[0];
            var filtered = $.cookie('default-filtered');
            if (typeof filtered === 'undefined' || filtered === 'true') {
                filtered = true;
            } else {
                filtered = false;
            }
            $.cookie('default-filtered', filtered);
            this.setState({
                admin: master.admin,
                template: template,
                scheme: scheme,
                filtered: filtered
            });
            if (!master.admin && this.getPath() === '/') {
                var report = $.cookie('default-report');
                if (!report) report = scheme[0].id;
                this.replaceWith('user', {
                    token: master.token,
                    report: report
                });
            }
        }.bind(this));
    },

    render: function() {
        if (!this.state) return (<img src="../image/loading.gif"/>);

        var filter;
        if (this.state.admin) {
            if (this.state.filtered) {
                filter = (
                        <li>
                        <label>
                        <input type="checkbox" onChange={this.toggleFilter} checked/>
                        担当学生のみ
                        </label>
                        </li>
                );
            } else {
                filter = (
                        <li>
                        <label>
                        <input type="checkbox" onChange={this.toggleFilter}/>
                        担当学生のみ
                        </label>
                        </li>
                );
            }
        }
        var institute = this.state.template.institute
            ? (<h2 id="institute">{this.state.template.institute}</h2>)
            : null;
        var title = this.state.template.title
            ? (<h1 id="title">{this.state.template.title}</h1>)
            : null;
        var subtitle = this.state.template.subtitle
            ? (<h2 id="subtitle">{this.state.template.subtitle}</h2>)
            : null;
        return (
                <div>
                <div id="article">
                {institute}{title}{subtitle}
                <div id="record">
                <div id="view_switch">
                表示:<ul>
                {filter}
                <li><Link to="detail" id="sw_view_report">課題ごと</Link></li>
                <li><Link to="summary" id="sw_view_summary">一覧</Link></li>
                </ul>
                </div>
                <RouteHandler key={this.state.filtered}
                              admin={this.state.admin}
                              scheme={this.state.scheme}
                              filtered={this.state.filtered && this.state.admin}/>
                </div>
                </div>
                <div id="footer">
                <a href={this.state.template.links[0].uri}>{this.state.template.links[0].label}</a>
                <a href="../post/">提出ページ</a>
                </div>
                </div>
        );
    }
});

var routes = (
        <Route name="record" path="/" handler={Record}>
        <Route name="detail" path="detail" handler={DetailList}/>
        <Route name="summary" path="summary" handler={SummaryList}/>
        {UserRoute}
        <DefaultRoute handler={SummaryList}/>
        </Route>
);

Router.run(routes, function(Handler) {
    React.render(<Handler/>, document.body);
});
