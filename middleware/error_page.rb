require_relative '../lib/app/logger_ext'

# Rack middleware to handle exception, which simply dismisses error details
# and inidicates that something go wrong.
class ErrorPage
  def initialize(app)
    @app = app
  end

  def call(env)
    res = @app.call(env)
  rescue => e
    logger = App::Logger.new
    logger.error("#{e}\n#{e.backtrace.join("\n")}")

    body = <<-EOH
    <html>
      <head><title>500 Internal Server Error</title></head>
      <body>
        <h1>Internal Server Error</h1>
        <p>Please contact a server administrator.</p>
      </body>
    </html>
    EOH
    [500, { 'Content-Type' => 'text/html' }, [body]]
  ensure
    res
  end
end
