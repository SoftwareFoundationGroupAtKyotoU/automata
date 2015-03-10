# coding: utf-8

if RUBY_VERSION >= '2.0.0'
  module LogDeviceStdErr
    def write(message)
      STDERR.puts(message)
      super(message)
    end
  end
  Logger::LogDevice.send(:prepend, LogDeviceStdErr)
end
