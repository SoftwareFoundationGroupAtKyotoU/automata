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
  | ListTy RARROW TypeExp { 
	fun a -> 
	  let a', t1 = $1 a in
	  let a'', t2 = $3 a' in 
	    (a'', TyFun (t1, t2))
    }

ListTy :
    AtomTy { fun a -> $1 a }
  | ListTy TYLIST { fun a -> let a', t = $1 a in (a', TyList t) }

AtomTy :
    TYINT { fun a -> (a, TyInt) }
  | TYBOOL { fun a -> (a, TyBool) }
  | TYVAR { 
	fun a -> 
	  try a, TyVar (pos $1 a) with
	      Not_found -> (a @ [$1], TyVar (List.length a + 1))
      } 
  | LPAREN TypeExp RPAREN { $2 }
