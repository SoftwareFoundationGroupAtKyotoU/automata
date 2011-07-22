(* initial_tyenv for let mono *)

open Syntax

let initial_tyenv =
  Environment.extend "true" TyBool
    (Environment.extend "false" TyBool
	(Environment.extend "i" TyInt
	    (Environment.extend "v" TyInt
		(Environment.extend "x" TyInt Environment.empty))))

let output_ty oc typ =
  let t = typ in
    output_string oc (Testaux.ty_name t)
