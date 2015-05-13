require 'fileutils'
require 'zip'
require 'kconv'

module Zip
  class File
    # Unzip a zip file.  The path names are converted to UTF-8.
    # @param file [String, Pathname] a location of an unzipped file
    # @param dst  [String, Pathname] a directory where each entry of the zip
    #   file is put
    def self.unzip(file, dst)
      dst = dst.to_s
      open(file.to_s) do |zip_file|
        zip_file.each do |entry|
          path = ::File.join(dst, entry.name.toutf8)
          ::FileUtils.mkdir_p(::File.dirname(path))
          entry.extract(path)
        end
      end
    end
  end
end
