# -*- coding: utf-8 -*-

require 'rack'
require 'fileutils'
require_relative '../syspath'
require_relative '../app'
require_relative '../user'
require_relative '../log'
require_relative '../comment'
require_relative '../helper'

module API
  # Usage:
  #   comment report=<report-id> user=<login> action=<action> ...
  #   comment action=list_news user[]=<login>
  #   comment action=config
  #   comment action=preview mesage=<content>
  # Actions:
  #   get     [type=raw|html] [id=<comment-id>] [offset=<offset>] [limit=<limit>]
  #           コメントを取得
  #   post    message=<content> [acl=<acl>]
  #           コメントを投稿
  #   edit    id=<comment-id> message=<content> [acl=<acl>]
  #           コメントを編集(上書き)
  #   delete  id=<comment-id>
  #           コメントを削除
  #   read    id=<comment-id>
  #           コメントを既読にする
  #   unread  id=<comment-id>
  #           コメントを未読にする
  #   star    id=<comment-id>
  #           コメントに星印を付ける
  #   unstar  id=<comment-id>
  #           コメントの星印を外す
  #   news
  #           未読コメント情報を取得
  #   list_news
  #           未読コメント情報のリストを取得
  #
  # Access Control List:
  #   リストは,で区切る  # FIXME: Where do we need to use list?
  #   none   管理者および投稿者のみ閲覧可
  #   user   ポストされたコメントタブの属するユーザも閲覧可
  #   other  ポストされたコメントタブの属するユーザ以外も閲覧可
  # Security:
  # Response:
  class Comment
    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])

      # action must be specified
      action = helper.params['action']
      return helper.bad_request unless action

      config = {
        'enable' => true,
        'max' => 256,
        'size_limit' => 1024 * 16,
        'acl' => app.conf[:master, :record, :open] ? %(user other) : %(user)
      }.merge(app.conf[:master, :comment] || {})

      if action == 'config'
        config['renderer'] = ::Comment::Renderer.create.type
        return helper.json_response(config)
      elsif action == 'preview'
        content = helper.params['message']
        renderer = ::Comment::Renderer.create
        return helper.ok(renderer.render(content), {'Content-Type' => renderer.type})
      end

      # check if comment feature is enabled
      return helper.bad_request unless config['enable']

      # user must be specified
      users = helper.params['user']
      return helper.bad_request if users.nil? || users.empty?

      # user must be an array
      unless users.is_a?(Array)
        return helper.bad_request('user must be provided as user[]=<login>')
      end

      # resolve real login name in case user id is a token
      users = users.map { |u| ::User.from_token_or_login(u) }
      users.compact!
      return helper.bad_request if users.empty?

      # report ID must be specified
      report_id = helper.params['report']
      return helper.bad_request unless report_id || action == 'list_news'

      # check the number of specified users
      if users.length != 1
        return helper.forbidden if action != 'list_news' || !app.su?
      end

      # permission check for other users
      if !app.su? && app.user.real_login != users[0].real_login
        if !app.conf[:master, :record, :open] || action != 'get'
          return helper.forbidden
        end
      end

      # FIXME: What is this method?
      def convert(val, &method)
        val = method.call(val) if val
        val
      end

      begin
        report_ids = report_id ? [report_id] : app.conf[:scheme, :scheme].map{|r| r['id']}
        comments = Hash[*report_ids.map do |id|
                          c = users.map do |u|
                            group = app.su? ? :super : (app.user.real_login == u.real_login ? :user : :other)
                            dir = SysPath.comment_dir(id, u)
                            FileUtils.mkdir_p(dir) unless dir.exist?
                            {
                              user:    u,
                              comment: ::Comment.new(app.user.login, group, dir, config)
                            }
                          end
                          [id, c]
                        end.flatten(1)]

        case action
        when 'get'
          type    = helper.params['type']
          id      = convert(helper.params['id'], &:to_i)
          offset  = convert(helper.params['offset'], &:to_i)
          limit   = convert(helper.params['limit'], &:to_i)
          args    = { type: type, id: id, offset: offset, limit: limit }
          content = comments[report_id][0][:comment].retrieve(args)
          # Get user names
          user_names = user_names_from_logins(content.map { |entry| entry['user'] })
          starList = comments[report_id][0][:comment].stars()
          content = content.map do |entry|
            entry.merge(user_name: user_names[entry['user']],
                        starFlag: starList[entry['id']])
          end

          return helper.json_response(content)
        when 'post'
          content = helper.params['message']
          acl = convert(helper.params['acl']) { |a| a.split(',') }
          comments[report_id][0][:comment].add(content: content, acl: acl)

          return helper.ok('done')
        when 'edit'
          id = convert(helper.params['id'], &:to_i)
          helper.exit_with_bad_request unless id

          content = helper.params['message']
          acl = convert(helper.params['acl']) { |a| a.split(',') }
          comments[report_id][0][:comment] \
            .edit(id: id, content: content, acl: acl)

          return helper.ok('done')
        when 'delete'
          id = convert(helper.params['id'], &:to_i)
          return helper.bad_request unless id

          comments[report_id][0][:comment].delete(id)

          helper.ok('done')
        when 'read'
          id = convert(helper.params['id'], &:to_i)
          return helper.bad_request unless id

          comments[report_id][0][:comment].read(id)

          return helper.ok('done')
        when 'unread'
          id = convert(helper.params['id'], &:to_i)
          return helper.bad_request unless id

          comments[report_id][0][:comment].unread(id)

          return helper.ok('done')
        when 'star'
          id = convert(helper.params['id'], &:to_i)
          return helper.bad_request unless id

          comments[report_id][0][:comment].star(id)

          return helper.ok('done')
        when 'unstar'
          id = convert(helper.params['id'], &:to_i)
          return helper.bad_request unless id

          comments[report_id][0][:comment].unstar(id)

          return helper.ok('done')
        when 'news'
          content = comments[report_id][0][:comment].news

          return helper.json_response(content)
        when 'list_news'
          name_to_token =
            Hash[*app.visible_users.map do |u|
                   [u.real_login, u.token]
                 end.flatten]
          content = Hash[*report_ids.map do |id|
                           c = Hash[*comments[id].map do |c|
                                      [name_to_token[c[:user].real_login], c[:comment].news]
                                    end.flatten]
                           [id, c]
                         end.flatten]

          return helper.json_response(content)
        end

      rescue ::Comment::NotFound
        return helper.bad_request
      rescue ::Comment::PermissionDenied
        return helper.bad_request
      rescue ::Comment::SizeLimitExceeded
        return helper.bad_request('size limit exceeded')
      rescue ::Comment::MaxCommentsExceeded
        return helper.bad_request('max comments exceeded')
      rescue => e
        app.logger.error(e.to_s)
        return helper.internal_server_error([e.to_s, e.backtrace].join("\n"))
      end
    end

    # Returns a hash represents relation between login ids and names.
    # @param [Array<String>] logins an array of logins
    def user_names_from_logins(logins)
      ::User.all_users.inject(Hash.new) do |r, u|
        login = logins.find {|l| u.real_login == l}
        login.nil? ? r : r.merge({ login => u.name })
      end
    end
  end
end
