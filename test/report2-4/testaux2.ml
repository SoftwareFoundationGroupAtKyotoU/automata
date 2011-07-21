(* pretty printing *)
let rec string_of_exval = function
  | Eval.IntV i -> string_of_int i
  | Eval.BoolV b -> string_of_bool b
