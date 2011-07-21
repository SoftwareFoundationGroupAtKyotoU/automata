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
(*    | TyList ty1', TyList ty2' -> ty_eq id_pairs ty1' ty2' *)
    | _ -> false, id_pairs

(* pretty printing *)
let rec ty_name_v ls = function
    TyInt -> ("int", ls)
  | TyBool -> ("bool", ls)
  | TyVar v ->
      let put_apos s = "'" ^ s in
      let make_name n =
        let ch = char_of_int ((n mod 26) + (int_of_char 'a')) in
        let nn = n / 26 in
            (String.make 1 ch) ^ if nn != 0 then string_of_int nn else ""
      in
        (try (put_apos (make_name (List.assoc v ls)), ls)
         with Not_found ->
           (match ls with
                [] -> (put_apos "a", [(v, 0)])
              | (_, num)::_ ->
                  let num' = num + 1 in
                    (put_apos (make_name num'), (v, num')::ls)))
  | TyFun (ty1, ty2) ->
      let (name1, ls1) = ty_name_paren ls ty1 in
      let (name2, ls2) = ty_name_v ls1 ty2 in
        fty_name ls2 name1 name2
  (* | TyList typ -> let (name, ls) = (ty_name_paren ls typ) in *)
  (*     (name ^ " list", ls) *)
and ty_name_paren ls = function
    TyFun (_, _) as ty -> let (name, ls) = ty_name_v ls ty in
      ("(" ^ name ^ ")", ls)
  | typ -> ty_name_v ls typ
and fty_name ls tyn1 tyn2 = (tyn1 ^ " -> " ^ tyn2, ls)

let ty_name ty = let (name, _) = ty_name_v [] ty in name
