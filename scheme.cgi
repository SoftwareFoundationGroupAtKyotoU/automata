#! /usr/bin/env ruby
$KCODE='UTF8'

require 'rubygems'
require 'json'
require 'cgi'
require 'yaml'
require 'time'
cgi = CGI.new

files = {
  :master => './config/config.yml',
  :local  => './config/local.yml',
  :scheme => './config/scheme.yml',
}

cb = (cgi.params['callback'][0] || '').strip
cb = nil if cb.length == 0 && cb !~ /^\$?[a-zA-Z0-9\.\_\[\]]+$/

unless cb
  print("Content-Type: application/json; charset=utf-8\r\n\r\n")
else
  # JSONP
  print("Content-Type: text/javascript; charset=utf-8\r\n\r\n")
end

yml = {}
yml[:config] = YAML.load_file(files[:master])
yml[:local] = YAML.load_file(files[:local]) rescue {}
yml[:scheme] = YAML.load_file(files[:scheme])
yml[:scheme]['year'] = yml[:config]['year']
yml[:scheme]['user'] = cgi.remote_user || yml[:local]['user']

json = yml[:scheme].to_json
json = "#{cb}(#{json});" if cb

puts(json)
