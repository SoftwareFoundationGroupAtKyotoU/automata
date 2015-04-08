# -*- coding: utf-8 -*-

module Browse
  class Applet
    def html(root, path, user, report_id, conf)
      # applet tag consists of five attributes, 'code', 'codebase', 'archive', 'height' and 'width'
      # 'code' is a name of main class
      # 'codebase' is relative_path from "/public/record/" to a path where .class files exist
      # 'archive' is relative path from 'codebase' to "/public/jar/"

      # the path to the directory including .class file
      codebase_from_root =
        [
         root,
         'browse',
         ::User.make_token(user).to_s,
         report_id,
         path.parent
        ].reduce {|dir,sub| dir+sub}

      archive_path = root + 'jar'
      libs = conf['java_library']
      if libs.nil? || libs.empty?
        libs = []
      else
        rel_archive_path = archive_path.relative_path_from(codebase_from_root)
        libs = (libs.map { |item| rel_archive_path + item })
      end

      # width and height of applet view
      width = conf['width'] || 500
      height = conf['height'] || 400

      applet_html = <<"APPLET"
      <applet
        code="#{File.basename(path.to_s, '.*')}"
        codebase="#{codebase_from_root}"
        #{libs.empty? ? '' : 'archive="' + libs.join(',') + '"'}
        width="#{width}"
        height="#{height}"
      >
      Note: This demo requires a Java enabled browser.  If you see this message then your browser either doesn't support Java or has had Java disabled.
      </applet>
APPLET
      return applet_html
    end
  end
end
