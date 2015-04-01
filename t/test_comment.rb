require 'test/unit'

require 'store'
require 'comment'

class CommentTest < Test::Unit::TestCase
  def setup()
    @path = "./"
    @user = "normal user"
    @user2 = "normal user2"
    @super_user = "super user"
    @other = "other?"
    @comments = {}
    @comments[@user] = Comment.new(@user, :user, @path, {})
    @comments[@user2] = Comment.new(@user2, :user, @path, {})
    @comments[@super_user] = Comment.new(@super_user, :super, @path, {})
    @comments[@other] = Comment.new(@other, :other, @path, {})

    @user_comment = "comment1"
    @user_comment2 = "comment1-2"
    @user2_comment = "comment2"
    @su_comment = "super user"
    @other_comment = "other"
  end

  def teardown()
    @comments[@super_user].delete_all()
    Comment::FILE.each_key do |key|
      path = @path + Comment::FILE[key]
      File.delete(path) if File.exist?(path)
    end
  end

  def add_comments()
    @comments[@user].add({ content: @user_comment, acl: [] })
    @comments[@super_user].add({ content: @su_comment, acl: ['super'] })
    @comments[@other].add({ content: @other_comment })
    @comments[@user2].add({ content: @user2_comment, acl: [] })
    @comments[@user].add({ content: @user_comment2, acl: ['user'] })
  end

  def test_db_index()
    assert_not_nil(@comments[@user].db_index)
  end

  def test_db_read()
    assert_not_nil(@comments[@user].db_read)
  end

  def check_comments(expected, user)
    comments = @comments[user].retrieve({ type: 'raw' })
    assert_not_nil(comments)
    assert_equal(expected.length, comments.length)
    expected.length.times {|i|
      assert_equal(expected[i] + "\n", comments[i]['content'])
    }
  end

  def test_retrival()
    add_comments()

    check_comments([@user_comment, @other_comment, @user_comment2], @user)
    check_comments([@other_comment, @user2_comment, @user_comment2], @user2)
    check_comments([@user_comment, @su_comment, @other_comment, @user2_comment,
                    @user_comment2], @super_user)
    check_comments([@other_comment], @other)
  end

  def test_edit()
    add_comments()

    # The number of comments is 5.
    assert_raise(Comment::NotFound) { @comments[@user].edit({ id: 6 }) }
    assert_raise(Comment::NotFound) {
      @comments[@super_user].edit({ id: 6 })
    }
    assert_raise(Comment::NotFound) { @comments[@other].edit({ id: 6 }) }

    # Cannot edit other's comments.
    2.times {|i|
       assert_raise(Comment::PermissionDenied) {
         @comments[@user2].edit({ id: i+1 })
       }
       assert_raise(Comment::PermissionDenied) {
         @comments[@other].edit({ id: i+1 })
       }
     }
    assert_raise(Comment::PermissionDenied) {
      @comments[@user].edit({ id: 4 })
    }

    # Edit a comment.
    check_comments([@user_comment, @other_comment, @user_comment2], @user)
    @comments[@user].edit({ id: 1, content: "edit!" })
    check_comments(["edit!", @other_comment, @user_comment2], @user)

    # Super user can edit any comment.
    expected = ["edit!", @su_comment, @other_comment, @user2_comment,
                @user_comment2]
    check_comments(expected, @super_user)
    @comments[@super_user].edit({ id: 2, content: "edit2!" })
    expected[2-1] = "edit2!"
    check_comments(expected, @super_user)
    @comments[@super_user].edit({ id: 1, content: "edit3!" })
    expected[1-1] = "edit3!"
    check_comments(expected, @super_user)
    @comments[@super_user].edit({ id: 3, content: "edit4!" })
    expected[3-1] = "edit4!"
    check_comments(expected, @super_user)
  end

  def test_delete_by_user()
    add_comments()

    check_comments([@user_comment, @other_comment, @user_comment2], @user)
    @comments[@user].delete(1)
    check_comments([@other_comment, @user_comment2], @user)
    # Cannot delete super user's comment.
    assert_raise(Comment::PermissionDenied) { @comments[@user].delete(2) }
    check_comments([@other_comment, @user_comment2], @user)
    assert_raise(Comment::PermissionDenied) { @comments[@user].delete(4) }
    check_comments([@other_comment, @user_comment2], @user)

    check_comments([@other_comment, @user2_comment, @user_comment2], @user2)
  end

  def test_delete_by_su()
    add_comments()

    check_comments([@user_comment, @su_comment, @other_comment, @user2_comment,
                   @user_comment2], @super_user)
    @comments[@super_user].delete(1)
    check_comments([@su_comment, @other_comment, @user2_comment,
                    @user_comment2], @super_user)
    @comments[@super_user].delete(3)
    check_comments([@su_comment, @user2_comment, @user_comment2], @super_user)
    @comments[@super_user].delete(4)
    check_comments([@su_comment, @user_comment2], @super_user)
    @comments[@super_user].delete(2)
    check_comments([@user_comment2], @super_user)
  end

  def test_read()
    add_comments()

    assert_raise(Comment::PermissionDenied) { @comments[@other].read(1) }
    assert_raise(Comment::PermissionDenied) { @comments[@other].read(2) }

    # These operations should not raise an exception.
    @comments[@user].read(1)
    @comments[@user].read(2)
    @comments[@super_user].read(1)
    @comments[@super_user].read(2)
  end

  def test_news()
    add_comments()

    @comments[@user].read(1)
    @comments[@user2].read(4)
    @comments[@user2].star(4)

    assert_equal({ 'unreads' => 2, 'stars' => 0, 'comments' => 3 }, @comments[@user].news())
    assert_equal({ 'unreads' => 1, 'stars' => 1, 'comments' => 3 }, @comments[@user2].news())
  end
end
