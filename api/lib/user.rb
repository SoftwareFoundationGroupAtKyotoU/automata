class App
  class User
    attr_reader :report
    def initialize(user)
      @user = user
      @report = {}
    end

    def number() return @user['number'] end
    def login() return @user['login'] end
    def name() return @user['name'] end
    def ruby() return @user['ruby'] end
    def []=(k, rep) @report[k] = rep if rep end

    def to_hash()
      hash = {
        'number'   => number,
        'login'    => login,
        'name'     => name,
        'ruby'     => ruby,
      }
      hash['report'] = {} unless report.empty?
      report.each{|k,v| hash['report'][k] = v.to_hash}
      return hash
    end
  end
end
