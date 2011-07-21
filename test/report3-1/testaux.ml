open Syntax

(* type equality *)
let rec ty_eq id_pairs ty1 ty2 = 
  match ty1, ty2 with
    | TyInt, TyInt | TyBool, TyBool -> (true, id_pairs)
    | _ -> false, id_pairs

(* pretty printing *)
let ty_name_v ls = function
    TyInt -> ("int", ls)
  | TyBool -> ("bool", ls)

let ty_name ty = let (name, _) = ty_name_v [] ty in name
