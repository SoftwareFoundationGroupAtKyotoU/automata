
require_relative 'lib/conf'
require 'rack/auth/digest/md5'
require 'digest/md5'
require 'webrick'

# Rack middleware to authenticate users
class Authenticator
  def initialize(app)
    @app = app
    @conf = Conf.new
  end

  def auth(env)
    md5 = nil
    if env['PATH_INFO'] =~ /^\/account/ && @conf[:master, :authn_account]
      md5 = Rack::Auth::Digest::MD5.new(
        @app,
        realm: @conf[:master, :authn_account, :realm],
        opaque: '',
        passwords_hashed: true
      ) do |_|
        # Load authenticate information from master.yml directory instead using
        # WEBrick::HTTPAuth::Htdigest.
        Digest::MD5.hexdigest([
          @conf[:master, :authn_account, :user],
          @conf[:master, :authn_account, :realm],
          @conf[:master, :authn_account, :passwd]
        ].join(':'))
      end
    elsif env['PATH_INFO'] =~ /^\/(admin|api|browse|post|record|download)/
      md5 = Rack::Auth::Digest::MD5.new(
        @app,
        realm: @conf[:master, :authn, :realm],
        opaque: '',
        passwords_hashed: true
      ) do |username|
        htdigest_path = @conf[:master, :authn, :htdigest]
        htdigest = WEBrick::HTTPAuth::Htdigest.new(htdigest_path)
        htdigest.get_passwd(@conf[:master, :authn, :realm], username, true)
      end
    end
    md5
  end

  def call(env)
    md5 = auth(env)

    if md5
      res = md5.call(env)
      res[2] = [<<-EOH
        <html>
          <head><title>401 Unauthorized</title></head>
          <body>
            <h1>Unauthorized</h1><p>username or password is wrong.</p>
          </body>
        </html>
        EOH
      ]
      res[1]['Content-Length'] = res[2][0].length.to_s
      res[1]['Content-Type'] = 'text/html'
      return res
    end
    @app.call(env)
  end
end
