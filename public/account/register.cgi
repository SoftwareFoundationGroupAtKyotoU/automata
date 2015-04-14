#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'rack'
require_relative '../../lib/account/register'
require_relative '../../lib/conf'

conf = Conf.new

Rack::Handler::CGI.run(
  Rack::Session::Cookie.new(
    Account::Register.new,
    secret: conf[:master, :cookie_key, :secret],
    old_secret: conf[:master, :cookie_key, :old_secret],
    expire_after: 600 # 10 minutes
  )
)
