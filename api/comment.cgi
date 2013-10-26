#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

# Usage:
#   comment report=<report-id> user=<login> action=<action> ...
#   comment action=list_news report=<report-id> user=<user1>&user=<user2>&user=...
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
#   list_news
#           未読コメント情報のリストを取得
#
# Access Control List:
#   リストは,で区切る
#   none   管理者および投稿者のみ閲覧可
#   user   ポストされたコメントタブの属するユーザも閲覧可
#   other  ポストされたコメントタブの属するユーザ以外も閲覧可
# Security:
# Response:

$KCODE='UTF8' if RUBY_VERSION < '1.9.0'

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
users = app.params['user']
app.error_exit(STATUS[400]) if users.empty?

# resolve real login name in case user id is a token
users = users.map {|u| app.user_from_token(u)}
users.compact!
app.error_exit(STATUS[400]) if users.empty?

# report ID must be specified
report_id = app.param(:report)
app.error_exit(STATUS[400]) unless report_id

# check the number of specified users
if users.length != 1
  app.error_exit(STATUS[403]) if action != 'list_news'
  app.error_exit(STATUS[403]) if !app.su?
end

# permission check for other users
if !app.su? && app.user != users[0]
  app.error_exit(STATUS[403]) if !app.conf[:record, :open]
  app.error_exit(STATUS[403]) if action != 'get'
end

def convert(val, &method)
  val = method.call(val) if val
  return val
end

begin
  comments = users.map do |u|
    group = app.su? ? :super : (app.user==u ? :user : :other)
    dir = App::KADAI + report_id + u + 'comment'
    FileUtils.mkdir_p(dir) unless dir.exist?
    {
      :user    => u,
      :comment => Comment.new(app.user, group, dir, config),
    }
  end

  case action
  when 'get'
    type = app.param(:type)
    id = convert(app.param(:id), &:to_i)
    offset = convert(app.param(:offset), &:to_i)
    limit = convert(app.param(:limit), &:to_i)
    args = { :type => type, :id => id, :offset => offset, :limit => limit }
    content = comments[0][:comment].retrieve(args)

    print(app.header)
    puts(app.json(content))

  when 'post'
    content = app.param(:message)
    ref = app.param(:ref)
    acl = convert(app.param(:acl)){|a| a.split(',')}
    r = comments[0][:comment].add(:content => content, :ref => ref, :acl => acl)

    print(app.cgi.header)
    puts('done')

  when 'edit'
    id = convert(app.param(:id), &:to_i)
    app.error_exit(STATUS[400]) unless id

    content = app.param(:message)
    ref = app.param(:ref)
    acl = convert(app.param(:acl)){|a| a.split(',')}
    r = comments[0][:comment] \
      .edit(:id => id, :content => content, :ref => ref, :acl => acl)

    print(app.cgi.header)
    puts('done')

  when 'delete'
    id = convert(app.param(:id), &:to_i)
    app.error_exit(STATUS[400]) unless id

    comments[0][:comment].delete(id)

    print(app.cgi.header)
    puts('done')

  when 'read'
    id = convert(app.param(:id), &:to_i)
    app.error_exit(STATUS[400]) unless id

    comments[0][:comment].read(id)

    print(app.cgi.header)
    puts('done')

  when 'news'
    content = comments[0][:comment].news

    print(app.header)
    puts(app.json(content))

  when 'list_news'
    name_to_token = Hash[*app.users.map {|u| [ u.real_login, u.token ]}.flatten]
    content = Hash[*comments.map {|c|
                     [ name_to_token[c[:user]], c[:comment].news ]
                   }.flatten]

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
