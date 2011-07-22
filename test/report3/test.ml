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

let rec test oc i = function
    [] ->
      fprintf oc "Total: %d\nSuccesses: %d\nFailures: %d\nErrors: %d\n"
        i !successes !failures !errors;
      exit 0
  | (a, b)::rest ->
    fprintf oc "Case #%d:\n" i;
    fprintf oc "  exp: %s\n" a;
    begin try
      let buf = Lexing.from_string b in
      let ty1 = TypeParser.topleveltype TypeLexer.main buf in
      let ty2 = Tytest.ty_test a in
        fprintf oc "  expected type: %s\n" (if b = ";;" then "ERROR" else b);
        fprintf oc "  inferred type: ";
        begin
          match ty2 with
              None -> output_string oc "ERROR"
            | Some ty2 -> Testaux2.output_ty oc ty2
        end;
        output_string oc "\n";
        if match ty1, ty2 with
            None, None -> true
          | Some ty1, Some ty2 -> ty1 ==/ ty2
          | _ -> false
        then begin incr successes; output_string oc " OK!!\n" end
        else begin incr failures; output_string oc " Fail!!\n" end;
    with Parsing.Parse_error ->
      fprintf oc "Parsing Error\n";
      begin incr errors; output_string oc " Error!!\n" end
      | Failure("lexing: empty token") ->
          fprintf oc "Lexing Error\n";
          begin incr errors; output_string oc " Error!!\n" end
      | e ->
          fprintf oc "%s\n" (Printexc.to_string e);
          begin incr errors; output_string oc " Error!!\n" end
    end;
    test oc (i+1) rest

let testdata = Testaux3.testdata
  @ !Testaux3.testdatalet @ !Testaux3.testdataletrec

let () =
  if Array.length Sys.argv > 1
  then
    let oc = open_out Sys.argv.(1) in
      test oc 0 testdata;
      close_out oc
  else
    test stdout 0 testdata
