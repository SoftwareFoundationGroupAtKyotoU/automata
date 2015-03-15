# -*- coding: utf-8 -*-

require_relative '../app'
require_relative '../helper'

module API
  # Usage: template [type=<type>] [links] [requirements]
  #   template.ymlのデータを取得
  # Options:
  #   type          post | record
  #   links         リンクの情報を取得
  #   requirements  課題提出の要件情報を取得
  class Template
    KEY = [:institute, :title, :subtitle]
    OPTIONAL = [:links, :requirements]

    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])

      temp = app.conf[:template]

      type = helper.params['type']
      temp = temp.merge(temp[type] || {}) unless type.nil?

      result = {}
      keys = KEY.dup
      OPTIONAL.each do |k|
        keys << k unless helper.params[k.to_s].nil?
      end
      keys.each { |k| result[k.to_s] = temp[k.to_s] }
      helper.json_response(result)
    end
  end
end
