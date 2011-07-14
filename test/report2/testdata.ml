(* testdata for each exercise *)
(* each is the list of the pair of an expression and its value written
by strings *)
(* be sure to end the strings with double semicolons *)

(*
 Exs. 1 3 4 5 7 8 9 10 12 14 15 16 17 18 19 20 are tested.
 The other are not.
*)

let testdata1 = [
  ("1 + 2;;", "3;;");
  ("-2 * 2;;", "-4;;");
  ("if true then 3 else 4;;", "3;;");
]

let testdata3 = [
  ("true && false;;", "false;;");
  ("true || false;;", "true;;");
  ("true || false && false;;", "true;;");
]

let testdata4 = [
  ("let x = 3 in x;;", "3;;");
  ("let x = 3 in let y = 4 in x+y;;", "7;;");
  ("let x = 3 in let y = 4 in let x = 5 in x+y;;", "9;;");
  ("let x = 3;; x;;", "3;;");
  ("let x = let y = 5 in 3+y;; x;;", "8;;");
  ("let x = let y = 5 in let z = 3 in y+z;; x;;", "8;;");
  ("let x = let y = 5 in 3+y;; y;;", ";;");
  ("let x = let y = 5 in let z = 3 in y+z;; y;;", ";;");
]

let testdata5 = [
  ("let x = 1 let y = x + 1;; x;;", "1;;");
  ("let x = 1 let y = x + 1;; y;;", "2;;");
  ("let x = 1 let y = x + 1 let z = x + y;; z;;", "3;;");
  ("let x = 1 let y = x + 1 let x = 5;; x;;", "5;;");
  ("let x = 1 let y = let x = 3 in x + 1;; y;;", "4;;");
]

let testdata7 = [
  ("let x = 10;; let x = 100 and y = x in x + y;;", "110;;");
  ("let x = 10;; let x = 100 and y = x;; x;;", "100;;");
  ("let x = 10;; let x = 100 and y = x;; y;;", "10;;");
  ("let x = 3 and y = 5 in x + y;;", "8;;");
  ("let z = let x = 3 and y = 5 in x + y;; z;;", "8;;");
]

let testdata8 = [
  ("(fun x -> x) 3;;", "3;;");
  ("(fun x -> fun y -> x) 3 4;;", "3;;");
  ("let s = fun x -> fun y -> fun z -> x z (y z) in " ^
     "let k = fun x -> fun y -> x in " ^
     "s k k 3;;", "3;;");
  ("let s = fun x -> fun y -> fun z -> x z (y z) ;; " ^
     "let k = fun x -> fun y -> x;; " ^
     "s k k 3;;", "3;;");
  ("let f = fun x -> let x = 3 in x in f 5;;", "3;;");
  ("let f = fun x -> fun y -> let x = 3 in x+y in f 5 6;;", "9;;");
  ("let f = fun x -> let x = 3 in x;; f 5;;", "3;;");
  ("let f = fun x -> fun y -> let x = 3 in x+y;; f 5 6;;", "9;;");
]

let testdata9 = [
  ("let threetimes = fun f -> fun x -> f (f x x) (f x x) in " ^
     "threetimes (+) 5;;", "20;;");
  ("let threetimes = fun f -> fun x -> f (f x x) (f x x) in " ^
     "threetimes ( * ) 5;;", "625;;");
]

let testdata10 = [
  ("(fun x y -> x) 3 4;;", "3;;");
  ("let s = fun x y z -> x z (y z) in " ^
     "let k = fun x y -> x in " ^
     "s k k 3;;", "3;;");
  ("let s x y z = x z (y z) in " ^
     "let k x y = x in " ^
     "s k k 3;;", "3;;");
  ("let s = fun x y z -> x z (y z) ;; " ^
     "let k = fun x y -> x;; " ^
     "s k k 3;;", "3;;");
  ("let s x y z = x z (y z) ;; " ^
     "let k x y = x;; " ^
     "s k k 3;;", "3;;");
]

