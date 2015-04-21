# -*- coding: utf-8 -*-

require 'bundler/setup'

require_relative 'user'
require_relative 'conf'
require_relative 'mailer'
require_relative 'string/random'

class App

  class UserNotFound < Exception; end

  # Issue a new password.
  # @param [String] email email address of a user
  # @param [Symbol] tmpl template used in mail body (:passwd_issue or :passwd_reset)
  def self.reset(email, tmpl)
    user = User.all_users.find {|u| u.email == email}
    raise UserNotFound unless user

    passwd = String.random(8)
    User.modify(user, 'passwd' => passwd)
    data = {
      name: user.name,
      passwd: passwd
    }

    conf = Conf.new

    subject = conf[:template, tmpl, :subject].gsub(/%\{([a-z]+)\}/) { data[$1.to_sym] }
    body = conf[:template, tmpl, :body].gsub(/%\{([a-z]+)\}/) { data[$1.to_sym] }
    Mailer.send_mail(email, subject, body, conf)
  end
end
