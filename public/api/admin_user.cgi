#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'rack'
require_relative '../lib/api/admin_user.rb'

Rack::Handler::CGI.run(API::AdminUser.new)
