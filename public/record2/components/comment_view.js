var sum_rep = "summary-report2";

var React = require('react');
window.React = React;
var Router = require('react-router');
var $ = require('jquery');
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var Route = Router.Route;
var RouteHandler = Router.RouteHandler;

var UserModule = require('./user.js');
var StatusHeader = UserModule.statusHeader;

const mode = { normal: 0, edit: 1, preview: 2 };

var Comment = React.createClass({
    getInitialState: function() {
      return { modeState: mode['normal'],
               commentHTML: this.props.comment.content,
               commentText: '',
               aclUserFlag: this.props.acl.indexOf('user') != -1,
               aclOtherFlag: this.props.acl.indexOf('other') != -1,
               loadingFlag: false };
    },
    setMode: function(mode_text) {
      this.setState({modeState: mode[mode_text]});
    },
    normalMode: function() { this.setMode('normal'); },
    editMode: function() { this.setMode('edit'); },
    previewMode: function() { this.setMode('preview'); },
    isMode: function(mode_text) { return this.state.modeState == mode[mode_text]; },
    isNormalMode: function() { return this.isMode('normal'); },
    isEditMode: function() { return this.isMode('edit'); },
    isPreviewMode: function() { return this.isMode('preview'); },

    setCommentHTML: function(txt) { this.setState({ commentHTML: txt }); },
    getCommentHTML: function() { return this.state.commentHTML; },
    setCommentText: function(txt) { this.setState({ commentText: txt }); },
    getCommentText: function() { return this.state.commentText; },

    loadingModeStart: function() { this.setState({ loadingFlag: true }); },
    loadingModeEnd: function() { this.setState({ loadingFlag: false }); },

    reloadComment: function(cont) {
      this.loadingModeStart();
      $.get('../api/comment.cgi',
          {  
            user: this.props.token,
            report: this.props.report,
            action: 'get',
            id: this.props.comment.id,
            timestamp: this.props.comment.timestamp
          },
          function(result) {
            this.setCommentHTML(result[0].content);
            this.setState({ aclUserFlag: result[0].acl.indexOf('user') != -1,
                            aclOtherFlag: result[0].acl.indexOf('other') != -1 });
            this.loadingModeEnd();
            cont();
          }.bind(this));
    },

    onCheckAclUser: function(event) {
        this.setState({ aclUserFlag: !this.state.aclUserFlag });
    },
    onCheckAclOther: function(event) {
        this.setState({ aclOtherFlag: !this.state.aclOtherFlag });
    },

    onComment: function() {
        var aclAry = [];
        if (this.state.aclUserFlag) { aclAry.push('user'); }
        if (this.state.aclOtherFlag) { aclAry.push('other'); }
        var aclText = aclAry.join(',');
        $.ajax({
          type: 'POST',
          url: '../api/comment.cgi',
          data: {
            user: this.props.token,
            report: this.props.report,
            action: 'edit',
            id: this.props.comment.id,
            acl: aclText,
            message: this.getCommentText()
          },
          complete: function(data) {
            this.reloadComment(function() { this.normalMode(); }.bind(this));
          }.bind(this)
        });
    },

    onEdit: function() {
      $.get('../api/comment.cgi',
          {  
            user: this.props.token,
            report: this.props.report,
            id: this.props.comment.id,
            action: 'get',
            type: 'raw'
          },
          function(result) {
            this.setCommentText(result[0].content);
            this.editMode();
          }.bind(this));
    },
    
    onDelete: function() {
      var text = 'このコメント['
               + this.props.comment.user
               + ': ' + this.props.comment.timestamp
               + ']を削除しますか？';
      if (window.confirm(text)) {
        $.ajax({
          type: 'POST',
          url: '../api/comment.cgi',
          data: {
            user: this.props.comment.user,
            report: this.props.report,
            action: 'delete',
            id: this.props.comment.id
          },
          complete: function(data) {
            this.props.rerender();
          }.bind(this)
        });
      }
    },

    onPreview: function() {
      // from commentText to commentHTML
      $.get('../api/comment.cgi',
          {  
            action: 'preview',
            message: this.getCommentText()
          },
          function(result) {
            this.setCommentHTML(result);
            this.previewMode();
          }.bind(this));
    },

    onCancel: function() {
      this.reloadComment(function () { this.normalMode(); }.bind(this));
    },

    handleChange: function(event) {
      this.setCommentText(event.target.value);
    },

    aclMessage: function() {
        if (this.state.aclUserFlag && this.state.aclOtherFlag) {
          return "全員に公開";
        } else if (this.state.aclUserFlag) {
          return "提出者に公開";
        } else if (this.state.aclOtherFlag) {
          return "提出者以外に公開";
        } else {
          return "非公開";
        }
    },

    render: function() {
        if (this.state.loadingFlag) {
          return <li><div className="form"><img src="../record/loading.gif" /></div></li>;
        }

        var comment_box;
        if (this.isNormalMode()) {
          comment_box = (
            <div className="form">
              <div className="message" dangerouslySetInnerHTML={{__html: this.getCommentHTML()}} />
            </div>
          );
        } else if (this.isEditMode()) {
          comment_box = (
            <div className="form">
              <textarea rows="6" value={this.getCommentText()} onChange={this.handleChange} />
              <input type="submit" value="コメントする" onClick={this.onComment}></input>
              <input type="button" value="プレビュー" onClick={this.onPreview}></input>
              <input type="button" value="キャンセル" onClick={this.onCancel}></input>
              <input id="summary-report2_comment_acl_user" type="checkbox" name="user" checked={this.state.aclUserFlag} onChange={this.onCheckAclUser} />
              <label htmlFor="summary-report2_comment_acl_user">提出者に公開</label>
              <input id="summary-report2_comment_acl_other" type="checkbox" name="other" checked={this.state.aclOtherFlag} onChange={this.onCheckAclOther} />
              <label htmlFor="summary-report2_comment_acl_other">提出者以外に公開</label>
            </div>
          );
        } else if (this.isPreviewMode()) {
          comment_box = (
            <div className="form">
              <div className="preview message" dangerouslySetInnerHTML={{__html: this.getCommentHTML()}} />
              <input type="submit" value="コメントする" onClick={this.onComment}></input>
              <input type="button" value="再編集" onClick={this.onEdit}></input>
              <input type="button" value="キャンセル" onClick={this.onCancel}></input>
              <input id="summary-report2_comment_acl_user" type="checkbox" name="user" checked={this.state.aclUserFlag} onChange={this.onCheckAclUser} />
              <label htmlFor="summary-report2_comment_acl_user">提出者に公開</label>
              <input id="summary-report2_comment_acl_other" type="checkbox" name="other" checked={this.state.aclOtherFlag} onChange={this.onCheckAclOther} />
              <label htmlFor="summary-report2_comment_acl_other">提出者以外に公開</label>
            </div>
          );
        } else {
          console.log("Error: Comment render");
        }
        return (
          // TODO: ここのliの条件分岐何とかしたい．今は空文字のときもタグにclassが付く
          <li id={sum_rep + "-comment" + this.props.comment.id} className={!this.state.aclUserFlag && !this.state.aclOtherFlag?"private":" "}>
          <div className="meta">
          <p className="author">{this.props.comment.user}</p>
          <p className="edit">
          <a title="編集する" onClick={this.onEdit}>✏</a>
          <a title="削除する" onClick={this.onDelete}>✖</a>
          </p>
          <p className="acl">{this.aclMessage()}</p>
          <p className="date">{this.props.comment.timestamp}</p>
          </div>
          {comment_box}
          </li>
          );
    }
});

