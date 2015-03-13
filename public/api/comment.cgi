#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'rack'
require_relative '../../lib/api/comment.rb'

Rack::Handler::CGI.run(API::Comment.new)
