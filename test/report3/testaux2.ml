(* initial_tyenv for let mono *)

open Syntax
open Buffer

let initial_tyenv =
  Environment.extend "true" TyBool
    (Environment.extend "false" TyBool
	(Environment.extend "i" TyInt
	    (Environment.extend "v" TyInt
		(Environment.extend "x" TyInt Environment.empty))))

let add_ty ob typ =
  let t = typ in
    add_string ob (Testaux.ty_name t)
