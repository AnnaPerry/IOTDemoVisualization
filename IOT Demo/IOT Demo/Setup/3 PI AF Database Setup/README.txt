This application expects that the target PI AF Server has a specific PI AF Database installed on it.  To prepare your own target AF Server accordingly, using the PI System Explorer client tool, connect to your PI AF Server, and create a new PI AF Database by clicking File > Database, then clicking "New Database".  You need to give this new PI AF Database a specific name: name it 

	Asset Framework DB 1

After you've created this new, empty PI AF database, you will eventually import in the .xml file that accompanies this Readme, which will fill that AF Database with all of the needed Elements that this application expects.  First, though, you need to slightly edit the .xml file to refer to your own specific PI Server name; in a text editor, open the Asset Framework DB 1.xml file, and perform a find-replace to replace every instance of "localhost" in the file with the name of your PI Server.  After performing that find-replace, save the .xml file.

Finally, in PI System Explorer, in your new, empty PI AF Database named "Asset Framework DB 1", import in the .xml file by clicking File > Import from File, then in the "File" field, select the .xml file that you just edited and saved.  Leave all of the default check-boxes as they are, then click "OK".  

Once the import is complete, the last step for you to do is to create all of the needed PI Points; in your new PI AF Database, right-click on the "Elements" root element, and click "Create or Update Data Reference".

As the last step, set up an Alias for your PI AF Server: add the alias "localhost".  To do this, in PI System Explorer, click File > Server Properties, then under "Aliases", click the yellow "Add Alias" button, and enter in the new alias name

	localhost

When finished, click "OK", then "OK" once more.  Congratulations; you're finished with the needed PI AF configuration!	