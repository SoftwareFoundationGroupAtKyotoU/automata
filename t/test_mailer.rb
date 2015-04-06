require 'test/unit'
require 'rr'

require 'mailer'

module Mail
  class Message
    def deliver
      inform_interceptors
      inform_observers
      self
    end
  end
end

class MailerTest < Test::Unit::TestCase
  def test_send_mail_with_mail_settings
    conf = Conf.allocate
    stub(conf).[](:master, :authn, :admin) { 'admin@example.com' }
    stub(conf).[](:master, :mail) {
      { "address" => "smtp.example.com",
        "port" => 587,
        "domain" => "example.com",
        "authentication" => "plain",
        "user_name" => "username",
        "password" => "password" }
    }
    mail = Mailer.send_mail('to@example.com', 'subject!', 'body!', conf)
    assert_equal(['admin@example.com'], mail.from)
    assert_equal(['to@example.com'], mail.to)
    assert_equal('subject!', mail.subject)
    assert_equal('body!', mail.body.decoded)
  end

  def test_send_mail_without_mail_settings
    conf = Conf.allocate
    stub(conf).[](:master, :authn, :admin) { 'admin@example.com' }
    stub(conf).[](:master, :mail) { nil }
    mail = Mailer.send_mail('to@example.com', 'subject!', 'body!', conf)
    assert_equal(['admin@example.com'], mail.from)
    assert_equal(['to@example.com'], mail.to)
    assert_equal('subject!', mail.subject)
    assert_equal('body!', mail.body.decoded)
  end
end
