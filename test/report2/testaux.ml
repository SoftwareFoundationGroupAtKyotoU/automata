open Buffer

type test_exval = 
    TestIntV of int
  | TestBoolV of bool
  | TestProcV
  | TestConsV of test_exval * test_exval
  | TestNilV

(* this implementation must be completed *)
let rec add_test_exval ob = function
    TestIntV i -> add_string ob (string_of_int i)
  | TestBoolV b -> add_string ob (string_of_bool b)
  | TestProcV -> add_string ob "<fun>"
  | TestNilV -> add_string ob "[]"
  | TestConsV (v1, v2) ->
      add_test_exval ob v1;
      add_string ob " :: (";
      add_test_exval ob v2;
      add_string ob ")"

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

