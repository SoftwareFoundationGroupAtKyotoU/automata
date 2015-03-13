#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'rack'
require '../../lib/api/template'

Rack::Handler::CGI.run(API::Template.new)
