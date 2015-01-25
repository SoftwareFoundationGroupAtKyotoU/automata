require 'test/unit'
require 'report/exercise'

class Parse < Test::Unit::TestCase
  def setup()
    @single = Report::Exercise.new('single')
    @sequence = Report::Exercise.new('Ex.4.1.3')
    @sub = Report::Exercise.new('Ex.6.4(5)')
    @underline = Report::Exercise.new('Ex.6.5_1')
  end

  def test_single()
    assert_not_nil(@single.to_a)
    assert_equal(1, @single.to_a.length)
    assert_kind_of(Report::Exercise::Token, @single.to_a[0])
    assert_equal(:num, @single.to_a[0].to_sym)
    assert_equal('single', @single.to_a[0].to_val)
    assert_equal('single', @single.to_a[0].to_s)
  end

  def test_sequence()
    assert_not_nil(@sequence.to_a)
    assert_equal(7, @sequence.to_a.length)
    assert_kind_of(Report::Exercise::Token, @sequence.to_a[0])
    assert_kind_of(Report::Exercise::Token, @sequence.to_a[1])
    assert_kind_of(Report::Exercise::Token, @sequence.to_a[2])
    assert_kind_of(Report::Exercise::Token, @sequence.to_a[3])
    assert_kind_of(Report::Exercise::Token, @sequence.to_a[4])
    assert_kind_of(Report::Exercise::Token, @sequence.to_a[5])
    assert_kind_of(Report::Exercise::Token, @sequence.to_a[6])
    assert_equal(:num, @sequence.to_a[0].to_sym)
    assert_equal(:sep, @sequence.to_a[1].to_sym)
    assert_equal(:num, @sequence.to_a[2].to_sym)
    assert_equal(:sep, @sequence.to_a[3].to_sym)
    assert_equal(:num, @sequence.to_a[4].to_sym)
    assert_equal(:sep, @sequence.to_a[5].to_sym)
    assert_equal(:num, @sequence.to_a[6].to_sym)
    assert_equal('Ex', @sequence.to_a[0].to_val)
    assert_equal('.',  @sequence.to_a[1].to_val)
    assert_equal(4,    @sequence.to_a[2].to_val)
    assert_equal('.',  @sequence.to_a[3].to_val)
    assert_equal(1,    @sequence.to_a[4].to_val)
    assert_equal('.',  @sequence.to_a[5].to_val)
    assert_equal(3,    @sequence.to_a[6].to_val)
  end

  def test_sub()
    assert_not_nil(@sub.to_a)
    assert_equal(6, @sub.to_a.length)
    assert_kind_of(Report::Exercise::Token, @sub.to_a[0])
    assert_kind_of(Report::Exercise::Token, @sub.to_a[1])
    assert_kind_of(Report::Exercise::Token, @sub.to_a[2])
    assert_kind_of(Report::Exercise::Token, @sub.to_a[3])
    assert_kind_of(Report::Exercise::Token, @sub.to_a[4])
    assert_kind_of(Report::Exercise::Sub, @sub.to_a[5])
    assert_equal(:num, @sub.to_a[0].to_sym)
    assert_equal(:sep, @sub.to_a[1].to_sym)
    assert_equal(:num, @sub.to_a[2].to_sym)
    assert_equal(:sep, @sub.to_a[3].to_sym)
    assert_equal(:num, @sub.to_a[4].to_sym)
    assert_equal(:par, @sub.to_a[5].par.to_sym)
    assert_equal('Ex', @sub.to_a[0].to_val)
    assert_equal('.',  @sub.to_a[1].to_val)
    assert_equal(6,    @sub.to_a[2].to_val)
    assert_equal('.',  @sub.to_a[3].to_val)
    assert_equal(4,    @sub.to_a[4].to_val)
    assert_equal('(',  @sub.to_a[5].par.to_val)
    assert_not_nil(@sub.to_a[5].sub.to_a)
    assert_equal(1, @sub.to_a[5].sub.to_a.length)
    assert_kind_of(Report::Exercise::Token, @sub.to_a[5].sub.to_a[0])
    assert_equal(:num,  @sub.to_a[5].sub.to_a[0].to_sym)
    assert_equal(5,  @sub.to_a[5].sub.to_a[0].to_val)
  end

  def test_underline()
    assert_not_nil(@underline.to_a)
    assert_equal(5, @underline.to_a.length)
    assert_kind_of(Report::Exercise::Token, @underline.to_a[0])
    assert_kind_of(Report::Exercise::Token, @underline.to_a[1])
    assert_kind_of(Report::Exercise::Token, @underline.to_a[2])
    assert_kind_of(Report::Exercise::Token, @underline.to_a[3])
    assert_kind_of(Report::Exercise::Token, @underline.to_a[4])
    assert_equal(:num, @underline.to_a[0].to_sym)
    assert_equal(:sep, @underline.to_a[1].to_sym)
    assert_equal(:num, @underline.to_a[2].to_sym)
    assert_equal(:sep, @underline.to_a[3].to_sym)
    assert_equal(:num, @underline.to_a[4].to_sym)
    assert_equal('Ex',  @underline.to_a[0].to_val)
    assert_equal('.',   @underline.to_a[1].to_val)
    assert_equal(6,     @underline.to_a[2].to_val)
    assert_equal('.',   @underline.to_a[3].to_val)
    assert_equal('5_1', @underline.to_a[4].to_val)
  end
