class App
  class Conf
    def initialize(master)
      @su = master['su']
    end

    def su?(user) return @su.include?(user) end
  end
end
