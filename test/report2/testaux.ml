type test_exval = 
    TestIntV of int
  | TestBoolV of bool
  | TestProcV
  | TestConsV of test_exval * test_exval
  | TestNilV

(* this implementation must be completed *)
let rec output_test_exval oc = function
    TestIntV i -> output_string oc (string_of_int i)
  | TestBoolV b -> output_string oc (string_of_bool b)
  | TestProcV -> output_string oc "<fun>"
  | TestNilV -> output_string oc "[]"
  | TestConsV (v1, v2) -> 
      output_test_exval oc v1;
      output_string oc " :: (";
      output_test_exval oc v2;
      output_string oc ")"

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

