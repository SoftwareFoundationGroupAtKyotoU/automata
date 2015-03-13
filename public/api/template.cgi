#! /usr/bin/env ruby
# -*- coding: utf-8 -*-

require 'rack'
require '../../lib/api/template'

Rack::Handler::CGI.run(API::Template.new)
