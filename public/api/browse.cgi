#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'rack'
require_relative '../../lib/api/browse'

Rack::Handler::CGI.run(API::Browse.new)
