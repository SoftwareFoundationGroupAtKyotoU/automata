#! /usr/bin/env ruby
# -*- coding: utf-8 -*-
$KCODE = 'UTF8' if RUBY_VERSION < "1.9"

require 'rubygems'
require 'bundler/setup'
require 'mail'
require 'webrick'

require_relative '../lib/app'
require_relative '../lib/cgi_helper'
require_relative '../lib/reset'
require_relative '../lib/string/random'

helper = CGIHelper.new
app = App.new(helper.cgi.remote_user)
def app.su?() return true end

class AlreadyRegistered < Exception; end
class InvalidArguments < Exception; end

URL = '../account/register.html'

begin
  email = helper.param(:email)
  name = helper.param(:name)
  ruby = helper.param(:ruby)
  login = helper.param(:login).to_s

  # Validates arguments.
  if email.empty? || name.empty? || ruby.empty? || login !~ /[0-9]{10}/ then
    raise InvalidArguments
  end

  # Checks whether the email address or the login are already used or not.
  found = app.users.any? {|u| u.email == email || u.real_login == login}
  raise AlreadyRegistered if found

  app.add_user(name, ruby, login, email)

  app.reset(email, :passwd_issue)

  helper.exit_with_redirect(URL + '#done')
rescue AlreadyRegistered
  helper.exit_with_redirect(URL + '#alreadyregistered')
rescue InvalidArguments
  helper.exit_with_redirect(URL + '#invalidarguments')
rescue => e
  helper.exit_with_redirect(URL + '#failed')
end
