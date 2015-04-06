# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'mail'

require_relative 'conf'

module Mailer
  # Send a mail.
  # @param String to a recipient of the mail
  # @param String subject a subject of the mail
  # @param String body a body of the mail
  # @param Conf conf a configuration of app. if not passed,
  #        this method loads a configuration from the config files.
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
