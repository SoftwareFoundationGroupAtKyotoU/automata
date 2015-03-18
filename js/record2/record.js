var React = require('react');
window.React = React;
var Router = require('react-router');
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var Route = Router.Route;
var RouteHandler = Router.RouteHandler;
var $ = require('jquery');

var DetailList = require('./detail_list.js');
var SummaryList = require('./summary_list.js');
var UserRoute = require('./user.js');

var Record = React.createClass({
    toggleFilter: function() {
        this.setState({
            filtered: !this.state.filtered
        })
    },

    getInitialState: function() {
        return {
            admin: false,
            template: {},
            filtered: true,
            init: false
        };
    },

    componentDidMount: function() {
        $.when(
            $.get('../api/master.cgi', { admin: true }),
            $.get('../api/template.cgi', { type: 'record', links: true })
        ).done(function(master, template) {
            master = master[0];
            template = template[0];
            this.setState({
                admin: master.admin,
                template: template,
                init: true
            });
        }.bind(this));
    },

    render: function() {
        if (!this.state.init) {
            return (
                    <img src="../image/loading.gif"/>
            );
        } else {
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
            return (
                    <div>
                    <div id="article">
                    <h2 id="institute">{this.state.template.institute}</h2>
                    <h1 id="title">{this.state.template.title}</h1>
                    <h2 id="subtitle">{this.state.template.subtitle}</h2>
                    <ul>
                    <li>提出が済んだ場合は, 「提出済」と記載されます</li>
                    <li>提出内容に不備がある場合は, 「要再提出」と記載されます</li>
                    <li>提出しても, チェックが完了するまでは「確認中」と記載されます</li>
                    </ul>
                    <div id="record">
                    <div id="view_switch">
                    表示:<ul>
                    {filter}
                    <li><Link to="detail" id="sw_view_report">課題ごと</Link></li>
                    <li><Link to="summary" id="sw_view_summary">一覧</Link></li>
                    </ul>
                    </div>
                    <RouteHandler key={this.state.filtered} admin={this.state.admin} filtered={this.state.filtered && this.state.admin}/>
                    </div>
                    </div>
                    <div id="footer">
                    <a href={this.state.template.links[0].uri}>{this.state.template.links[0].label}</a>
                    <a href="../post/">提出ページ</a>
                    </div>
                    </div>
            );
        }
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
