require 'etc'
require 'shellwords'

module Permission
  def su(user, cmd=nil, sudo=true)
    user = Etc.getpwuid(user).name if user.is_a?(Numeric)
    su = [ "su #{user}" ]
    su.push(%Q!-c "#{cmd}"!) if cmd
    su.unshift('sudo') if sudo
    return system(su.join(' '))
  end

  def get_writable(file)
    stat = File.stat(file)
    return {
      0200 => stat.uid,
      0020 => stat.gid,
      0002 => Process.uid,
      0    => 0, # root
    }.to_a.sort{|a,b| b[0] <=> a[0]}.map do |mask,u|
      (stat.mode & mask) == mask ? u : nil
    end.compact
  end

  def writable?(file)
    user = Process.uid unless user
    allowed = get_writable(file)
    return [ Process.uid, Process.gid ].any?{|id| allowed.include?(id)}
  end

  def ensure_writable(file)
    unless writable?(file)
      Dir.chdir(File.dirname(File.expand_path($0))) do
        args = $*.map{|x| Shellwords.escape(x)}
        cmd = "./#{File.basename($0)} #{args.join(' ')}"
        id = get_writable(file).first
        exit(su(id, cmd) ? 0 : 1)
      end
    end
  end

  module_function :su, :get_writable, :writable?, :ensure_writable
end
