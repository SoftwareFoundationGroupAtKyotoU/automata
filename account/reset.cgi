#! /usr/bin/env ruby
# -*- coding: utf-8 -*-
$KCODE = 'UTF8' if RUBY_VERSION < "1.9"

$:.unshift('./lib')

require 'rubygems'
require 'bundler/setup'
require 'mail'
require 'webrick'

require 'app'
require 'cgi_helper'
require 'string/random'

require 'reset'

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
