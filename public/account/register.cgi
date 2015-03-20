#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'rack'
require_relative '../../lib/account/register'

Rack::Handler::CGI.run(
  Rack::Session::Cookie.new(
    Account::Register.new,
    secret: 'account-secret-key',
    old_secret: 'account-secret-key-old'
  )
)