var CommentForm = React.createClass({
    getInitialState: function() {
        return { isPreview: false,
                 textValue: "",
                 aclUserFlag: false,
                 aclOtherFlag: false };
    },
    setIsPreview: function(b) { this.setState({isPreview: b}); },
    getIsPreview: function() { return this.state.isPreview; },
    setTextValue: function(txt) { this.setState({ textValue: txt }); },
    getTextValue: function() { return this.state.textValue; },
    resetValue: function() { this.setTextValue(''); this.setIsPreview(false); },
    onComment: function(event) {
        var aclAry = [];
        if (this.state.aclUserFlag) { aclAry.push('user'); }
        if (this.state.aclOtherFlag) { aclAry.push('other'); }
        var aclText = aclAry.join(',');
        $.ajax({
          type: 'POST',
          url: '../api/comment.cgi',
          data: {
            user: this.props.token,
            report: this.props.report,
            action: 'post',
            acl:  aclText,
            message: this.getTextValue()
          },
          complete: function(data) {
            this.props.rerender();
            this.resetValue();
          }.bind(this)
        });
    },
    onPreview: function(event) { this.setIsPreview(!this.getIsPreview()); },
    handleChange: function(event) { this.setTextValue(event.target.value); },
    onCheckAclUser: function(event) { this.setState({ aclUserFlag: !this.state.aclUserFlag }); },
    onCheckAclOther: function(event) { this.setState({ aclOtherFlag: !this.state.aclOtherFlag }); },
    render: function() {
        var preview_reedit_text = this.getIsPreview()?"再編集":"プレビュー";
        var comment_area;
        if (!this.getIsPreview()) {
            comment_area = (
                <textarea rows="6" value={this.getTextValue()} onChange={this.handleChange} />
            );
        } else {
            comment_area = (
                <div className="preview messsage">
                    <p>{this.getTextValue()}</p>
                </div>
            );
        }
        return (
            <div className="form">
            {comment_area}
            <input type="submit" onClick={this.onComment} value="コメントする"/>
            <input type="button" onClick={this.onPreview} value={preview_reedit_text} />
            <input id="summary-report2_comment_acl_user" type="checkbox" name="user" onClick={this.onCheckAclUser} />
            <label htmlFor="summary-report2_comment_acl_user">提出者に公開</label>
            <input id="summary-report2_comment_acl_other" type="checkbox" name="other" onClick={this.onCheckAclOther} />
            <label htmlFor="summary-report2_comment_acl_other">提出者以外に公開</label>
            </div>
        );
    }
});

var CommentView = React.createClass({
    getInitialState: function() {
        return {
            comments: []
        };
    },

    componentDidMount: function() {
      this.rerender();
    },

    rerender: function() {
      $.get('../api/comment.cgi',
          {  
            user: this.props.token,
            report: this.props.report,
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
                    <Comment comment={comment} token={this.props.token} report={this.props.report} acl={comment.acl} rerender={this.rerender}/>
            );
        }.bind(this));
        return (
                <div className="status_window">
                  <StatusHeader tabName="comment" /* toolBar={ function() { return <p>古典論理の犬</p>; } } */ />
                  <div className="status_view">
                  <ul className="comments">
                  {comments}
                  <li><CommentForm token={this.props.token} report={this.props.report} rerender={this.rerender} /></li>
                  </ul>
                  </div>
                </div>
        );
    }
});

module.exports = {
    comment: Comment,
    commentForm: CommentForm,
    commentView: CommentView
};
