class Dir
  def self.children(path, flag=0)
    c = self.glob(File.join(path, '*'), flag).reject{|f| f=~/\/\.+$/}
    return block_given? ? c.each(&Proc.new) : c
  end

  def self.each_leaf(path, flag=0, nofollow=false, block=nil)
    block = Proc.new if block_given?
    if (!nofollow || !File.symlink?(path)) && File.directory?(path)
      self.children(path, flag) do |child|
        self.each_leaf(child, flag, nofollow, block) # recursive
      end
    else
      block && block.call(path)
    end
  end
end
