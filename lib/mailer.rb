# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'mail'

require_relative 'conf'

module Mailer
  def self.send_mail(to, subject, body, conf = nil)
    conf = Conf.new unless conf
    mail = Mail.new do
      from    conf[:master, :authn, :admin]
      to      to
      subject subject
      body    body
    end
    mail.charset = 'utf-8'
    mail_config = conf[:master, :mail] || {}
    mail_options = Hash[mail_config.map {|k, v| [k.to_sym, v] }]
    mail.delivery_method(:smtp, mail_options)
    mail.deliver
  end
end
