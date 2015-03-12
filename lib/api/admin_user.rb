# -*- coding: utf-8 -*-

require_relative '../app'
require_relative '../cgi_helper'

module API
  class AdminUser
    # Usage: admin_user method=<method> <arguments>
    #   ユーザ情報を編集
    #   method:
    #     delete: ユーザを削除
    #       arguments:
    #         user: ユーザトークン名
    # Security:
    #   master.su に入っているユーザのみ実行可能
    def call(env)
      helper = CGIHelper.new
      app = App.new(helper.cgi.remote_user)

      return helper.forbidden unless app.su?

      method = helper.params['method'] || ''
      case method.intern
      when :delete
        token = helper.params['user'] || ''
        remove_user = app.user_from_token(helper.params['user'])
        unless remove_user
          return helper.bad_request("Unknown user token: #{token}")
        end
        app.delete_user(remove_user)
      else
        return helper.bad_request("Unknown method: #{method}")
      end

      helper.ok('done')
    end
  end
end
