#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'rack'
require_relative '../../lib/api/diff'

Rack::Handler::CGI.run(API::Diff.new)
