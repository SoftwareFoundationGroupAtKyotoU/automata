let ty_test (testcase : string) : Syntax.ty option =
  let buf = Lexing.from_string testcase in
  let rec ty_loop buf env : Syntax.ty option =
    let program = Parser.toplevel Lexer.main buf in
      begin
        match program with
          | Syntax.Exp exp -> begin
              try Some (snd (Typing.ty_exp env exp)) with _ -> None
            end
          | _ -> ty_loop buf (fst (Typing.ty_decl env program))
      end in
    ty_loop buf Testaux2.initial_tyenv
