(* Exs. 1 6 7 8 9 10 11 are tested*)
(* testdata9 and testdata10 is a special data.  Whether ex.9 is solved or not, testing data is prepared. *)

let testdatalet : (string * string) list ref = 
ref (List.map (fun (exp, mono, _) -> (exp, mono)) Testdata.testdata9)

let testdataletrec : (string * string) list ref = 
ref (List.map (fun (exp, mono, _) -> (exp, mono)) Testdata.testdata10)

let testdata = 
  let file = "solved.in" in
  let ic = open_in file in
  let rec f data = 
    (try 
      let str = input_line ic in
      let num =  int_of_string str in
      (match num with
      | 1 ->
          testdatalet := [];
          testdataletrec := [];
          f (data @ Testdata.testdata1)
      | 6 ->
          testdatalet := [];
          f (data @ Testdata.testdata6)
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
