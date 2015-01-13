#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

# Usage: master [year] [user]
#   基本設定を取得
# Options:
#   user      ログインユーザ名を取得
#   admin     ログインユーザが管理者かどうか
#   token     レコードの所有ユーザ名を隠す設定の際に使用されるユーザ識別子
#   year      年度を取得

KEY = []
OPTIONAL = [ :year, :user, :admin, :token ]

require_relative '../lib/app'
require_relative '../lib/user'
require_relative '../lib/cgi_helper'

helper = CGIHelper.new
app = App.new(helper.cgi.remote_user)

app.conf[:user] = helper.cgi.remote_user
app.conf[:admin] = app.su?
app.conf[:token] = User.make_token(app.user)

entry = {}
keys = KEY.dup
OPTIONAL.each{|k| keys << k unless helper.params[k.to_s].empty?}
keys.each{|k| entry[k.to_s] = app.conf[k]}
result = entry

print(helper.header)
puts(helper.json(result))