let testdata12 = [
  ("let a = 3 in let p = dfun x -> x + a in let a = 5 in a * p 2;;", "35;;");
]

let testdata14 = [
  ("let rec f = fun x -> x in f 3;;", "3;;");
  ("let rec f = fun x -> x;; f 3;;", "3;;");
  ("let rec fact = fun n -> if n < 1 then 1 else n*fact (n + -1) in fact 5;;",
   "120;;");
  ("let rec fact = fun n -> if n < 1 then 1 else n*fact (n + -1);; fact 5;;",
   "120;;");
]

let testdata15 = [
  ("let rec f = fun x -> x and g = fun y -> y in f 3;;", "3;;");
  ("let rec f = fun x -> x and g = fun y -> y;; f 3;;", "3;;");
  ("let rec even = fun n -> if n < 1 then true else odd (n + -1) and " ^
     "odd = fun n -> if n < 1 then false else even (n + -1) in " ^
     "odd 3;;", "true;;");
  ("let rec even = fun n -> if n < 1 then true else odd (n + -1) and " ^
     "odd = fun n -> if n < 1 then false else even (n + -1) in " ^
     "even 3;;", "false;;");
  ("let rec even = fun n -> if n < 1 then true else odd (n + -1) and " ^
     "odd = fun n -> if n < 1 then false else even (n + -1) in " ^
     "odd 4;;", "false;;");
  ("let rec even = fun n -> if n < 1 then true else odd (n + -1) and " ^
     "odd = fun n -> if n < 1 then false else even (n + -1) in " ^
     "even 4;;", "true;;");
  ("let rec even = fun n -> if n < 1 then true else odd (n + -1) and " ^
     "odd = fun n -> if n < 1 then false else even (n + -1);; " ^
     "odd 3;;", "true;;");
  ("let rec even = fun n -> if n < 1 then true else odd (n + -1) and " ^
     "odd = fun n -> if n < 1 then false else even (n + -1);; " ^
     "even 3;;", "false;;");
  ("let rec even = fun n -> if n < 1 then true else odd (n + -1) and " ^
     "odd = fun n -> if n < 1 then false else even (n + -1);; " ^
     "odd 4;;", "false;;");
  ("let rec even = fun n -> if n < 1 then true else odd (n + -1) and " ^
     "odd = fun n -> if n < 1 then false else even (n + -1);; " ^
     "even 4;;", "true;;");
]

let testdata16 = [
  ("1 :: 2 :: 3 :: [];;", "[1; 2; 3];;");
  ("(fun x -> x :: x :: []) 4;;", "[4; 4];;");
  ("let rec length = fun l -> match l with [] -> 0 " ^
     "| x::rest -> 1 + length rest in length (1 :: 2 :: 3 :: []);;",
   "3;;");
]

let testdata17 = [
  ("[1; 2; 3];;", "[1; 2; 3];;");
  ("4 :: [1; 2; 3];;", "[4; 1; 2; 3];;");
  ("[1] :: [2] :: [];;", "[ [1]; [2] ];;");
  ("[1] :: [2] :: [] :: [];;", "[ [1]; [2]; [] ];;");
]

let testdata18 = [
  ("let rec length = fun l -> match l with [] -> 0 " ^
     "| x::x -> 1 + length x in length (1 :: 2 :: 3 :: []);;",
   ";;");
]

let testdata19 = [
  ("match [1; 2; 3] with [] -> 3 | x :: y :: rest -> 5 | x::rest -> 4 ;;",
   "5;;");
  ("match [ [1]; [2]; [3] ] with [] -> 3 " ^
     "| [2] :: rest -> rest " ^
     "| [1] :: x :: rest -> x " ^
     "| x -> x ;;",
   "[2];;");
]

let testdata20 = [
  ("1 + if true then 2 else 3;;", "3;;");
]
