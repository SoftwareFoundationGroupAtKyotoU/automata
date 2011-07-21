(* initial_tyenv for let mono *)

open Syntax

let initial_tyenv =
  Environment.extend "true" TyBool
    (Environment.extend "false" TyBool
	(Environment.extend "i" TyInt
	    (Environment.extend "v" TyInt
		(Environment.extend "x" TyInt Environment.empty))))

let pp_ty typ =
  let t = typ in
    print_string (Testaux.ty_name t)
