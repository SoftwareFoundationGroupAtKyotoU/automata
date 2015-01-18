
require 'pathname'

module Util
  # Finds a directory that has a given name and exists in the nearest parent
  # directory from a given base file.
  # @param [String] a base file name
  # @param [Symbol] a directory name
  # @return [Pathname] a path to the directory or nil if not found
  def self.find_base(file, dir)
    e = Pathname.new(file).expand_path.parent.to_enum(:ascend)
    e.map { |x| x + dir.to_s }.find(&:directory?)
  end
end
