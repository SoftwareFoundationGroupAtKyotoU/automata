(* initial_tyenv for let polymorphism *)

open Syntax

let initial_tyenv =
  Environment.extend "true" (tysc_of_ty TyBool)
    (Environment.extend "false" (tysc_of_ty TyBool)
	(Environment.extend "i" (tysc_of_ty TyInt)
	    (Environment.extend "v" (tysc_of_ty TyInt)
		(Environment.extend "x" (tysc_of_ty TyInt) Environment.empty))))

let output_ty oc typ =
  let TyScheme (_, t) = typ in
    output_string oc (Testaux.ty_name t)
