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

$KCODE='UTF8' if RUBY_VERSION < '1.9.0'

$:.unshift('./lib')

require 'app'
require 'user'
app = App.new

app.conf[:user] = app.user
app.conf[:admin] = app.su?
app.conf[:token] = User.make_token(app.user)

entry = {}
keys = KEY.dup
OPTIONAL.each{|k| keys << k unless app.params[k.to_s].empty?}
keys.each{|k| entry[k.to_s] = app.conf[k]}
result = entry

print(app.header)
puts(app.json(result))
