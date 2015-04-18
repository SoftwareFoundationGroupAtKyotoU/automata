# -*- coding: utf-8 -*-

require_relative '../syspath'
require_relative '../app'
require_relative '../log'
require_relative '../helper'

module API
  # Usage: admin_log report=<report-id> user=<login> id=<log-id>
  #   ログを変更
  # Options:
  #   status   ステータスを変更
  #   message  メッセージを変更
  #   error    エラーメッセージを変更
  #   reason   エラーの詳細を変更
  # Security:
  #   master.su に入っているユーザのみ実行可能
  class AdminLog
    LOGKEYS = %w(message error reason)

    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])

      # reject request by normal users
      return helper.forbidden('forbidden') unless app.su?

      # user must be specified
      user = helper.params['user']
      return helper.bad_request unless user

      # resolve real login name in case user id is a token
      user = app.user_from_token(user)
      return helper.bad_request unless user

      # report ID must be specified
      report_id = helper.params['report']
      return helper.bad_request unless report_id

      # log ID must be specified
      log_id = helper.params['id']
      return helper.bad_request unless log_id

      begin
        data = {}
        st = helper.params['status']
        data['status'] = st if st

        data_log = {}
        LOGKEYS.each do |k|
          val = helper.params[k]
          data_log[k] = val if val
        end
        data['log'] = data_log unless data_log.empty?

        unless data.empty?
          log_file = SysPath::user_log(report_id, user)
          Log.new(log_file).transaction do |log|
            return helper.bad_request if log.latest(:data)['id'] != log_id
            log.update(:data, log_id, data)
          end
        end

        helper.ok('done')
      rescue => e
        app.logger.error(e.to_s)
        helper.internal_server_error
      end
    end
  end
end
