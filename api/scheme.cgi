#! /usr/bin/env ruby

# Usage: scheme [type=<type>] [id=<id>] [field] [exercise]
#   scheme.ymlのデータを取得
# Options:
#   type      typeプロパティが<type>のものだけ取得
#   report    idプロパティが<id>のものだけ取得
#   field     レコード表示用のフィールド情報を取得
#   exercise  個別の問題の定義を取得

KEY = [ :id, :type, :name, ]
OPTIONAL = {
  :data     => 'field',
  :exercise => 'exercise',
}
FILTER = [ :id, :type, ]

$KCODE='UTF8'

$:.unshift('./lib')

require 'app'
app = App.new

result = []
scheme = app.file(:scheme)
scheme['scheme'].each do |report|
  report['exercise'] = scheme['report'][report['id']]
  if FILTER.all?{|k| app.optional(k).include?(report[k.to_s])}
    entry = {}
    keys = KEY.dup
    OPTIONAL.each{|k,v| keys << k unless app.params[v].empty?}
    keys.each{|k| entry[k.to_s] = report[k.to_s]}
    result << entry
  end
end

print(app.header)
puts(app.json(result))
