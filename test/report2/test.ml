(* open Syntax *)
open Eval
open Printf
open Testaux

let initial_env = Environment.empty

(*
  Environment.extend "i" (IntV 1)
    (Environment.extend "v" (IntV 5) 
       (Environment.extend "x" (IntV 10) Environment.empty))
*)

let successes = ref 0
let failures = ref 0
let errors = ref 0 (* parsing/lexing errors *)

let rec test i = function
    [] -> 
      printf "Total: %d\nSuccesses: %d\nFailures: %d\nErrors: %d\n" 
	i !successes !failures !errors; 
      exit 0
  | (e, v)::rest ->
      printf "Case #%d:\n" i;
      printf "  exp: %s\n" e;
      (try
	     let Syntax.Exp exp = Parser.toplevel Lexer.main (Lexing.from_string e) in
	     let exval1opt = ValueParser.toplevelvalue ValueLexer.main (Lexing.from_string v) in
	     let exval2opt = ValueParser.toplevelvalue ValueLexer.main
	       (Lexing.from_string ((string_of_exval (eval_exp initial_env exp))^";;")) in
	       printf "  expected value: %s\n" (if v = ";;" then "ERROR" else v);
	       printf "  returned value: "; 
	       (match exval2opt with None ->
	          print_string "ERROR" | Some exval2 -> pp_test_exval exval2);
	       print_newline ();
	       if match exval1opt, exval2opt with 
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
	         begin incr errors; print_string " Error!!\n" end
         | e ->
           print_endline (Printexc.to_string e);
           begin incr errors; print_string " Error!!\n" end);
      test (i+1) rest

let testdata = Testdata.testdata1 

(*
Exs. 1 3 7 8 9 10 12 14 15 16 17 19 20 are tested.
The other are not.
*)
let testdata = 
  let file = "solved.in" in
  let ic = open_in file in
  let rec f data = 
    (try 
      let str = input_line ic in
      let num =  int_of_string str in
      (match num with
      | 1 -> f (data @ Testdata.testdata1)
      | 3 -> f (data @ Testdata.testdata3)
      | 7 -> f (data @ Testdata.testdata7)
      | 8 -> f (data @ Testdata.testdata8)
      | 9 -> f (data @ Testdata.testdata9)
      | 10 -> f (data @ Testdata.testdata10)
      | 12 -> f (data @ Testdata.testdata12)
      | 14 -> f (data @ Testdata.testdata14)
      | 15 -> f (data @ Testdata.testdata15)
      | 16 -> f (data @ Testdata.testdata16)
      | 17 -> f (data @ Testdata.testdata17)
      | 19 -> f (data @ Testdata.testdata19)
      | 20 -> f (data @ Testdata.testdata20)
      | _ -> f data)
    with
      End_of_file -> close_in ic; data)
  in f []

let () = test 0 testdata
