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
    getInitialState: function() {
        return {
            admin: false,
            template: {
                institute: 'institute',
                title: 'title',
                subtitle: 'subtitle',
                links: [
                    { uri: '', label: '' }
                ]
            }
        };
    },

    componentDidMount: function() {
        $.get('../api/master.cgi',
              {
                  admin: true
              },
              function(result) {
                  this.setState({
                      admin: result.admin
                  });
              }.bind(this));
        $.get('../api/template.cgi',
              {
                  type: 'record',
                  links: true
              },
              function(result) {
                  this.setState({
                      template: result
                  });
              }.bind(this));
    },

    render: function() {
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
                <li><Link to="detail" id="sw_view_report">課題ごと</Link></li>
                <li><Link to="summary" id="sw_view_summary">一覧</Link></li>
                </ul>
                </div>
                <RouteHandler admin={this.state.admin}/>
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
