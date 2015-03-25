# -*- coding: utf-8 -*-

require_relative '../app'
require_relative '../helper'
require_relative '../user'

module API
  # Usage: master [year] [user]
  #   基本設定を取得
  # Options:
  #   user       ログインユーザ名を取得
  #   admin      ログインユーザが管理者かどうか
  #   token      レコードの所有ユーザ名を隠す設定の際に使用されるユーザ識別子
  #   year       年度を取得
  #   all_admins 全ての管理者ユーザーを取得
  #   reload     リロード時間を取得
  #   time       サーバーの現在時刻を取得
  class Master
    KEY = []
    OPTIONAL = [:year, :user, :admin, :token, :all_admins, :reload, :time]

    def call(env)
      helper = ::Helper.new(env)
      app = ::App.new(env['REMOTE_USER'])

      conf = app.conf[:master]
      conf[:user] = env['REMOTE_USER']
      conf[:admin] = app.su?
      conf[:token] = ::User.make_token(app.user)
      conf[:all_admins] = conf['su']
      conf[:reload] = app.conf[:master, :record, :reload] || 0
      conf[:time] = (Time.now.to_f * 1000).to_i

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
