#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'rack'
require_relative '../lib/api/user.rb'

Rack::Handler::CGI.run(API::User.new)
