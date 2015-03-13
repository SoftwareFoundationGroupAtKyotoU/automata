#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'rack'
require_relative '../../lib/api/admin_runtest.rb'

Rack::Handler::CGI.run(API::AdminRuntest.new)
