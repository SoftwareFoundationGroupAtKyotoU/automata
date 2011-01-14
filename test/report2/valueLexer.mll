{
}

rule main = parse
  (* ignore spacing and newline characters *)
  [' ' '\009' '\012' '\n']+     { main lexbuf }

| ";;" { ValueParser.SEMISEMI }
| ";" { ValueParser.SEMI }
| "::" { ValueParser.COLONCOLON }
| "[" { ValueParser.LBRACKET }
| "]" { ValueParser.RBRACKET }
| "(" { ValueParser.LPAREN }
| ")" { ValueParser.RPAREN }
| "-"? ['0'-'9']+
    { ValueParser.INTV (int_of_string (Lexing.lexeme lexbuf)) }
| "true"  { ValueParser.TRUE }
| "false" { ValueParser.FALSE }
| eof { exit 0 }

