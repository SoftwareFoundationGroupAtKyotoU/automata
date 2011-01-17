(* Exs. 1 6 7 8 9 10 11 are tested*)
(* testdata9 is a special data.  Whether ex.9 is solved or not, testing data is prepared. *)

let testdata1 = [
    ("1 + 2;;", "int;;");
    ("-2 * 2;;", "int;;");
    ("1 < 2;;", "bool;;");
]

let testdata6 = [
    ("fun x -> x;;", "'a -> 'a;;");
    ("fun x -> fun y -> x;;", "'a -> 'b -> 'a;;");
    ("fun x -> fun y -> y;;", "'a -> 'b -> 'b;;");
    ("(fun x -> x + 1) 2 + (fun x -> x + -1) 3;;",
    " int;;");
    ("fun f -> fun g -> fun x -> g (f x);;",
     "('a -> 'b) -> ('b -> 'c) -> 'a -> 'c;;");
    ("fun x -> fun y -> fun z -> x z (y z);;",
     "('a -> 'b -> 'c) -> ('a -> 'b) -> 'a -> 'c;;");
    ("fun x -> let y = x + 1 in x;;", " int-> int;;");
    ("fun x -> let y = x + 1 in y;;", " int -> int;;");
    ("fun b -> fun x -> if x b then x else (fun x -> b);;",
     "bool -> (bool -> bool) -> bool -> bool;;");
    ("fun x -> if true then x else (if x then true else false);;",
     "bool -> bool;;");
    ("fun x -> fun y -> if x then x else y;;",
     "bool -> bool -> bool;;");
    ("fun n -> (fun x -> x (fun y -> y)) (fun f -> f n);;",
     "'a -> 'a;;");
    ("fun x -> fun y -> x y;;", "('a -> 'b) -> 'a -> 'b;;");
    ("fun x -> fun y -> x (y x);;", 
    "('a -> 'b) -> (('a -> 'b) -> 'a) -> 'b;;");
    ("fun x -> fun y -> x (y x) (y x);;", 
     "('a -> 'a -> 'b) -> (('a -> 'a -> 'b) -> 'a) -> 'b;;");
    ("fun x -> fun y -> fun z -> x (z x) (y (z x y));;", 
     "((('a -> 'b) -> 'a) -> 'b -> 'c) -> ('a -> 'b) -> (((('a -> 'b) -> 'a) -> 'b -> 'c) -> ('a -> 'b) -> 'a) -> 'c;;");

("let g = fun h -> fun t -> fun f -> fun x -> f h (t f x) in g;;",
"   'a -> (('a -> 'b -> 'c) -> 'd -> 'b) -> ('a -> 'b -> 'c) -> 'd -> 'c;;");
("let s = fun x -> fun y -> fun z -> x z (y z) in
  let k = fun x -> fun y -> x in
  let k' = fun x -> fun y -> x in
  s k k';;",
"'a -> 'a;;");

("fun x -> fun y -> fun z ->
    let b = x y z in if b then z y else y;;",
"('a -> ('a -> 'a) -> bool) -> 'a -> ('a -> 'a) -> 'a;;");

("let pair = fun x1 -> fun x2 -> fun y -> y x1 x2 in
  let proj1 = fun p -> p (fun x1 -> fun x2 -> x1) in
  let proj2 = fun p -> p (fun x1 -> fun x2 -> x2) in
  proj1 (pair 1 100);;",
 "int;;");

("1 + true;;",";;");

("2 + (fun x -> x);;", ";;");

("-2 * false;;", ";;");

("fun x -> x x;;", ";;");

("let f = fun x -> fun g -> g (x x g) in f f;;", ";;");

("let g = fun f -> fun x -> f x (f x) in g;;", ";;");

("let g = fun f -> fun x -> f x (x f) in g;;", ";;");

("fun x -> fun y -> x y + y x;;", ";;");

("fun x -> fun y -> x y + x;;", ";;");

("fun x -> fun y -> if x y then x else y;;", ";;");

("fun x -> fun y -> if x y
    then (fun z -> if y z then z else x)
    else (fun x -> x);;", ";;");

("fun x -> fun y -> fun z ->
  let b = x y z in if b then z y else z x;;", ";;");

("fun x -> fun y -> fun z ->
    if x y then z x else y z;;",
 ";;");

("fun x -> if x then 1 else x;;", ";;");

("(fun x -> x + 1) true;;", ";;");

("fun x -> fun y -> y (x (y x));;", ";;");

("(fun f -> fun x -> f (f x)) (fun x -> fun y -> x);;", ";;");

("fun x -> fun y -> 
  y (x (fun z1 -> fun z2 -> z1)) (x (fun z -> z));;", ";;");

("fun b -> fun f ->
  let g1 = fun x -> f x in
  let g2 = fun x -> f x in
  if b then g1 g2 else g2 g1;;", ";;");
]

(* option Ex 4.7 *)
let testdata7 = [
("let rec f = fun x -> f in f;;", ";;");
("let rec f = fun x -> f x in f;;", "'a -> 'b;;");
("let rec f = fun x -> f (f x) in f;;", "'a -> 'a;;");
("let rec fix_fun = fun g -> fun x -> g (fix_fun g) x in fix_fun;;", "(('a -> 'b) -> 'a -> 'b) -> 'a -> 'b;;");
("fun f -> let rec x = fun z -> f (x z) in x 666;;", "('a -> 'a) -> 'a;;");
("let rec f = fun x -> fun y -> if x < 0 then y else f (x + -1) y in f;;", "int -> 'a -> 'a;;");
("fun f -> fun g -> let rec h = fun x -> h (g (f x)) in h;;", "('a -> 'b) -> ('b -> 'a) -> 'a -> 'c;;");
("let rec loop = fun f -> fun x -> (loop f) (f x) in loop;;", "('a -> 'a) -> 'a -> 'b;;");
("let rec looq = fun f -> fun x -> (looq f) (x f) in looq;;", ";;");
("fun x -> let rec f = fun y -> x + 1 in x;;", "int -> int;;");
("let rec ind = fun x -> fun f -> fun n -> if n < 1 then x else f (ind x f (n + -1)) in ind;;", "'a -> ('a -> 'a) -> int -> 'a;;");
("let rec f = fun x -> f (x f) in f;;", ";;");
("let rec f = fun z -> f z (fun g -> fun h -> h (g h)) in f;;", ";;");
]

let testdata8 = [
(* option Ex 4.8 *)
("[];;", "'a list;;");
("[] :: [];;", "'a list list;;");
("fun x -> fun y -> x :: y;;", "'a -> 'a list -> 'a list;;");
("fun x -> fun f -> f (f x :: []);;", "'a list -> ('a list -> 'a) -> 'a;;");
("fun x -> match x with [] -> 0 | h :: t -> h;;", "int list -> int;;");
("3 :: true :: [];;", ";;");
("fun x -> x :: x;;", ";;");
("fun x -> fun y -> x :: x y;;", ";;");
("fun x -> fun y -> fun z -> x y :: z x :: y z :: [];;", ";;");
("fun x -> match x with [] -> 0 | h :: t -> x :: t;;", ";;");
]


(* each data has two types.  The former is the one under monomorphic let *)
(* The other is the one under polymorphic let *)
let testdata9 = [
    ("let id = fun x -> x in let f = fun y -> id (y id) in f;;",
    "(('a -> 'a) -> 'a) -> 'a;;",
    "(('a -> 'a) -> 'b) -> 'b;;");

    ("let k = fun x -> fun y -> x in let k1 = fun x -> fun y -> k (x k) in k1;;",
    "(('a -> 'b -> 'a) -> 'a) -> 'c -> 'b -> 'a;;",
    "(('a -> 'b -> 'a) -> 'c) -> 'd -> 'e -> 'c;;");

    ("let s = fun x -> fun y -> fun z -> x z (y z) in
  let s1 = fun x -> fun y -> fun z -> x s (z s) (y s (z s)) in s1;;",
    "  ((('a -> 'b -> 'c) -> ('a -> 'b) -> 'a -> 'c) -> 'd -> 'e -> 'f) -> 
     ((('a -> 'b -> 'c) -> ('a -> 'b) -> 'a -> 'c) -> 'd -> 'e) ->
     ((('a -> 'b -> 'c) -> ('a -> 'b) -> 'a -> 'c) -> 'd) -> 'f;;",
"((('a -> 'b -> 'c) -> ('a -> 'b) -> 'a -> 'c) -> 'd -> 'e -> 'f) -> ((('g -> 'h -> 'i) -> ('g -> 'h) -> 'g -> 'i) -> 'd -> 'e) -> ((('j -> 'k -> 'l) -> ('j -> 'k) -> 'j -> 'l) -> 'd) -> 'f;;");

("let s = fun x -> fun y -> fun z -> x z (y z) in
  let k = fun x -> fun y -> x in
  s k k;;",
 ";;",
 "'a -> 'a;;");

("let s = fun x -> fun y -> fun z -> x z (y z) in
  let k' = fun x -> fun y -> y in
  s k' k';;",
 ";;",
 "'a -> 'b -> 'b;;");

("let pair = fun x1 -> fun x2 -> fun y -> y x1 x2 in
  let proj1 = fun p -> p (fun x1 -> fun x2 -> x1) in
  let proj2 = fun p -> p (fun x1 -> fun x2 -> x2) in
  proj1 (proj2 (pair 10 (pair 20 30)));;",
";;",
"int;;");

("let f = fun x -> x in if f true then f 1 else f 2;;",
 ";;",
 "int;;");

("let f = fun x -> 3 in f true + f 4;;",
 ";;",
 "int;;");

("fun b ->
    let f = fun x -> x in
    let g = fun y -> y in
    if b then f g else g f;;",
 ";;",
 "bool -> 'a -> 'a;;");

("fun b -> fun f ->
    let g1 = fun x -> x f in
    let g2 = fun x -> x f in
    fun z -> if b then g1 z g2 else g2 z g1;;",
 ";;",
 "bool -> 'a -> ('a -> (('a -> 'b) -> 'b) -> 'c) -> 'c;;");

  ]


let testdata10 = []

let testdata11 = []
