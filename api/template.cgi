#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

# Usage: template [type=<type>] [links] [requirements]
#   template.ymlのデータを取得
# Options:
#   type          post | record
#   links         リンクの情報を取得
#   requirements  課題提出の要件情報を取得

KEY = [ :institute, :title, :subtitle, ]
OPTIONAL = [ :links, :requirements, ]

require_relative '../lib/app'
require_relative '../lib/cgi_helper'

helper = CGIHelper.new
app = App.new

temp = app.conf[:template]

type = helper.params[:type.to_s]
temp = temp.merge(temp[type[0]]||{}) unless type.empty?

result = {}
keys = KEY.dup
OPTIONAL.each{|k| keys << k unless helper.params[k.to_s].empty?}
keys.each{|k| result[k.to_s] = temp[k.to_s]}

print(helper.header)
puts(helper.json(result))
