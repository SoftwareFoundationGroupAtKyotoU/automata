#! /usr/bin/env ruby

# Usage: scheme [type=<type>] [id=<id>] [record] [exercise]
#   scheme.ymlのデータを取得
# Options:
#   type          typeプロパティが<type>のものだけ取得
#   report        idプロパティが<id>のものだけ取得
#   record        レコード表示用のフィールド情報を取得
#   requirements  課題提出の要件情報を取得
#   exercise      個別の問題の定義を取得

KEY = [ :id, :type, :name, ]
OPTIONAL = [ :record, :exercise ]
FILTER = [ :id, :type, ]

$KCODE='UTF8'

$:.unshift('./lib')

require 'app'
require 'report/exercise'
app = App.new

result = []
scheme = app.file(:scheme)
scheme['scheme'].each do |report|
  exes = scheme['report'][report['id']].sort{|a,b| a[0].to_ex <=> b[0].to_ex}
  report['exercise'] = exes
  if FILTER.all?{|k| app.optional(k).include?(report[k.to_s])}
    entry = {}
    keys = KEY.dup
    OPTIONAL.each{|k| keys << k unless app.params[k.to_s].empty?}
    keys.each{|k| entry[k.to_s] = report[k.to_s]}
    result << entry
  end
end

print(app.header)
puts(app.json(result))
