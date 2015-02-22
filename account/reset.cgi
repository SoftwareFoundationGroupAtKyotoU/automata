#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'mail'

require_relative '../lib/app'
require_relative '../lib/cgi_helper'
require_relative '../lib/string/random'
require_relative '../lib/reset'

helper = CGIHelper.new
app = App.new(helper.cgi.remote_user)
def app.su?() return true end

begin
  email = helper.param(:email)
  app.reset(email, :passwd_reset)

  print helper.cgi.header('status' => '303 See Other', 'Location' => '../account/reset.html#done')
rescue App::UserNotFound
  print helper.cgi.header('status' => '303 See Other', 'Location' => '../account/reset.html#notfound')
end
