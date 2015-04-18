# -*- coding: utf-8 -*-

require_relative '../syspath'
require_relative '../app'
require_relative '../log'
require_relative '../helper'

module API
  # Usage: test_result report=<report-id> user=<login>
  #   自動テストの結果を取得
  # Options:
  #   report            取得するファイルの属する課題ID
  #   user              ログイン名が<login>のユーザの情報のみ取得
  # Security:
  #   master.su に入っていないユーザに関しては user オプションによらず
  #   ログイン名が remote_user の情報のみ取得可能
  class TestResult
    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])

      user = helper.params['user']
      return helper.json_response({}) unless user

      # resolve real login name in case user id is a token
      user = app.users.inject(nil) do |r, u|
        (u.token == user || u.real_login == user) ? u.real_login : r
      end
      return helper.json_response({}) unless user

      report_id = helper.params['report']
      return helper.json_response({}) unless report_id

      log_file = SysPath::user_log(report_id, user)
      return helper.json_response({}) unless log_file.exist?

      log = Log.new(log_file, true).latest(:data)
      result = {}

      if log['log'] && log['log']['test']
        t = log['log']['test']
        result['passed'] = t['passed']
        result['number'] = t['number']
      end

      if log['test'] && (app.conf[:master, :record, :detail] || app.su?)
        detail = log['test']

        if app.conf[:master, :record, :detail] == 'brief' && !app.su?
          detail.map! { |x| { 'name' => x['name'], 'result' => x['result'] } }
        end

        result['detail'] = detail
      end

      helper.json_response(result)
    end
  end
end
