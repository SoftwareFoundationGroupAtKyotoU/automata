#! /usr/bin/env ruby

# Usage: master [year] [user]
#   基本設定を取得
# Options:
#   user      ログインユーザ名を取得
#   year      年度を取得

KEY = []
OPTIONAL = [ :year, :user, ]

$KCODE='UTF8'

$:.unshift('./lib')

require 'app'
app = App.new

app.conf[:user] = app.user
entry = {}
keys = KEY.dup
OPTIONAL.each{|k| keys << k unless app.params[k.to_s].empty?}
keys.each{|k| entry[k.to_s] = app.conf[k]}
result = entry

print(app.header)
puts(app.json(result))
