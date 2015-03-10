require 'shared-mime-info'

class Pathname
  def mime()
    return MIME.check(self.to_s)
  end
end
