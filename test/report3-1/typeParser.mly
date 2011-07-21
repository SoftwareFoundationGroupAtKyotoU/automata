%{
open Syntax

let rec pos x = function
    [] -> raise Not_found
  | a::rest -> if x = a then 1 else 1 + pos x rest

%}

%token SEMISEMI RARROW RPAREN LPAREN
%token <Syntax.id> ID

%token TYINT TYBOOL TYLIST
%token <Syntax.id> TYVAR

%start topleveltype
%type <Syntax.ty option> topleveltype
%%

topleveltype :
    TypeExp SEMISEMI { let _, ty = $1 [] in Some ty }
  | SEMISEMI { None }

TypeExp :
    ListTy { fun a -> $1 a }

ListTy :
    AtomTy { fun a -> $1 a }

AtomTy :
    TYINT { fun a -> (a, TyInt) }
  | TYBOOL { fun a -> (a, TyBool) }
  | LPAREN TypeExp RPAREN { $2 }
