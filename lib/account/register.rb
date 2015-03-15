# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'mail'

require_relative '../app'
require_relative '../helper'
require_relative '../reset'
require_relative '../string/random'

module Account
  class AlreadyRegistered < Exception; end
  class InvalidArguments < Exception; end

  URL = '../account/register.html'

  class Register
    def call(env)
      helper = Helper.new(env)
      app = App.new(env['REMOTE_USER'])

      def app.su?
        true
      end

      begin
        email = helper.params['email']
        name  = helper.params['name']
        ruby  = helper.params['ruby']
        login = helper.params['login']

        # Validates arguments.
        if email.nil? || name.nil? || ruby.nil? || login.nil?
          fail InvalidArguments
        end
        login = login.to_s
        fail InvalidArguments if login !~ /[0-9]{10}/

        # Checks whether the email address or the login are already used or not.
        if app.users.any? { |u| u.email == email || u.real_login == login }
          fail AlreadyRegistered
        end

        app.add_user(
          'name'  => name,
          'ruby'  => ruby,
          'login' => login,
          'email' => email
        )

        app.reset(email, :passwd_issue)

        return helper.redirect(URL + '#done')
      rescue AlreadyRegistered
        return helper.redirect(URL + '#alreadyregistered')
      rescue InvalidArguments
        return helper.redirect(URL + '#invalidarguments')
      rescue => e
        app.logger.error(e.to_s)
        app.logger.error(e.backtrace)
        return helper.redirect(URL + '#failed')
      end
    end
  end
end
