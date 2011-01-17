open Syntax

(* type equality *)
let rec ty_eq id_pairs ty1 ty2 = 
  match ty1, ty2 with
      TyVar id1, TyVar id2 -> (
	  try (List.assoc id1 id_pairs = id2, id_pairs) with
	      Not_found -> (true, (id1, id2)::id_pairs))
    | TyInt, TyInt | TyBool, TyBool -> (true, id_pairs)
    | TyFun(domty1, ranty1), TyFun(domty2, ranty2) ->
	let b, id_pairs' = ty_eq id_pairs domty1 domty2 in
	  if b then ty_eq id_pairs' ranty1 ranty2 else (false, id_pairs)
    | TyList ty1', TyList ty2' -> ty_eq id_pairs ty1' ty2'
    | _ -> false, id_pairs

