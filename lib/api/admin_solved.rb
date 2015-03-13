# -*- coding: utf-8 -*-

require_relative '../app'
require_relative '../log'
require_relative '../report/exercise'
require_relative '../helper'

module API
  # Usage: admin_solved report=<report-id> user=<login> exercise[]=<exercise-id>
  #   問いた問題を変更
  # Security:
  #   master.su に入っているユーザのみ実行可能
  class AdminSolved
    def call(env)
      helper = CGIHelper.new
      app = App.new(helper.cgi.remote_user)

      # reject request by normal users
      return helper.forbidden unless app.su?

      # user must be specified
      user = helper.params['user']
      return helper.bad_request unless user

      # resolve real login name in case user id is a token
      user = app.user_from_token(user)
      return helper.bad_request unless user

      # report ID must be specified
      report_id = helper.params['report']
      return helper.bad_request unless report_id

      # exercises must be specified
      exercises = helper.params['exercise']
      helper.exit_with_bad_request unless exercises

      # exercises must be an array
      unless exercises.is_a?(Array)
        return helper.bud_request(
            'exercise must be provided as exercise[]=<exercise-id>')
      end

      exercises.sort! { |a, b| a.to_ex <=> b.to_ex }

      begin
        log_file = App::KADAI + report_id + user + App::FILES[:log]
        Log.new(log_file).transaction do |log|
          log.latest(:data)['report'] = exercises
        end

        helper.ok('done')
      rescue => e
        app.logger.error(e.to_s)
        helper.exit_with_internal_server_error
      end
    end
  end
end
