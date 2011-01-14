(* testdata for each exercise *)
(* each is the list of the pair of an expression and its value written
by strings *)
(* be sure to end the strings with double semicolons *)

(*
 Exs. 1 3 7 8 9 10 12 14 15 16 17 19 20 are tested.
 The other are not.
*)

let testdata1 = [
  ("1 + 2;;", "3;;");
  ("-2 * 2;;", "-4;;");
  ("if true then 3 else 4;;", "3;;");
]

let testdata3 = [
  ("true && false;;", "false;;");
]

let testdata7 = [
  ("let x = 3 and y = 5 in x + y;;", "8;;");
]

let testdata8 = [
  ("(fun x -> x) 3;;", "3;;");
]

let testdata9 = [
  ("let threetimes = fun f -> fun x -> f (f x x) (f x x) in threetimes (+) 5;;", "20;;");
]

let testdata10 = [
  ("(fun x y -> x) 3 4;;", "3;;");
]

let testdata12 = [
  ("let a = 3 in let p = dfun x -> x + a in let a = 5 in a * p 2;;", "35;;");
]

let testdata14 = [
  ("let rec f = fun x -> x in f 3;;", "3;;");
]


let testdata15 = [
  ("let rec f = fun x -> x and g = fun y -> y in f 3;;", "3;;");
]

let testdata16 = [
  ("1 :: 2 :: 3 :: [];;", "[1; 2; 3];;");
  ("(fun x -> x :: x :: []) 4;;", "[4; 4];;");
]

let testdata17 = [
  ("[1; 2; 3];;", "[1; 2; 3];;");
]

let testdata19 = [
  ("match [1; 2; 3] with [] -> 3 | x :: y :: rest -> 5 | x::rest -> 4 ;;", "5;;");
]

let testdata20 = [
  ("1 + if true then 2 else 3;;", "3;;");
]
