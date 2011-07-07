class App
  class Conf
    def initialize(master, local)
      @hash = master.merge(local)
    end

    def [](key) return @hash[key.to_s] end
    def []=(key, val) @hash[key.to_s]=val; return self end
    def to_hash() return @hash end
  end
end
