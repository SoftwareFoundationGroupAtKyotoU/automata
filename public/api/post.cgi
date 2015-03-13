#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'rack'
require_relative '../lib/api/post'

Rack::Handler::CGI.run(API::Post.new)
