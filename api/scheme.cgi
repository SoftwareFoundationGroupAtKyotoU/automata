#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

# Usage: scheme [type=<type>] [id=<id>] [record] [exercise]
#   scheme.ymlのデータを取得
# Options:
#   type          typeプロパティが<type>のものだけ取得
#   id            idプロパティが<id>のものだけ取得
#   record        レコード表示用のフィールド情報を取得
#   exercise      個別の問題の定義を取得

KEY = [ :id, :type, :name, :update ]
OPTIONAL = [ :record, :exercise ]
FILTER = [ :id, :type, ]

$KCODE='UTF8' if RUBY_VERSION < '1.9.0'

$:.unshift('./lib')

require 'app'
require 'cgi_helper'
require 'report/exercise'

helper = CGIHelper.new
app = App.new

result = []
scheme = app.file(:scheme)
scheme['scheme'].reject do |report|
  !helper.optional(:id).include?(report['id'])
end.each do |report|
  exes = []
  unless helper.params['exercise'].empty?
    scheme['report'][report['id']].sort do |a,b|
      a[0].to_ex <=> b[0].to_ex
    end.each do |k, v|
      parent = exes.find{|ex,opt| ex.to_ex.match(k.to_ex)}
      if parent
        parent[1] = {} unless parent[1]
        parent[1]['sub'] = [] unless parent[1]['sub']
        parent[1]['sub'] << [ k, v ]
      else
        exes << [ k, v ]
      end
    end
  end

  report['exercise'] = exes
  if FILTER.all?{|k| helper.optional(k).include?(report[k.to_s])}
    entry = {}
    keys = KEY.dup
    OPTIONAL.each{|k| keys << k unless helper.params[k.to_s].empty?}
    keys.each{|k| entry[k.to_s] = report[k.to_s]}
    result << entry
  end
end

print(helper.header)
puts(helper.json(result))
