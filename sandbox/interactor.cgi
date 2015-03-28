#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'rack'
require_relative '../lib/sandbox/interactor'

Rack::Handler::CGI.run(Interactor.new)
