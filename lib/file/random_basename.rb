require 'securerandom'

class File
  def self.random_basename(len=8)
    SecureRandom.hex(len/2+1)[0..len] + Time.now.usec.to_s
  end
end
