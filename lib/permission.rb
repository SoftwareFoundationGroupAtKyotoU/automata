require 'etc'
require 'shellwords'

module Permission
  # Execute a command as a user.
  # @param [String, Integer] user a username or uid of a user to execute cmd
  # @param [String] cmd a command to be executed
  # @param [Bool] sudo if true, execute cmd with sudo
  # @return [Bool, nil] the return value of the execution of cmd
  #   (see Kernel.system)
  def su(user, cmd = nil, sudo = true)
    user = Etc.getpwuid(user).name if user.is_a?(Numeric)
    su = "su #{user}"
    su += " -c \"#{cmd}\"" if cmd
    su = 'sudo ' + su if sudo
    system(su)
  end

  # Users writable to a file.
  # @param [String] file filename
  # @return [Array<Integer>] the array of uid and gid
  def get_writable(file)
    stat = File.stat(file)
    masks = {
      0200 => stat.uid,
      0020 => stat.gid,
      0002 => Process.uid,
      0    => 0, # root
    }.to_a.sort { |a, b| b[0] <=> a[0] }
    masks.map! { |mask, u| (stat.mode & mask) == mask ? u : nil }
    masks.compact
  end

  # Whether the user who executes the process where this method is called is
  # writable to a file or not.
  # @param [String] file filename
  # @return [Bool] if writable then true, or false
  def writable?(file)
    allowed = get_writable(file)
    [Process.uid, Process.gid].any? { |id| allowed.include?(id) }
  end

  # If the user who invokes the process is writable to a file, does nothing;
  # otherwise, invokes the same process as another user who is writable to the
  # file.
  # @param [String] file filename
  def ensure_writable(file)
    return if writable?(file)
    Dir.chdir(File.dirname(File.expand_path($PROGRAM_NAME))) do
      args = ARGV.map { |x| Shellwords.escape(x) }
      cmd = "./#{File.basename($PROGRAM_NAME)} #{args.join(' ')}"
      id = get_writable(file).first
      exit(su(id, cmd) ? 0 : 1)
    end
  end

  module_function :su, :get_writable, :writable?, :ensure_writable
end
