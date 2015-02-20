let html_use_css = 1
let use_xhtml = 1
silent TOhtml
%s/^<title>.*<\/title>$//
global/^/ p 
qall!
