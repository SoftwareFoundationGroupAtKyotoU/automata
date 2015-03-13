var sum_rep = "summary-report2";

var React = require('react');
window.React = React;
var Router = require('react-router');
var $ = require('jquery');
var DefaultRoute = Router.DefaultRoute;
var Link = Router.Link;
var Route = Router.Route;
var RouteHandler = Router.RouteHandler;

const ACL_MESSAGE_FOR_ALL      = "全員に公開";
const ACL_MESSAGE_FOR_USER     = "提出者に公開";
const ACL_MESSAGE_FOR_OTHER    = "提出者以外に公開";
const ACL_MESSAGE_FOR_PRIVATE  = "非公開";
const mode = { normal: 0, edit: 1, preview: 2 };

function formAclArgument(userFlag, otherFlag)
{
    var aclAry = [];
    if (userFlag) { aclAry.push('user'); }
    if (otherFlag) { aclAry.push('other'); }
    return aclAry.join(',');
}

var Comment = React.createClass({
    getInitialState: function() {
        return {
            modeState: mode['normal'],
            commentHTML: this.props.comment.content,
            commentText: '',
            aclUserFlag: this.props.acl.indexOf('user') != -1,
            aclOtherFlag: this.props.acl.indexOf('other') != -1,
            loadingFlag: false
        };
    },
    setMode: function(mode_text)  { this.setState({modeState: mode[mode_text]}); },
    normalMode: function()        { this.setMode('normal'); },
    editMode: function()          { this.setMode('edit'); },
    previewMode: function()       { this.setMode('preview'); },
    isMode: function(mode_text)   { return this.state.modeState == mode[mode_text]; },
    isNormalMode: function()      { return this.isMode('normal'); },
    isEditMode: function()        { return this.isMode('edit'); },
    isPreviewMode: function()     { return this.isMode('preview'); },

    setCommentHTML: function(txt) { this.setState({ commentHTML: txt }); },
    getCommentHTML: function()    { return this.state.commentHTML; },
    setCommentText: function(txt) { this.setState({ commentText: txt }); },
    getCommentText: function()    { return this.state.commentText; },

    loadingModeStart: function()  { this.setState({ loadingFlag: true }); },
    loadingModeEnd: function()    { this.setState({ loadingFlag: false }); },

    reloadComment: function(cont) {
        this.loadingModeStart();
        $.get('../api/comment.cgi',
                {
                    user: [this.props.token],
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
        $.ajax({
            type: 'POST',
            url: '../api/comment.cgi',
            data: {
                user: [this.props.token],
                report: this.props.report,
                action: 'edit',
                id: this.props.comment.id,
                acl: formAclArgument(this.state.aclUserFlag, this.state.aclOtherFlag),
                message: this.getCommentText()
            },
            complete: function(data) {
                this.reloadComment(function() { this.normalMode(); }.bind(this));
            }.bind(this)});
    },

    onEdit: function() {
        $.get('../api/comment.cgi',
                {
                    user: [this.props.token],
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
                    user: [this.props.comment.user],
                    report: this.props.report,
                    action: 'delete',
                    id: this.props.comment.id
                },
                complete: function(data) {
                    this.props.rerender();
                }.bind(this)});
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

    getAclMessage: function(userFlag, otherFlag) {
        if (userFlag && otherFlag) {
            return ACL_MESSAGE_FOR_ALL;
        } else if (userFlag) {
            return ACL_MESSAGE_FOR_USER;
        } else if (otherFlag) {
            return ACL_MESSAGE_FOR_OTHER;
        } else {
            return ACL_MESSAGE_FOR_PRIVATE;
        }
    },

    render: function() {
        if (this.state.loadingFlag) {
            return <li><div className="form"><img src="../record/loading.gif" /></div></li>;
        }

        const buttons = (
            <span>
                <input type="submit" value="コメントする" onClick={this.onComment}></input>
                <input type="button" value="プレビュー" onClick={this.onPreview}></input>
                <input type="button" value="キャンセル" onClick={this.onCancel}></input>
            </span>
        );
        var checkBox;
        if (this.props.admin) {
            checkBox = (
                <span>
                    <input id="summary-report2_comment_acl_user" type="checkbox" name="user" checked={this.state.aclUserFlag} onChange={this.onCheckAclUser} />
                    <label htmlFor="summary-report2_comment_acl_user">{ACL_MESSAGE_FOR_USER}</label>
                    <input id="summary-report2_comment_acl_other" type="checkbox" name="other" checked={this.state.aclOtherFlag} onChange={this.onCheckAclOther} />
                    <label htmlFor="summary-report2_comment_acl_other">{ACL_MESSAGE_FOR_OTHER}</label>
                </span>
          );
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
                    {buttons}
                    {checkBox}
                </div>
          );
        } else if (this.isPreviewMode()) {
            comment_box = (
                <div className="form">
                    <div className="preview message" dangerouslySetInnerHTML={{__html: this.getCommentHTML()}} />
                    {buttons}
                    {checkBox}
                </div>
             );
        } else {
            console.log("Error: Comment render");
        }

        var editButtons;
        // TODO: "this.comment.user_token"的なのが欲しい．
        if (this.props.admin || this.props.token == "dummy" ) {
            editButtons = (
                <p className="edit">
                    <a title="編集する" onClick={this.onEdit}>✏</a>
                    <a title="削除する" onClick={this.onDelete}>✖</a>
                </p>
            );
        }

        const li_id = sum_rep + "-comment" + this.props.comment.id;
        const div_meta = (
            <div className="meta">
                <p className="author">{this.props.comment.user_name}</p>
                {editButtons}
                <p className="acl">{this.getAclMessage(this.state.aclUserFlag, this.state.aclOtherFlag)}</p>
                <p className="date">{this.props.comment.timestamp}</p>
            </div>
        );
        if (!this.state.aclUserFlag && !this.state.aclOtherFlag) {
            return <li id={li_id} className="private">{div_meta}{comment_box}</li>;
        } else {
            return <li id={li_id}>{div_meta}{comment_box}</li>;
        }
    }
});

var CommentForm = React.createClass({
    getInitialState: function() {
        return {
            isPreview: false,
            textValue: "",
            aclUserFlag: true,
            aclOtherFlag: false
        };
    },
    setIsPreview: function(b)   { this.setState({isPreview: b}); },
    getIsPreview: function()    { return this.state.isPreview; },
    setTextValue: function(txt) { this.setState({ textValue: txt }); },
    getTextValue: function()    { return this.state.textValue; },
    resetValue: function()      { this.setTextValue(''); this.setIsPreview(false); },

    onCheckAclUser: function(event)   { this.setState({ aclUserFlag: !this.state.aclUserFlag }); },
    onCheckAclOther: function(event)  { this.setState({ aclOtherFlag: !this.state.aclOtherFlag }); },

    onPreview: function(event)        { this.setIsPreview(!this.getIsPreview()); },
    handleChange: function(event)     { this.setTextValue(event.target.value); },

    onComment: function(event) {
        $.ajax({
            type: 'POST',
            url: '../api/comment.cgi',
            data: {
                user: [this.props.token],
                report: this.props.report,
                action: 'post',
                acl:  formAclArgument(this.state.aclUserFlag, this.state.aclOtherFlag),
                message: this.getTextValue()
            },
            complete: function(data) {
                this.props.rerender();
                this.resetValue();
            }.bind(this)});
    },

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
        var checkBox;
        if (this.props.admin) {
            checkBox = (
                <span>
                    <input id="summary-report2_comment_acl_user" type="checkbox" name="user" checked={this.state.aclUserFlag} onClick={this.onCheckAclUser} />
                    <label htmlFor="summary-report2_comment_acl_user">{ACL_MESSAGE_FOR_USER}</label>
                    <input id="summary-report2_comment_acl_other" type="checkbox" name="other" checked={this.state.aclOtherFlag} onClick={this.onCheckAclOther} />
                    <label htmlFor="summary-report2_comment_acl_other">{ACL_MESSAGE_FOR_OTHER}</label>
                </span>
            );
        }
        return (
            <div className="form">
                {comment_area}
                <input type="submit" onClick={this.onComment} value="コメントする"/>
                <input type="button" onClick={this.onPreview} value={preview_reedit_text} />
                {checkBox}
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
                    user: [this.props.token],
                    report: this.props.report,
                    action: 'get',
                },
                function(result) {
                    this.setState({ comments: result});
                }.bind(this));
    },

    render: function() {
        var comments = this.state.comments.map(function(comment) {
            return (
                <Comment comment={comment} admin={this.props.admin} token={this.props.token} report={this.props.report} acl={comment.acl} rerender={this.rerender}/>
            );
        }.bind(this));
        return (
            <div>
                <div className="status_view">
                    <ul className="comments">
                        {comments}
                        <li>
                            <CommentForm admin={this.props.admin} token={this.props.token} report={this.props.report} rerender={this.rerender} />
                        </li>
                    </ul>
                </div>
            </div>
        );
    }
});

module.exports = CommentView;
