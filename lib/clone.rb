class Object
  def deep_copy()
    return Marshal.load(Marshal.dump(self))
  end
end
