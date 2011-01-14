type test_exval = 
    TestIntV of int
  | TestBoolV of bool
  | TestProcV
  | TestConsV of test_exval * test_exval
  | TestNilV

(* this implementation must be completed *)
let rec pp_test_exval = function
    TestIntV i -> print_int i
  | TestBoolV b -> print_string (string_of_bool b)
  | TestProcV -> print_string "<fun>"
  | TestNilV -> print_string "[]"
  | TestConsV (v1, v2) -> 
      pp_test_exval v1;
      print_string " :: (";
      pp_test_exval v2;
      print_string ")"
(*  | TestListV exvals -> print_string "this is a list" *)

(* value equality *)
let rec test_exval_eq v1 v2 = 
  match v1, v2 with
    TestBoolV b1, TestBoolV b2 -> b1 = b2
  | TestIntV i1, TestIntV i2 -> i1 = i2
  | TestNilV, TestNilV -> true
  | TestConsV (v1, v2), TestConsV (v3, v4) ->
      (test_exval_eq v1 v3) && (test_exval_eq v2 v4)
  | _ -> false

let (==/) v1 v2 = test_exval_eq v1 v2

