#! /usr/bin/env ruby

# Usage:
#   comment report=<report-id> user=<login> action=<action> ...
#   comment action=config
#   comment action=preview mesage=<content>
# Actions:
#   get     [type=raw|html] [id=<comment-id>] [offset=<offset>] [limit=<limit>]
#           コメントを取得
#   post    message=<content> [ref=<comment-id>] [acl=<acl>]
#           コメントを投稿
#   edit    id=<comment-id> message=<content> [ref=<comment-id>] [acl=<acl>]
#           コメントを編集(上書き)
#   delete  id=<comment-id>
#           コメントを削除
#   read    id=<comment-id>
#           コメントを既読にする
#   news
#           未読コメント情報を取得
# Access Control List:
#   リストは,で区切る
#   none   管理者および投稿者のみ閲覧可
#   user   ポストされたコメントタブの属するユーザも閲覧可
#   other  ポストされたコメントタブの属するユーザ以外も閲覧可
# Security:
# Response:

$KCODE='UTF8'

$:.unshift('./lib')

STATUS = {
  400 => '400 Bad Request',
  403 => '403 Forbidden',
  500 => '500 Internal Server Error',
}

require 'fileutils'
require 'app'
require 'log'
require 'comment'

app = App.new

# action must be specified
action = app.param(:action)
app.error_exit(STATUS[400]) unless action

config = {
  'enable' => true,
  'max' => 256,
  'size_limit' => 1024 * 16,
  'acl' => app.conf[:record, :open] ? ['user', 'other' ] :  [ 'user' ],
}.merge(app.conf[:comment] || {})

if action == 'config'
  config['renderer'] = Comment::Renderer.create.type
  print(app.header)
  puts(app.json(config))
  exit
elsif action == 'preview'
  content = app.param(:message)
  renderer = Comment::Renderer.create
  print(app.cgi.header('type' => renderer.type))
  puts(renderer.render(content))
  exit
end

# check if comment feature is enabled
app.error_exit(STATUS[400]) unless config['enable']

# user must be specified
user = app.param(:user)
app.error_exit(STATUS[400]) unless user

# resolve real login name in case user id is a token
user = app.user_from_token(user)
app.error_exit(STATUS[400]) unless user

# report ID must be specified
report_id = app.param(:report)
app.error_exit(STATUS[400]) unless report_id

# permission check for other users
if !app.su? && app.user != user
  app.error_exit(STATUS[403]) if !app.conf[:record, :open]
  app.error_exit(STATUS[403]) if action != 'get'
end

def convert(val, &method)
  val = method.call(val) if val
  return val
end

begin
  group = app.su? ? :super : (app.user==user ? :user : :other)
  dir = App::KADAI + report_id + user + 'comment'
  FileUtils.mkdir_p(dir) unless dir.exist?
  comment = Comment.new(app.user, group, dir, config)

  case action
  when 'get'
    type = app.param(:type)
    id = convert(app.param(:id), &:to_i)
    offset = convert(app.param(:offset), &:to_i)
    limit = convert(app.param(:limit), &:to_i)
    args = { :type => type, :id => id, :offset => offset, :limit => limit }
    content = comment.retrieve(args)

    print(app.header)
    puts(app.json(content))

  when 'post'
    content = app.param(:message)
    ref = app.param(:ref)
    acl = convert(app.param(:acl)){|a| a.split(',')}
    r = comment.add(:content => content, :ref => ref, :acl => acl)

    print(app.cgi.header)
    puts('done')

  when 'edit'
    id = convert(app.param(:id), &:to_i)
    app.error_exit(STATUS[400]) unless id

    content = app.param(:message)
    ref = app.param(:ref)
    acl = convert(app.param(:acl)){|a| a.split(',')}
    r = comment.edit(:id => id, :content => content, :ref => ref, :acl => acl)

    print(app.cgi.header)
    puts('done')

  when 'delete'
    id = convert(app.param(:id), &:to_i)
    app.error_exit(STATUS[400]) unless id

    comment.delete(id)

    print(app.cgi.header)
    puts('done')

  when 'read'
    id = convert(app.param(:id), &:to_i)
    app.error_exit(STATUS[400]) unless id

    comment.read(id)

    print(app.cgi.header)
    puts('done')

  when 'news'
    content = comment.news

    print(app.header)
    puts(app.json(content))
  end

rescue Comment::NotFound
  app.error_exit(STATUS[400])
rescue Comment::PermissionDenied
  app.error_exit(STATUS[400])
rescue Comment::SizeLimitExceeded
  app.error_exit(STATUS[400], 'size limit exceeded')
rescue Comment::MaxCommentsExceeded
  app.error_exit(STATUS[400], 'max comments exceeded')
rescue => e
  app.error_exit(STATUS[500], [ e.to_s, e.backtrace ].join("\n"))
end
