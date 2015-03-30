#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'rack'
require_relative '../lib/sandbox/tester'

Rack::Handler::CGI.run(Sandbox::Tester.new)
