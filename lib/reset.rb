# -*- coding: utf-8 -*-

require 'rubygems'
require 'bundler/setup'
require 'mail'
require 'webrick'

require_relative 'app'
require_relative 'cgi_helper'
require_relative 'string/random'

class App

  class UserNotFound < Exception; end

  include WEBrick

  # 新しくパスワードを発行する
  # @param [String] email
  # @param [Symbol] tmpl メール本文に使うテンプレート (:passwd_issue or :passwd_reset)
  def reset(email, tmpl)
    user = users.find {|u| u.email == email}
    raise UserNotFound unless user

    passwd = String.random(8)

    htdigest = conf[:master, :authn, :htdigest]
    realm = conf[:master, :authn, :realm]

    htd = HTTPAuth::Htdigest.new(htdigest)
    htd.set_passwd(realm, user.real_login, passwd)
    htd.flush

    data = {
      name: user.name,
      passwd: passwd
    }

    this = self
    Mail.deliver do
      from    this.conf[:master, :authn, :admin]
      to      email
      subject this.conf[:template, tmpl, :subject].gsub(/%\{([a-z]+)\}/) { data[$1.to_sym] }
      body    this.conf[:template, tmpl, :body].gsub(/%\{([a-z]+)\}/) { data[$1.to_sym] }
    end
  end
end
