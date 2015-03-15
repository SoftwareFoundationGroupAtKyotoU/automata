#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'rack'
require_relative '../../lib/account/reset'

Rack::Handler::CGI.run(Account::Reset.new)
