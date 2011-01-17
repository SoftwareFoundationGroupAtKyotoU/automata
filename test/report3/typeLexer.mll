{
let reservedWords = [
  (* Keywords *)
  ("int", TypeParser.TYINT);
  ("bool", TypeParser.TYBOOL);
(*  ("list", TypeParser.TYLIST); *)
] 
}

rule main = parse
  (* ignore spacing and newline characters *)
  [' ' '\009' '\012' '\n']+     { main lexbuf }

| "(" { TypeParser.LPAREN }
| ")" { TypeParser.RPAREN }
| ";;" { TypeParser.SEMISEMI }
| "->" { TypeParser.RARROW }

| '\'' ['a'-'z'] ['a'-'z' '0'-'9' '_' '\'']*
    { TypeParser.TYVAR (Lexing.lexeme lexbuf) }

| "int" { TypeParser.TYINT }
| "bool" { TypeParser.TYBOOL }
(* | "list" { TypeParser.TYLIST } *)
| eof { exit 0 }

