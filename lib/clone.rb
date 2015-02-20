class Object
  # Return a deep copy of an object. 
  def deep_copy()
    Marshal.load(Marshal.dump(self))
  end
end
