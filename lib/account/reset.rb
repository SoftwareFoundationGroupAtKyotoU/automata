# -*- coding: utf-8 -*-

require 'bundler/setup'

require_relative '../app'
require_relative '../helper'
require_relative '../reset'
require_relative '../string/random'

module Account
  class Reset
    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])

      begin
        email = helper.params['email']
        app.reset(email, :passwd_reset)

        return helper.redirect('../account/reset.html#done')
      rescue App::UserNotFound
        return helper.redirect('../account/reset.html#notfound')
      end
    end
  end
end
