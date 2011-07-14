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
let errors = ref 0

let eval_test (testcase : (string * string)) : string * string =
  let buf = Lexing.from_string (fst testcase) in
  let rec eval_loop buf env : string =
    let program = Parser.toplevel Lexer.main buf in
      begin
        match program with
          | Syntax.Exp exp -> begin
              try let v = eval_exp env exp in string_of_exval v with _ -> ""
            end
          | _ ->
              let (id, env, v) = eval_decl env program in eval_loop buf env
      end in
    ( (eval_loop buf initial_env) ^ ";;", snd testcase )

let rec test i = function
    [] ->
      printf "Total: %d\nSuccesses: %d\nFailures: %d\nErrors: %d\n"
	i !successes !failures !errors;
      exit 0
  | testcase::rest ->
      printf "Case #%d:\n" i;
      printf "  exp: %s\n" (fst testcase);
      (try
         let (a, b) = eval_test testcase in
         let (buf2, buf1) = (Lexing.from_string a, Lexing.from_string b) in
	     let exval1opt = ValueParser.toplevelvalue ValueLexer.main buf1 in
	     let exval2opt = ValueParser.toplevelvalue ValueLexer.main buf2 in
	       printf "  expected value: %s\n" (if b = ";;" then "ERROR" else b);
	       printf "  returned value: ";
           begin
	         match exval2opt with None ->
	           print_string "ERROR" | Some exval2 -> pp_test_exval exval2
           end;
	       print_newline ();
	       if match exval1opt, exval2opt with
	           None, None -> true
	         | Some ty1, Some ty2 -> ty1 ==/ ty2
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
      | 4 -> f (data @ Testdata.testdata4)
      | 5 -> f (data @ Testdata.testdata5)
      | 7 -> f (data @ Testdata.testdata7)
      | 8 -> f (data @ Testdata.testdata8)
      | 9 -> f (data @ Testdata.testdata9)
      | 10 -> f (data @ Testdata.testdata10)
      | 12 -> f (data @ Testdata.testdata12)
      | 14 -> f (data @ Testdata.testdata14)
      | 15 -> f (data @ Testdata.testdata15)
      | 16 -> f (data @ Testdata.testdata16)
      | 17 -> f (data @ Testdata.testdata17)
      | 18 -> f (data @ Testdata.testdata18)
      | 19 -> f (data @ Testdata.testdata19)
      | 20 -> f (data @ Testdata.testdata20)
      | _ -> f data)
    with
      End_of_file -> close_in ic; data)
  in f []

let () = test 0 testdata
