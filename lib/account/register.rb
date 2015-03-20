# -*- coding: utf-8 -*-

require 'bundler/setup'
require 'haml'
require 'mail'
require 'securerandom'

require_relative '../app'
require_relative '../helper'
require_relative '../reset'
require_relative '../string/random'

module Account
  class AlreadyRegistered < Exception; end
  class InvalidArguments < Exception; end

  class Register
    def page(msg = '')
      <<-EOH
!!! 5
%html
  %head
    %title= Account
    %meta{charset: "UTF-8"}
    %link{rel:  "stylesheet",
          type: "text/css",
          href: "../css/default.css"}
  %body
    = yield
    %div{id: "msg"} #{msg}
    %div{id: "footer"}
      %a{href: "../"} 提出システム トップページ
      %a{href: "./"} 戻る
      EOH
    end

    def form_email
      <<-EOH
%div
  以下のフォームにメールアドレスを入力してください．
%form{method: "POST", action: "register.cgi"}
  %fieldset
    %legend メールアドレス
    %input{type: "email", name: "email", placeholder: "hoge@example.com",
           required: true}
    %br
    %input{type: "submit"}
      EOH
    end

    def form_token
      <<-EOH
%div
  メールに記載のトークンを以下に入力してください．
%form{method: "POST", action: "register.cgi"}
  %fieldset
    %legend トークン
    %input{type: "text", name: "token", required: true}
    %br
    %input{type: "submit"}
      EOH
    end

    def form_signup(email)
      <<-EOH
%div
  ユーザ情報を入力してください．
%form{method: "POST", action: "register.cgi"}
  %fieldset
    %legend 新規登録
    %input{type: "text", name: "name", placeholder: "名前", required: true}
    %br
    %input{type: "text", name: "ruby", placeholder: "ふりがな", required: true}
    %br
    %label
      %input{type: "text", name: "login", placeholder: "学籍番号",
             pattern: "^[0-9]{10}$", required: true}
      ※数字は半角、ハイフンなしの10桁
    %br
    %span email: #{email}
    %br
    %input{type: "submit"}
      EOH
    end

    def register_succeed
      <<-EOH
%div パスワードをメールで送信しました．
      EOH
    end

    def receive_email(env, email)
      if App.new.users(true).any? { |u| u.email == email }
        msg = '入力されたメールアドレスは既に登録されています．'
        return Haml::Engine.new(page(msg)).render do
          Haml::Engine.new(form_email).render
        end
      end

      token = SecureRandom.urlsafe_base64(10)
      env['rack.session']['token'] = token
      env['rack.session']['email'] = email

      mail = Mail.new do
        from    Conf.new[:master, :authn, :admin]
        to      email
        subject 'noreply'
        body    "ページに戻って，次のトークンを入力してください．\n\n#{token}"
      end
      mail.charset = 'utf-8'
      mail.deliver

      Haml::Engine.new(page).render do
        Haml::Engine.new(form_token).render
      end
    end

    def receive_token(env, email_s, token_u, token_s)
      if token_u == token_s
        return Haml::Engine.new(page).render do
          Haml::Engine.new(form_signup(email_s)).render
        end
      end
      Haml::Engine.new(page('トークンが違います．')).render do
        Haml::Engine.new(form_token).render
      end
    end

    def receive_user_info(env, email_s, name, ruby, login)
      begin
        register(email_s, name, ruby, login)
        return Haml::Engine.new(page).render do
          Haml::Engine.new(register_succeed).render
        end
      rescue InvalidArguments
        msg = '入力された値のどれかが空か，学籍番号が10桁の半角数字ではありません．'
      rescue AlreadyRegistered
        msg = '入力された学籍番号は既に登録されています．'
      rescue => e
        app.logger.error(e.to_s)
        e.backtrace.each { |m| app.logger.error(m) }
        msg = 'エラーが発生しました．管理者に連絡してください．'
      end
      Haml::Engine.new(page(msg)).render do
        Haml::Engine.new(form_signup(email_s)).render
      end
    end

    def call(env)
      helper = Helper.new(env)

      email = helper.params['email']
      email_s = env['rack.session']['email']
      name  = helper.params['name']
      ruby  = helper.params['ruby']
      login = helper.params['login']
      token_u = helper.params['token']
      token_s = env['rack.session']['token']

      if token_u && token_s
        return helper.ok(receive_token(env, email_s, token_u, token_s))
      end

      return helper.ok(receive_email(env, email)) if email

      if email_s && name && ruby && login
        return helper.ok(receive_user_info(env, email_s, name, ruby, login))
      end

      html = Haml::Engine.new(page).render do
        Haml::Engine.new(form_email).render
      end
      helper.ok(html)
    end

    def register(email, name, ruby, login)
      app = App.new
      def app.su?
        true
      end
      login = login.to_s
      fail InvalidArguments if login !~ /[0-9]{10}/
      # Checks whether the email address or the login are already used or not.
      if app.users(true).any? { |u| u.email == email || u.real_login == login }
        fail AlreadyRegistered
      end

      app.add_user(
        'name'  => name,
        'ruby'  => ruby,
        'login' => login,
        'email' => email
      )
      app.reset(email, :passwd_issue)
    end
  end
end
