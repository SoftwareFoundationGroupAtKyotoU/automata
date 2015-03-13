#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'rack'
require_relative '../../lib/api/scheme'

Rack::Handler::CGI.run(API::Scheme.new)
