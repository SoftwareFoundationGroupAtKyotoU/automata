require 'securerandom'

class String
  # Return a random string which includes characters of a reciever
  # @param [Integer] len the length of the returned string
  def randomize(len=128)
    return Array.new(len).map{
      self[SecureRandom.random_number(self.length)].chr
    }.join
  end

  # Return a random string
  # @param [Integer] len the length of the returned string
  # @param [String] src characters which may be included by the returned string
  # @return [String] a random string which includes characters from src,
  #                  or lowercases, uppercases, numerals, and some symbols if src is nil
  def self.random(len=128, src=nil)
    src ||=
      [
       'a'..'z',
       'A'..'Z',
       0..9,
      ].map{|v| v.to_a}.join + '!@#$%^&*()_-=,./'
    return src.randomize(len)
  end
end
