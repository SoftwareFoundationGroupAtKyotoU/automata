open Syntax
open Eval
open Typing
open Printf
open Testaux
open Testaux2

let (==/) ty1 ty2 = let b, _ = ty_eq [] ty1 ty2 in b

(*
let initial_tyenv =
  Environment.extend "true" (tysc_of_ty TyBool)
    (Environment.extend "false" (tysc_of_ty TyBool)
	(Environment.extend "i" (tysc_of_ty TyInt)
	    (Environment.extend "v" (tysc_of_ty TyInt)
		(Environment.extend "x" (tysc_of_ty TyInt) Environment.empty))))
*)

let successes = ref 0
let failures = ref 0
let errors = ref 0 (* parsing/lexing errors *)

let rec test i = function
    [] -> 
      printf "Total: %d\nSuccesses: %d\nFailures: %d\nErrors: %d\n" 
	i !successes !failures !errors; 
      exit 0
  | (e, t)::rest ->
	printf "Case #%d:\n" i;
	printf "  exp: %s\n" e;
      (try
      let Exp exp = Parser.toplevel Lexer.main (Lexing.from_string e) in
      let ty1 = TypeParser.topleveltype TypeLexer.main (Lexing.from_string t) in
      let ty2 = try Some (snd (ty_exp initial_tyenv exp)) with _ -> None in
	printf "  expected type: %s\n" (if t = ";;" then "ERROR" else t);
	printf "  inferred type: "; 
	(match ty2 with None ->
	  print_string "ERROR" | Some ty2 -> pp_ty ty2);
	print_newline ();
	if match ty1, ty2 with 
	    None, None -> true
	  | Some ty1, Some ty2 -> ty1 ==/ty2
	  | _ -> false
	    then begin incr successes; print_string " OK!!\n" end
	    else begin incr failures; print_string " Fail!!\n" end;
      with Parsing.Parse_error -> 
        printf "Parsing Error\n";
	begin incr errors; print_string " Error!!\n" end;	  
      | Failure("lexing: empty token") ->
        printf "Lexing Error\n";
	begin incr errors; print_string " Error!!\n" end);
	test (i+1) rest


(* Exs. 1 6 7 8 9 10 11 are tested*)
(* testdata9 and testdata10 is a special data.  Whether ex.9 is solved or not, testing data is prepared. *)

let testdatalet = 
ref (List.map (fun (exp, mono, _) -> (exp, mono)) Testdata.testdata9)

let testdataletrec = 
ref (List.map (fun (exp, mono, _) -> (exp, mono)) Testdata.testdata10)

let testdata = 
  let file = "solved.in" in
  let ic = open_in file in
  let rec f data = 
    (try 
      let str = input_line ic in
      let num =  int_of_string str in
      (match num with
      | 1 -> f (data @ Testdata.testdata1)
      | 6 -> f (data @ Testdata.testdata6)
      | 7 -> f (data @ Testdata.testdata7)
      | 8 -> f (data @ Testdata.testdata8)
      | 9 -> 
           testdatalet := (List.map (fun (exp, _, poly) -> (exp, poly)) Testdata.testdata9);
           f data
      | 10 -> 
           testdataletrec := (List.map (fun (exp, _, poly) -> (exp, poly)) Testdata.testdata10);
           f data
      | 11 -> f (data @ Testdata.testdata11)
      | _ -> f data)
    with
      End_of_file -> close_in ic; data)
  in f []

let testdata = testdata @ !testdatalet @ !testdataletrec

let () = test 0 testdata
