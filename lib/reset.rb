# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'mail'

require_relative 'app'
require_relative 'helper'
require_relative 'string/random'

class App

  class UserNotFound < Exception; end

  # Issue a new password.
  # @param [String] email email address of a user
  # @param [Symbol] tmpl template used in mail body (:passwd_issue or :passwd_reset)
  def reset(email, tmpl)
    user = users(true).find {|u| u.email == email}
    raise UserNotFound unless user

    passwd = String.random(8)
    set_passwd(user.real_login, passwd)
    data = {
      name: user.name,
      passwd: passwd
    }

    this = self

    mail = Mail.new do
      from    this.conf[:master, :authn, :admin]
      to      email
      subject this.conf[:template, tmpl, :subject].gsub(/%\{([a-z]+)\}/) { data[$1.to_sym] }
      body    this.conf[:template, tmpl, :body].gsub(/%\{([a-z]+)\}/) { data[$1.to_sym] }
    end

    mail.charset = 'utf-8'
    mail_config = Conf.new[:master, :mail] || {}
    mail_options = Hash[mail_config.map{|k, v| [k.to_sym, v] } ]
    mail.delivery_method(:smtp, mail_options)
    mail.deliver
  end
end
