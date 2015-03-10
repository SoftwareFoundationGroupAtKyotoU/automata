var sum_rep = "summary-report2";

var Router = ReactRouter;
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var Route = Router.Route;
var RouteHandler = Router.RouteHandler;

var Comment = React.createClass({
    render: function() {
        return (
                <li id={sum_rep + "-comment" + this.props.comment.id}>
                <div className="meta">
                <p className="author">{this.props.comment.user}</p>
                <p className="edit">
                <a title="編集する">✏</a>
                <a title="削除する">✖</a>
                </p>
                <p className="acl">提出者に公開</p>
                <p className="date">{this.props.comment.timestamp}</p>
                </div>
                <div className="message">{this.props.comment.content}</div>
                </li>
        );
    }
});

var CommentForm = React.createClass({
    render: function() {
        return (
                <div className="form">
                <textarea rows="6"/>
                <input type="submit" value="コメントする"/>
                <input type="button" value="プレビュー"/>
                <input id="summary-report2_comment_acl_user" type="checkbox" name="user"/>
                <label htmlFor="summary-report2_comment_acl_user">提出者に公開</label>
                <input id="summary-report2_comment_acl_other" type="checkbox" name="other"/>
                <label htmlFor="summary-report2_comment_acl_other">提出者以外に公開</label>
                </div>
        );
    }
});

var CommentView = React.createClass({
    mixins: [Router.State],

    getInitialState: function() {
        return {
            comments: []
        };
    },

    componentDidMount: function() {
        $.get('../api/comment.cgi',
              {
                  user: this.getParams().token,
                  report: this.getParams().report,
                  action: 'get',
              },
              function(result) {
                  this.setState({
                      comments: result
                  });
              }.bind(this));
    },

    render: function() {
        var comments = this.state.comments.map(function(comment) {
            return (
                    <Comment comment={comment}/>
            );
        });
        return (
                <div className="status_window">
                <StatusHeader tabName='comment'/>
                <div className="status_view">
                <ul className="comments">
                {comments}
                <li><CommentForm/></li>
                </ul>
                </div>
                </div>
        );
    }
});
