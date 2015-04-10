# -*- coding: utf-8 -*-

module Browse
  class Image
    def html(root, path, user, report_id, conf)
      image_path =
        [
         root,
         'browse',
         ::User.make_token(user).to_s,
         report_id,
         path
        ].reduce {|dir,sub| dir+sub}

      width = conf['max-width'] || 100;
      width = 0 <= width && width <= 100 ? width : 100;

      return <<"IMAGE"
<div align="center">
  <img src="#{image_path}" style="max-width: #{width}%; height: auto">
</div>
IMAGE
    end
  end
end
