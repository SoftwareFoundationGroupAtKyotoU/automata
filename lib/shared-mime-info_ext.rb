# -*- coding: utf-8 -*-
# Avoid fnmatch bug.
# See [http://blade.nagaokaut.ac.jp/cgi-bin/scat.rb/ruby/ruby-dev/47069].
require 'shared-mime-info'

if RUBY_VERSION < '2.0.0'
  module MIME
    def check_globs(filename)
      basename = File.basename(filename)
      utf8_patterns = @globs.each_key.map{ |pattern| pattern.dup.encode("utf-8")}
      found = utf8_patterns.select { |pattern| File.fnmatch pattern, basename }

      if found.empty?
        downcase_basename = basename.downcase
        found = utf8_patterns.select { |pattern|
          File.fnmatch pattern, downcase_basename
        }
      end

      @globs[found.max]
    end
    module_function :check_globs
  end
end
