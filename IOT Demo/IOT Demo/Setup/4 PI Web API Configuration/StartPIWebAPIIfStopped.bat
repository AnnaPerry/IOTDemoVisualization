
@ECHO OFF

FOR /F "tokens=3 delims=: " %%H IN ('SC QUERY "piwebapi" ^| FINDSTR "        STATE"') DO (

  IF /I "%%H" NEQ "RUNNING" (

   NET START "piwebapi"

  )

)
