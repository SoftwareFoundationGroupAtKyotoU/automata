#! /usr/bin/env ruby

# Usage: scheme [type=<type>] [id=<id>] [field] [exercise]
#   scheme.ymlのデータを取得
# Options:
#   type      typeプロパティが<type>のものだけ取得
#   report    idプロパティが<id>のものだけ取得
#   field     レコード表示用のフィールド情報を取得
#   exercise  個別の問題の定義を取得

$KCODE='UTF8'

$:.unshift('./lib')

require 'app'
app = App.new

result = []
scheme = app.file(:scheme)
scheme['scheme'].each do |report|
  report['exercise'] = scheme['report'][report['id']]
  if [ :type, :id ].all?{|k| app.optional(k).include?(report[k.to_s])}
    entry = {}
    keys = [ :id, :type, :name ]
    keys << :data unless app.params['field'].empty?
    keys << :exercise unless app.params['exercise'].empty?
    keys.each{|k| entry[k.to_s] = report[k.to_s]}
    result << entry
  end
end

print(app.header)
puts(app.json(result))
