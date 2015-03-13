# -*- coding: utf-8 -*-

require 'shellwords'
require_relative '../app'
require_relative '../helper'

module API
  # Usage: admin_runtest report=<report-id> user=<login>
  #   自動テストを再実行
  # Options:
  #   report            課題ID
  #   user              ログイン名が<login>のユーザの情報のみ取得
  # Security:
  #   master.su に入っているユーザのみ実行可能
  class AdminRuntest
    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])

      # reject request by normal users
      return helper.forbidden unless app.su?

      # user must be specified
      user = helper.params['user']
      return helper.bad_request unless user

      # resolve real login name in case user id is a token
      user = app.user_from_token(user)
      return helper.bad_request unless user

      # report ID must be specified
      report_id = helper.param['report']
      return helper.bad_request unless report_id

      cmd =
        [ App::FILES[:test_script],
          Shellwords.escape(report_id),
          Shellwords.escape(user)
        ].join(' ')
      system(cmd)

      helper.ok('done')
    end
  end
end
