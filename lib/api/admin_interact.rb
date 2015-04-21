# -*- coding: utf-8 -*-

require 'open3'
require 'shellwords'
require_relative '../syspath'
require_relative '../app'
require_relative '../user'
require_relative '../helper'

module API
  # Usage: admin_interact report=<report-id> user=<login>
  #   Sandboxとの対話
  # Options:
  #   input  対話環境への入力
  # Security:
  #   master.su に入っているユーザのみ実行可能
  class AdminInteract
    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])

      # reject request by normal users
      return helper.forbidden unless app.su?

      # user must be specified
      user = helper.params['user']
      return helper.bad_request unless user

      # resolve real login name in case user id is a token

      user = ::User.from_token_or_login(user)
      return helper.bad_request unless user

      # report ID must be specified
      report_id = helper.params['report']
      return helper.bad_request unless report_id

      # reject if report hasn't been submitted
      log = Log.new(SysPath.user_log(report_id, user), true).latest(:data)
      return helper.bad_request if log.empty?

      input = helper.params['input']
      input = '' if input.nil?

      cmd =
        [ SysPath::FILES[:interact_script],
          Shellwords.escape(report_id),
          Shellwords.escape(user.login)
        ].join(' ')

      output, res = Open3.capture2(cmd, :stdin_data => input)

      helper.ok(output)
    end
  end
end
