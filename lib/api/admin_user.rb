# -*- coding: utf-8 -*-

require_relative '../app'
require_relative '../helper'

module API
  class AdminUser
    # Usage: admin_user method=<method> user=<user> {arguments}
    #   ユーザ情報を編集
    #   method:
    #     modify: ユーザ情報を編集
    #         name: 新しい名前 (option)
    #         ruby: 新しいふりがな (option)
    #         email: 新しいメールアドレス (option)
    #         assigned: 新しい担当TA (option)
    #     delete: ユーザを削除
    # Security:
    #   master.su に入っているユーザのみ実行可能
    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])

      return helper.forbidden unless app.su?

      token = helper.params['user'] || ''
      user = app.user_from_token(token)
      return helper.bad_request("Unknown user: #{token}") if user.nil?

      method = helper.params['method'] || ''
      case method.intern
      when :modify
        info = ['name', 'ruby', 'email', 'assigned'].inject({}) {|h, k|
          h[k] = helper.params[k]
          h
        }
        app.modify_user(user, info)
      when :delete
        app.delete_user(user)
      else
        return helper.bad_request("Unknown method: #{method}")
      end

      helper.ok('done')
    end
  end
end
