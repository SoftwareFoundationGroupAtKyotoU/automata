#! /usr/bin/env ruby

# Usage: master [year] [user]
#   基本設定を取得
# Options:
#   user      ログインユーザ名を取得
#   token     レコードの所有ユーザ名を隠す設定の際に使用されるユーザ識別子
#   year      年度を取得

KEY = []
OPTIONAL = [ :year, :user, :token ]

$KCODE='UTF8'

$:.unshift('./lib')

require 'app'
require 'user'
app = App.new

app.conf[:user] = app.user
app.conf[:token] = User.make_token(app.user)
entry = {}
keys = KEY.dup
OPTIONAL.each{|k| keys << k unless app.params[k.to_s].empty?}
keys.each{|k| entry[k.to_s] = app.conf[k]}
result = entry

print(app.header)
puts(app.json(result))
