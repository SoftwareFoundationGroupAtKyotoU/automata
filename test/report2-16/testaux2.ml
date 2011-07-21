(* pretty printing *)
let rec string_of_exval = function
  | Eval.IntV i -> string_of_int i
  | Eval.BoolV b -> string_of_bool b
  | Eval.ProcV _ -> "<fun>"
  | Eval.ListV ls ->
      let rec str_lst = function
        | [] -> ""
        | [last] -> string_of_exval last
        | x :: rest -> (string_of_exval x) ^ "; " ^ (str_lst rest)
      in
        "[" ^ (str_lst ls) ^ "]"
