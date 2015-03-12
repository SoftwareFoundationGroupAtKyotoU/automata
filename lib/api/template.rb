# -*- coding: utf-8 -*-

# Usage: template [type=<type>] [links] [requirements]
#   template.ymlのデータを取得
# Options:
#   type          post | record
#   links         リンクの情報を取得
#   requirements  課題提出の要件情報を取得

require_relative '../app'
require_relative '../helper'

module API
  class Template
    KEY = [ :institute, :title, :subtitle, ]
    OPTIONAL = [ :links, :requirements, ]

    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])

      temp = app.conf[:template]

      type = helper.params[:type.to_s]
      temp = temp.merge(temp[type[0]]||{}) unless type.empty?

      result = {}
      keys = KEY.dup
      OPTIONAL.each do |k|
        unless helper.params[k.to_s].nil?
          keys << k
        end
      end
      keys.each {|k| result[k.to_s] = temp[k.to_s] }
      helper.json_response(result)
    end
  end
end
