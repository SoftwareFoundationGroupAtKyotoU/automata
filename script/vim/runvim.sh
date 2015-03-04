#! /usr/bin/env zsh

vim -e -s --cmd 'set runtimepath+=.' --cmd 'source vimrc' -S src2html.vim  $@