end

class Compare < Test::Unit::TestCase
  def setup
    @ex1_1 =    Report::Exercise.new('Ex.1.1')
    @ex1_2 =    Report::Exercise.new('Ex.1.2')
    @ex1_3 =    Report::Exercise.new('Ex.1.3')
    @ex1_10 =   Report::Exercise.new('Ex.1.10')
    @ex1_11 =   Report::Exercise.new('Ex.1.11')
    @ex1_20 =   Report::Exercise.new('Ex.1.20')
    @ex1_21 =   Report::Exercise.new('Ex.1.21')
    @ex1_1_1 =  Report::Exercise.new('Ex.1.1.1')
    @ex1_1_2 =  Report::Exercise.new('Ex.1.1.2')
    @ex1_1_3 =  Report::Exercise.new('Ex.1.1.3')
    @ex1_2_1 =  Report::Exercise.new('Ex.1.2.1')
    @ex1_2_2 =  Report::Exercise.new('Ex.1.2.2')
    @ex1_10_1 = Report::Exercise.new('Ex.1.10.1')
    @ex1_10_2 = Report::Exercise.new('Ex.1.10.2')
    @ex1_11_1 = Report::Exercise.new('Ex.1.11.1')
    @ex1_11_2 = Report::Exercise.new('Ex.1.11.2')
    @ex1_20_1 = Report::Exercise.new('Ex.1.20.1')
    @ex1_20_2 = Report::Exercise.new('Ex.1.20.2')

    @ex2_1 =    Report::Exercise.new('Ex.2.1')
    @ex2_2 =    Report::Exercise.new('Ex.2.2')
    @ex2_3 =    Report::Exercise.new('Ex.2.3')
    @ex2_10 =   Report::Exercise.new('Ex.2.10')
    @ex2_11 =   Report::Exercise.new('Ex.2.11')
    @ex2_20 =   Report::Exercise.new('Ex.2.20')
    @ex2_21 =   Report::Exercise.new('Ex.2.21')
    @ex2_1_1 =  Report::Exercise.new('Ex.2.1.1')
    @ex2_1_2 =  Report::Exercise.new('Ex.2.1.2')
    @ex2_1_3 =  Report::Exercise.new('Ex.2.1.3')
    @ex2_2_1 =  Report::Exercise.new('Ex.2.2.1')
    @ex2_2_2 =  Report::Exercise.new('Ex.2.2.2')
    @ex2_10_1 = Report::Exercise.new('Ex.2.10.1')
    @ex2_10_2 = Report::Exercise.new('Ex.2.10.2')
    @ex2_11_1 = Report::Exercise.new('Ex.2.11.1')
    @ex2_11_2 = Report::Exercise.new('Ex.2.11.2')
    @ex2_20_1 = Report::Exercise.new('Ex.2.20.1')
    @ex2_20_2 = Report::Exercise.new('Ex.2.20.2')

    @ex1_1_s1 =     Report::Exercise.new('Ex.1.1(1)')
    @ex1_1_s2 =     Report::Exercise.new('Ex.1.1(2)')
    @ex1_3_s10 =    Report::Exercise.new('Ex.1.3(10)')
    @ex1_20_s1 =    Report::Exercise.new('Ex.1.20(1)')
    @ex1_20_s2 =    Report::Exercise.new('Ex.1.20(2)')
    @ex1_20_s10 =   Report::Exercise.new('Ex.1.20(10)')
    @ex1_20_1 = Report::Exercise.new('Ex.1.20.1')
    @ex1_20_1_s1 =  Report::Exercise.new('Ex.1.20.1(1)')
    @ex1_20_1_s2 =  Report::Exercise.new('Ex.1.20.1(2)')
    @ex1_20_1_s10 = Report::Exercise.new('Ex.1.20.1(10)')

    @ex2_1_s1 =     Report::Exercise.new('Ex.2.1(1)')
    @ex2_1_s2 =     Report::Exercise.new('Ex.2.1(2)')
    @ex2_3_s10 =    Report::Exercise.new('Ex.2.3(10)')
    @ex2_20_s1 =    Report::Exercise.new('Ex.2.20(1)')
    @ex2_20_s2 =    Report::Exercise.new('Ex.2.20(2)')
    @ex2_20_s10 =   Report::Exercise.new('Ex.2.20(10)')
    @ex2_20_1_s1 =  Report::Exercise.new('Ex.2.20.1(1)')
    @ex2_20_1_s2 =  Report::Exercise.new('Ex.2.20.1(2)')
    @ex2_20_1_s10 = Report::Exercise.new('Ex.2.20.1(10)')

    @ex3_1 =   Report::Exercise.new('Ex.3.1')
    @ex3_1_1 = Report::Exercise.new('Ex.3.1.1')
    @ex3_a =   Report::Exercise.new('Ex.3.a')
    @ex3_a_1 = Report::Exercise.new('Ex.3.a.1')
    @ex3_a_1_2 = Report::Exercise.new('Ex.3.a.1_2')
    @ex5_3_a_1_2 = Report::Exercise.new('Ex.5.3.a.1_2')

    @all =
      [
       @ex1_1,
       @ex1_2,
       @ex1_3,
       @ex1_10,
       @ex1_11,
       @ex1_20,
       @ex1_21,
       @ex1_1_1,
       @ex1_1_2,
       @ex1_1_3,
       @ex1_2_1,
       @ex1_2_2,
       @ex1_10_1,
       @ex1_10_2,
       @ex1_11_1,
       @ex1_11_2,
       @ex1_20_1,
       @ex1_20_2,
       @ex2_1,
       @ex2_2,
       @ex2_3,
       @ex2_10,
       @ex2_11,
       @ex2_20,
       @ex2_21,
       @ex2_1_1,
       @ex2_1_2,
       @ex2_1_3,
       @ex2_2_1,
       @ex2_2_2,
       @ex2_10_1,
       @ex2_10_2,
       @ex2_11_1,
       @ex2_11_2,
       @ex2_20_1,
       @ex2_20_2,
       @ex1_1_s1,
       @ex1_1_s2,
       @ex1_3_s10,
       @ex1_20_s1,
       @ex1_20_s2,
       @ex1_20_s10,
       @ex1_20_1_s1,
       @ex1_20_1_s2,
       @ex1_20_1_s10,
       @ex2_1_s1,
       @ex2_1_s2,
       @ex2_3_s10,
       @ex2_20_s1,
       @ex2_20_s2,
       @ex2_20_s10,
       @ex2_20_1_s1,
       @ex2_20_1_s2,
       @ex2_20_1_s10,
       @ex3_1,
       @ex3_1_1,
       @ex3_a,
       @ex3_a_1,
       @ex3_a_1_2,
       @ex5_3_a_1_2
      ]

    @sorted =
      [
       'Ex.1.1',
       'Ex.1.1(1)',
       'Ex.1.1(2)',
       'Ex.1.1.1',
       'Ex.1.1.2',
       'Ex.1.1.3',
       'Ex.1.2',
       'Ex.1.2.1',
       'Ex.1.2.2',
       'Ex.1.3',
       'Ex.1.3(10)',
       'Ex.1.10',
       'Ex.1.10.1',
       'Ex.1.10.2',
       'Ex.1.11',
       'Ex.1.11.1',
       'Ex.1.11.2',
       'Ex.1.20',
       'Ex.1.20(1)',
       'Ex.1.20(2)',
       'Ex.1.20(10)',
       'Ex.1.20.1',
       'Ex.1.20.1(1)',
       'Ex.1.20.1(2)',
       'Ex.1.20.1(10)',
       'Ex.1.20.2',
       'Ex.1.21',
       'Ex.2.1',
       'Ex.2.1(1)',
       'Ex.2.1(2)',
       'Ex.2.1.1',
       'Ex.2.1.2',
       'Ex.2.1.3',
       'Ex.2.2',
       'Ex.2.2.1',
       'Ex.2.2.2',
       'Ex.2.3',
       'Ex.2.3(10)',
       'Ex.2.10',
       'Ex.2.10.1',
       'Ex.2.10.2',
       'Ex.2.11',
       'Ex.2.11.1',
       'Ex.2.11.2',
       'Ex.2.20',
       'Ex.2.20(1)',
       'Ex.2.20(2)',
       'Ex.2.20(10)',
       'Ex.2.20.1',
       'Ex.2.20.1(1)',
       'Ex.2.20.1(2)',
       'Ex.2.20.1(10)',
       'Ex.2.20.2',
       'Ex.2.21',
       'Ex.3.1',
       'Ex.3.1.1',
       'Ex.3.a',
       'Ex.3.a.1',
       'Ex.3.a.1_2',
       'Ex.5.3.a.1_2'
      ]
  end

  def test_equal()
    assert_equal(0, @ex1_1    <=> @ex1_1)
    assert_equal(0, @ex1_2    <=> @ex1_2)
    assert_equal(0, @ex1_10   <=> @ex1_10)
    assert_equal(0, @ex1_10_1 <=> @ex1_10_1)

    assert_equal(0, @ex2_1    <=> @ex2_1)
    assert_equal(0, @ex2_2    <=> @ex2_2)
    assert_equal(0, @ex2_10   <=> @ex2_10)
    assert_equal(0, @ex2_10_1 <=> @ex2_10_1)

    assert_equal(0, @ex1_1_s1    <=> @ex1_1_s1)
    assert_equal(0, @ex1_1_s2    <=> @ex1_1_s2)
    assert_equal(0, @ex1_3_s10   <=> @ex1_3_s10)
    assert_equal(0, @ex1_20_1_s1 <=> @ex1_20_1_s1)

    assert_equal(0, @ex2_1_s1    <=> @ex2_1_s1)
    assert_equal(0, @ex2_1_s2    <=> @ex2_1_s2)
    assert_equal(0, @ex2_3_s10   <=> @ex2_3_s10)
    assert_equal(0, @ex2_20_1_s1 <=> @ex2_20_1_s1)

    assert_equal(0, @ex3_a   <=> @ex3_a)
    assert_equal(0, @ex3_a_1 <=> @ex3_a_1)
  end

  def test_lt()
    assert_equal(-1, @ex1_1 <=> @ex1_2)
    assert_equal(-1, @ex1_1 <=> @ex1_3)
    assert_equal(-1, @ex1_1 <=> @ex1_10)
    assert_equal(-1, @ex1_1 <=> @ex1_11)
    assert_equal(-1, @ex1_1 <=> @ex1_1_1)
    assert_equal(-1, @ex1_1 <=> @ex1_1_2)
    assert_equal(-1, @ex1_1 <=> @ex1_10_1)
    assert_equal(-1, @ex1_1 <=> @ex2_2)
    assert_equal(-1, @ex1_1 <=> @ex2_3)
    assert_equal(-1, @ex1_1 <=> @ex2_10)
    assert_equal(-1, @ex1_1 <=> @ex2_11)
    assert_equal(-1, @ex1_1 <=> @ex2_1_1)
    assert_equal(-1, @ex1_1 <=> @ex2_1_2)
    assert_equal(-1, @ex1_1 <=> @ex2_10_1)
    assert_equal(-1, @ex1_1 <=> @ex1_1_s1)
    assert_equal(-1, @ex1_1 <=> @ex1_3_s10)
    assert_equal(-1, @ex1_1 <=> @ex1_20_s10)
    assert_equal(-1, @ex1_1 <=> @ex1_20_1_s10)
    assert_equal(-1, @ex1_1 <=> @ex2_1_s1)
    assert_equal(-1, @ex1_1 <=> @ex2_3_s10)
    assert_equal(-1, @ex1_1 <=> @ex2_20_s10)
    assert_equal(-1, @ex1_1 <=> @ex2_20_1_s10)

    assert_equal(-1, @ex1_2 <=> @ex1_3)
    assert_equal(-1, @ex1_2 <=> @ex1_10)
    assert_equal(-1, @ex1_2 <=> @ex1_11)
    assert_equal(-1, @ex1_2 <=> @ex1_10_1)
    assert_equal(-1, @ex1_2 <=> @ex2_2)
    assert_equal(-1, @ex1_2 <=> @ex2_3)
    assert_equal(-1, @ex1_2 <=> @ex2_10)
    assert_equal(-1, @ex1_2 <=> @ex2_11)
    assert_equal(-1, @ex1_2 <=> @ex2_1_1)
    assert_equal(-1, @ex1_2 <=> @ex2_1_2)
    assert_equal(-1, @ex1_2 <=> @ex2_10_1)
    assert_equal(-1, @ex1_2 <=> @ex1_3_s10)
    assert_equal(-1, @ex1_2 <=> @ex1_20_s10)
    assert_equal(-1, @ex1_2 <=> @ex1_20_1_s10)
    assert_equal(-1, @ex1_2 <=> @ex2_1_s1)
    assert_equal(-1, @ex1_2 <=> @ex2_3_s10)
    assert_equal(-1, @ex1_2 <=> @ex2_20_s10)
    assert_equal(-1, @ex1_2 <=> @ex2_20_1_s10)

    assert_equal(-1, @ex1_10 <=> @ex1_11)
    assert_equal(-1, @ex1_10 <=> @ex1_10_1)
    assert_equal(-1, @ex1_10 <=> @ex2_2)
    assert_equal(-1, @ex1_10 <=> @ex2_3)
    assert_equal(-1, @ex1_10 <=> @ex2_10)
    assert_equal(-1, @ex1_10 <=> @ex2_11)
    assert_equal(-1, @ex1_10 <=> @ex2_1_1)
    assert_equal(-1, @ex1_10 <=> @ex2_1_2)
    assert_equal(-1, @ex1_10 <=> @ex2_10_1)
    assert_equal(-1, @ex1_10 <=> @ex1_20_s10)
    assert_equal(-1, @ex1_10 <=> @ex1_20_1_s10)
    assert_equal(-1, @ex1_10 <=> @ex2_1_s1)
    assert_equal(-1, @ex1_10 <=> @ex2_3_s10)
    assert_equal(-1, @ex1_10 <=> @ex2_20_s10)
    assert_equal(-1, @ex1_10 <=> @ex2_20_1_s10)

    assert_equal(-1, @ex1_10_1 <=> @ex1_11)
    assert_equal(-1, @ex1_10_1 <=> @ex2_2)
    assert_equal(-1, @ex1_10_1 <=> @ex2_3)
    assert_equal(-1, @ex1_10_1 <=> @ex2_10)
    assert_equal(-1, @ex1_10_1 <=> @ex2_11)
    assert_equal(-1, @ex1_10_1 <=> @ex2_1_1)
    assert_equal(-1, @ex1_10_1 <=> @ex2_1_2)
    assert_equal(-1, @ex1_10_1 <=> @ex2_10_1)
    assert_equal(-1, @ex1_10_1 <=> @ex1_20_s10)
    assert_equal(-1, @ex1_10_1 <=> @ex1_20_1_s10)
    assert_equal(-1, @ex1_10_1 <=> @ex2_1_s1)
    assert_equal(-1, @ex1_10_1 <=> @ex2_3_s10)
    assert_equal(-1, @ex1_10_1 <=> @ex2_20_s10)
    assert_equal(-1, @ex1_10_1 <=> @ex2_20_1_s10)

    assert_equal(-1, @ex1_1_s1 <=> @ex2_2)
    assert_equal(-1, @ex1_1_s1 <=> @ex2_3)
    assert_equal(-1, @ex1_1_s1 <=> @ex2_10)
    assert_equal(-1, @ex1_1_s1 <=> @ex2_11)
    assert_equal(-1, @ex1_1_s1 <=> @ex2_1_1)
    assert_equal(-1, @ex1_1_s1 <=> @ex2_1_2)
    assert_equal(-1, @ex1_1_s1 <=> @ex2_10_1)
    assert_equal(-1, @ex1_1_s1 <=> @ex1_20_s10)
    assert_equal(-1, @ex1_1_s1 <=> @ex1_20_1_s10)
    assert_equal(-1, @ex1_1_s1 <=> @ex2_1_s1)
    assert_equal(-1, @ex1_1_s1 <=> @ex2_3_s10)
    assert_equal(-1, @ex1_1_s1 <=> @ex2_20_s10)
    assert_equal(-1, @ex1_1_s1 <=> @ex2_20_1_s10)

    assert_equal(-1, @ex1_20_s1 <=> @ex2_2)
    assert_equal(-1, @ex1_20_s1 <=> @ex2_3)
    assert_equal(-1, @ex1_20_s1 <=> @ex2_10)
    assert_equal(-1, @ex1_20_s1 <=> @ex2_11)
    assert_equal(-1, @ex1_20_s1 <=> @ex2_1_1)
    assert_equal(-1, @ex1_20_s1 <=> @ex2_1_2)
    assert_equal(-1, @ex1_20_s1 <=> @ex2_10_1)
    assert_equal(-1, @ex1_20_s1 <=> @ex1_20_s10)
    assert_equal(-1, @ex1_20_s1 <=> @ex1_20_1)
    assert_equal(-1, @ex1_20_s1 <=> @ex1_20_1_s10)
    assert_equal(-1, @ex1_20_s1 <=> @ex2_1_s1)
    assert_equal(-1, @ex1_20_s1 <=> @ex2_3_s10)
    assert_equal(-1, @ex1_20_s1 <=> @ex2_20_s10)
    assert_equal(-1, @ex1_20_s1 <=> @ex2_20_1_s10)

    assert_equal(-1, @ex1_20_s10 <=> @ex2_2)
    assert_equal(-1, @ex1_20_s10 <=> @ex2_3)
    assert_equal(-1, @ex1_20_s10 <=> @ex2_10)
    assert_equal(-1, @ex1_20_s10 <=> @ex2_11)
    assert_equal(-1, @ex1_20_s10 <=> @ex2_1_1)
    assert_equal(-1, @ex1_20_s10 <=> @ex2_1_2)
    assert_equal(-1, @ex1_20_s10 <=> @ex2_10_1)
    assert_equal(-1, @ex1_20_s10 <=> @ex1_20_1_s10)
    assert_equal(-1, @ex1_20_s10 <=> @ex2_1_s1)
    assert_equal(-1, @ex1_20_s10 <=> @ex2_3_s10)
    assert_equal(-1, @ex1_20_s10 <=> @ex2_20_s10)
    assert_equal(-1, @ex1_20_s10 <=> @ex2_20_1_s10)

    assert_equal(-1, @ex3_1 <=> @ex3_a)
    assert_equal(-1, @ex3_1 <=> @ex3_a_1)

    assert_equal(-1, @ex3_1_1 <=> @ex3_a)
    assert_equal(-1, @ex3_1_1 <=> @ex3_a_1)
  end

  def test_gt()
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex1_2)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex1_3)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex1_10)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex1_11)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex1_1_1)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex1_1_2)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex1_10_1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex2_2)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex2_3)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex2_10)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex2_11)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex2_1_1)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex2_1_2)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex2_10_1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex1_1_s1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex1_3_s10)   )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex1_20_s10)  )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex1_20_1_s10))
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex2_1_s1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex2_3_s10)   )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex2_20_s10)  )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1, @ex2_20_1_s10))

    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex1_3)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex1_10)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex1_11)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex1_10_1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex2_2)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex2_3)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex2_10)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex2_11)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex2_1_1)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex2_1_2)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex2_10_1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex1_3_s10)   )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex1_20_s10)  )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex1_20_1_s10))
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex2_1_s1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex2_3_s10)   )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex2_20_s10)  )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_2, @ex2_20_1_s10))

    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10, @ex1_11)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10, @ex1_10_1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10, @ex2_2)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10, @ex2_3)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10, @ex2_10)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10, @ex2_11)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10, @ex2_1_1)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10, @ex2_1_2)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10, @ex2_10_1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10, @ex1_20_s10)  )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10, @ex1_20_1_s10))
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10, @ex2_1_s1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10, @ex2_3_s10)   )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10, @ex2_20_s10)  )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10, @ex2_20_1_s10))

    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10_1, @ex1_11)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10_1, @ex2_2)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10_1, @ex2_3)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10_1, @ex2_10)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10_1, @ex2_11)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10_1, @ex2_1_1)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10_1, @ex2_1_2)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10_1, @ex2_10_1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10_1, @ex1_20_s10)  )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10_1, @ex1_20_1_s10))
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10_1, @ex2_1_s1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10_1, @ex2_3_s10)   )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10_1, @ex2_20_s10)  )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_10_1, @ex2_20_1_s10))

    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1_s1, @ex2_2)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1_s1, @ex2_3)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1_s1, @ex2_10)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1_s1, @ex2_11)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1_s1, @ex2_1_1)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1_s1, @ex2_1_2)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1_s1, @ex2_10_1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1_s1, @ex1_20_s10)  )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1_s1, @ex1_20_1_s10))
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1_s1, @ex2_1_s1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1_s1, @ex2_3_s10)   )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1_s1, @ex2_20_s10)  )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_1_s1, @ex2_20_1_s10))

    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s1, @ex2_2)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s1, @ex2_3)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s1, @ex2_10)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s1, @ex2_11)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s1, @ex2_1_1)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s1, @ex2_1_2)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s1, @ex2_10_1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s1, @ex1_20_s10)  )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s1, @ex1_20_1_s10))
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s1, @ex2_1_s1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s1, @ex2_3_s10)   )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s1, @ex2_20_s10)  )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s1, @ex2_20_1_s10))

    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s10, @ex2_2)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s10, @ex2_3)       )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s10, @ex2_10)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s10, @ex2_11)      )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s10, @ex2_1_1)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s10, @ex2_1_2)     )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s10, @ex2_10_1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s10, @ex1_20_1_s10))
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s10, @ex2_1_s1)    )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s10, @ex2_3_s10)   )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s10, @ex2_20_s10)  )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex1_20_s10, @ex2_20_1_s10))

    assert_equal(1, proc{|a,b| b <=> a}.call(@ex3_1, @ex3_a)  )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex3_1, @ex3_a_1))

    assert_equal(1, proc{|a,b| b <=> a}.call(@ex3_1_1, @ex3_a)  )
    assert_equal(1, proc{|a,b| b <=> a}.call(@ex3_1_1, @ex3_a_1))
  end

  def test_sort()
    assert_equal(@sorted, @all.sort.map{|x| x.to_s})
  end

  def test_match()
    assert(@ex1_1.match(@ex1_1_1))
    assert(@ex1_1.match(@ex1_1_2))
    assert(@ex1_1.match(@ex1_1_3))

    assert(@ex1_2.match(@ex1_2_1))
    assert(@ex1_2.match(@ex1_2_2))

    assert(@ex1_10.match(@ex1_10_1))
    assert(@ex1_10.match(@ex1_10_2))

    assert(@ex1_1.match(@ex1_1_s1))
    assert(@ex1_1.match(@ex1_1_s2))

    assert(@ex1_1_s1.match(@ex1_1_s1))
    assert(@ex1_1_s2.match(@ex1_1_s2))

    assert(@ex3_a_1_2.match(@ex3_a_1_2))

    assert(@ex1_20_1.match(@ex1_20_1_s1))
    assert(@ex1_20_1.match(@ex1_20_1_s2))
    assert(@ex1_20_1.match(@ex1_20_1_s10))
  end

  def test_not_match()
    assert_equal(false, @ex1_1.match(@ex1_2_1))
    assert_equal(false, @ex1_1.match(@ex2_1_1))
    assert_equal(false, @ex1_1_s2.match(@ex1_1_s1))
    # 'Ex.3.a.1_2' isn't a child of 'Ex.3.a.1'
    assert_equal(false, @ex3_a_1_2.match(@ex3_a_1))
    # 'Ex.3.a.1' isn't a child of 'Ex.3.a.1_2'
    assert_equal(false, @ex3_a_1.match(@ex3_a_1_2))
    assert_equal(false, @ex5_3_a_1_2.match(@ex3_a_1_2))
  end
end
