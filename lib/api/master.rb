# -*- coding: utf-8 -*-

require_relative '../app'
require_relative '../helper'
require_relative '../user'

module API
  # Usage: master [year] [user]
  #   基本設定を取得
  # Options:
  #   user      ログインユーザ名を取得
  #   admin     ログインユーザが管理者かどうか
  #   token     レコードの所有ユーザ名を隠す設定の際に使用されるユーザ識別子
  #   year      年度を取得
  class Master
    KEY = []
    OPTIONAL = [:year, :user, :admin, :token]

    def call(env)
      helper = ::Helper.new(env)
      app = ::App.new(env['REMOTE_USER'])

      conf = app.conf[:master]
      conf[:user] = env['REMOTE_USER']
      conf[:admin] = app.su?
      conf[:token] = ::User.make_token(app.user)

      STDERR.print helper.params

      entry = {}
      keys = KEY.dup
      OPTIONAL.each do |k|
        keys << k unless helper.params[k.to_s].nil?
      end
      keys.each { |k| entry[k.to_s] = conf[k] }

      helper.json_response(entry)
    end
  end
end
