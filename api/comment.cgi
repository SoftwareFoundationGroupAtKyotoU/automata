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

require 'fileutils'
require_relative '../lib/app'
require_relative '../lib/log'
require_relative '../lib/comment'
require_relative '../lib/cgi_helper'

helper = CGIHelper.new
app = App.new(helper.cgi.remote_user)

# action must be specified
action = helper.param(:action)
helper.exit_with_bad_request unless action

config = {
  'enable' => true,
  'max' => 256,
  'size_limit' => 1024 * 16,
  'acl' => app.conf[:record, :open] ? [ 'user', 'other' ] :  [ 'user' ],
}.merge(app.conf[:comment] || {})

if action == 'config'
  config['renderer'] = Comment::Renderer.create.type
  print(helper.header)
  puts(helper.json(config))
  exit
elsif action == 'preview'
  content = helper.param(:message)
  renderer = Comment::Renderer.create
  print(helper.cgi.header('type' => renderer.type))
  puts(renderer.render(content))
  exit
end

# check if comment feature is enabled
helper.exit_with_bad_request unless config['enable']

# user must be specified
users = helper.params['user']
helper.exit_with_bad_request if users.empty?

# resolve real login name in case user id is a token
users = users.map {|u| app.user_from_token(u)}
users.compact!
helper.exit_with_bad_request if users.empty?

# report ID must be specified
report_id = helper.param(:report)
helper.exit_with_bad_request unless report_id

# check the number of specified users
if users.length != 1
  helper.exit_with_forbidden if action != 'list_news' || !app.su?
end

# permission check for other users
if !app.su? && app.user != users[0]
  helper.exit_with_forbidden if !app.conf[:record, :open] || action != 'get'
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
    type = helper.param(:type)
    id = convert(helper.param(:id), &:to_i)
    offset = convert(helper.param(:offset), &:to_i)
    limit = convert(helper.param(:limit), &:to_i)
    args = { :type => type, :id => id, :offset => offset, :limit => limit }
    content = comments[0][:comment].retrieve(args)
    # Get user names
    user_names = app.user_names_from_tokens(content.map {|entry| entry['user']})
    content = content.map {|entry|
      entry.merge({ :user_name => user_names[entry['user']] })
    }

    print(helper.header)
    puts(helper.json(content))

  when 'post'
    content = helper.param(:message)
    ref = helper.param(:ref)
    acl = convert(helper.param(:acl)){|a| a.split(',')}
    r = comments[0][:comment].add(:content => content, :ref => ref, :acl => acl)

    print(helper.cgi.header)
    puts('done')

  when 'edit'
    id = convert(helper.param(:id), &:to_i)
    helper.exit_with_bad_request unless id

    content = helper.param(:message)
    ref = helper.param(:ref)
    acl = convert(helper.param(:acl)){|a| a.split(',')}
    r = comments[0][:comment] \
      .edit(:id => id, :content => content, :ref => ref, :acl => acl)

    print(helper.cgi.header)
    puts('done')

  when 'delete'
    id = convert(helper.param(:id), &:to_i)
    helper.exit_with_bad_request unless id

    comments[0][:comment].delete(id)

    print(helper.cgi.header)
    puts('done')

  when 'read'
    id = convert(helper.param(:id), &:to_i)
    helper.exit_with_bad_request unless id

    comments[0][:comment].read(id)

    print(helper.cgi.header)
    puts('done')

  when 'news'
    content = comments[0][:comment].news

    print(helper.header)
    puts(helper.json(content))

  when 'list_news'
    name_to_token = Hash[*app.users.map {|u| [ u.real_login, u.token ]}.flatten]
    content = Hash[*comments.map {|c|
                     [ name_to_token[c[:user]], c[:comment].news ]
                   }.flatten]

    print(helper.header)
    puts(helper.json(content))
  end

rescue Comment::NotFound
  helper.exit_with_bad_request
rescue Comment::PermissionDenied
  helper.exit_with_bad_request
rescue Comment::SizeLimitExceeded
  helper.exit_with_bad_request('size limit exceeded')
rescue Comment::MaxCommentsExceeded
  helper.exit_with_bad_request('max comments exceeded')
rescue => e
  helper.exit_with_internal_server_error([ e.to_s, e.backtrace ].join("\n"))
end
