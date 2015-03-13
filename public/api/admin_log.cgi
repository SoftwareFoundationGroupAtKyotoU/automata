#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'rack'
require_relative '../lib/api/admin_log.rb'

Rack::Handler::CGI.run(API::AdminLog.new)
