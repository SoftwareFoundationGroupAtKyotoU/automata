#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'rack'
require_relative '../../lib/api/test_result.rb'

Rack::Handler::CGI.run(API::TestResult.new)
