(* open Syntax *)
open Eval
open Printf
open Buffer
open Testaux
open Testaux2

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
              try let v = eval_exp env exp in Testaux2.string_of_exval v
              with _ -> ""
            end
          | _ ->
              let something = eval_decl env program in
              let (_, (env : Eval.exval Environment.t)) =
                Marshal.from_string (Marshal.to_string something []) 0
              in
                eval_loop buf env
      end in
    ( (eval_loop buf initial_env) ^ ";;", snd testcase )

let rec test ob i = function
    [] ->
      bprintf ob "Total: %d\nSuccesses: %d\nFailures: %d\nErrors: %d\n"
        i !successes !failures !errors
  | testcase::rest ->
      bprintf ob "Case #%d:\n" i;
      bprintf ob "  exp: %s\n" (fst testcase);
      begin try
        let (a, b) = eval_test testcase in
        let (buf2, buf1) = (Lexing.from_string a, Lexing.from_string b) in
        let exval1opt = ValueParser.toplevelvalue ValueLexer.main buf1 in
        let exval2opt = ValueParser.toplevelvalue ValueLexer.main buf2 in
          bprintf ob "  expected value: %s\n" (if b=";;" then "ERROR" else b);
          bprintf ob "  returned value: ";
          begin
            match exval2opt with
                None -> add_string ob "ERROR"
              | Some exval2 -> add_test_exval ob exval2
          end;
          add_string ob "\n";
          if match exval1opt, exval2opt with
              None, None -> true
            | Some ty1, Some ty2 -> ty1 ==/ ty2
            | _ -> false
          then begin incr successes; add_string ob " OK!!\n" end
          else begin incr failures; add_string ob " Fail!!\n" end;
      with Parsing.Parse_error ->
        bprintf ob "Parsing Error\n";
        begin incr errors; add_string ob " Error!!\n" end;
        | Failure("lexing: empty token") ->
            bprintf ob "Lexing Error\n";
            begin incr errors; add_string ob " Error!!\n" end
        | e ->
            bprintf ob "%s\n" (Printexc.to_string e);
            begin incr errors; add_string ob " Error!!\n" end
      end;
      test ob (i+1) rest

let testdata =
  let file = "solved.in" in
  let ic = open_in file in
  let rec read data =
    begin try
      let ex = input_line ic in
        begin try
          let testcase = List.assoc ex Testdata.table in
            read (data @ testcase)
        with Not_found -> read data end
    with End_of_file -> close_in ic; data end
  in read []

let () =
  let ob = Buffer.create 80 in
    test ob 0 testdata;
    if Array.length Sys.argv > 1
    then
      let oc = open_out Sys.argv.(1) in
        output_buffer oc ob;
        close_out oc
    else
      output_buffer stdout ob
