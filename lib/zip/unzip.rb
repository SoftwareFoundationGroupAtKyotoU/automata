require 'fileutils'
require 'zip'

module Zip
  class File
    # Unzip a zip file
    # @param [String, Pathname] file is a location of an unzipped file
    # @param [String, Pathname] dst is a directory where each entry of the zip file is put
    def self.unzip(file, dst)
      dst = dst.to_s
      open(file.to_s) do |zip_file|
        zip_file.each do |entry|
          path = ::File.join(dst, entry.name)
          ::FileUtils.mkdir_p(::File.dirname(path))
          entry.extract(path)
        end
      end
    end
  end
end
