#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'rack'
require_relative '../lib/api/admin_solved.rb'

Rack::Handler::CGI.run(API::AdminSolved.new)
