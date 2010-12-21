#! /usr/bin/env ruby

# Usage: mater [year]
#   基本設定を取得
# Options:
#   year      年度を取得

KEY = []
OPTIONAL = {
  :year     => 'year',
}

$KCODE='UTF8'

$:.unshift('./lib')

require 'app'
app = App.new

master = app.file(:master)
entry = {}
keys = KEY.dup
OPTIONAL.each{|k,v| keys << k unless app.params[v].empty?}
keys.each{|k| entry[k.to_s] = master[k.to_s]}
result = entry

print(app.header)
puts(app.json(result))
