# coding: utf-8

require 'logger'
require_relative '../conf'

class App
  class Logger < ::Logger

    LOGGER_LEVEL = {
      "FATAL" => FATAL,
      "ERROR" => ERROR,
      "WARN"  => WARN,
      "INFO"  => INFO,
      "DEBUG" => DEBUG,
    }

    def initialize(conf=nil)
      conf = Conf.new if conf.nil?
      super(conf[:master, :logger, :path])
      self.level = LOGGER_LEVEL[conf[:master, :logger, :level]]
    end
  end
end

if RUBY_VERSION >= '2.0.0'
  module LogDeviceStdErr
    def write(message)
      STDERR.puts(message)
      super(message)
    end
  end
  Logger::LogDevice.send(:prepend, LogDeviceStdErr)
end
