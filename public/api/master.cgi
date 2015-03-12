#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'rack'
require_relative '../lib/api/master'

Rack::Handler::CGI.run(API::Master.new)
