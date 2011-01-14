%{
open Testaux

let rec pos x = function
    [] -> raise Not_found
  | a::rest -> if x = a then 1 else 1 + pos x rest

%}

%token SEMISEMI TRUE FALSE
%token COLONCOLON SEMI LBRACKET RBRACKET LPAREN RPAREN
%token <int> INTV

%start toplevelvalue
%type <Testaux.test_exval option> toplevelvalue
%%

toplevelvalue :
  Value SEMISEMI { Some $1 }
| SEMISEMI { None }

Value:
  Boolv { $1 }
| INTV { TestIntV $1 }
| Value COLONCOLON Value { TestConsV ($1, $3) }
| LBRACKET ValueSeq RBRACKET { $2 }
| LPAREN Value RPAREN { $2 }

ValueSeq :
  | /* empty */ { TestNilV }
  | Value { TestConsV($1, TestNilV) }
  | Value SEMI ValueSeq { TestConsV($1, $3) }

Boolv :
    TRUE { TestBoolV true }
|   FALSE { TestBoolV false }
