This application expects that the target PI AF Server has a specific PI AF Database installed on it.  To prepare your own target AF Server accordingly, using the PI System Explorer client tool, connect to your PI AF Server, and create a new PI AF Database by clicking File > Database, then clicking "New Database".  You need to give this new PI AF Database a specific name: name it 

	Asset Framework DB 1

After you've created this new, empty PI AF database, you will eventually import in the .xml file that accompanies this Readme, which will fill that AF Database with all of the needed Elements that this application expects.  First, though, you need to slightly edit the .xml file to refer to your own specific PI Server name; in a text editor, open the Asset Framework DB 1.xml file, and perform a find-replace to replace every instance of "localhost" in the file with the name of your PI Server.  After performing that find-replace, save the .xml file.

Finally, in PI System Explorer, in your new, empty PI AF Database named "Asset Framework DB 1", import in the .xml file by clicking File > Import from File, then in the "File" field, select the .xml file that you just edited and saved.  Leave all of the default check-boxes as they are, then click "OK".  

Note: during the import, you may notice an error while processing the Unit-of-Measure Database, stating that a particular unit of measure already exists in the Unit of Measure Database.  These messages can be safely ignored; simply click "Continue" to bypass them and proceed with the import.

Once the import is complete, the next step for you to do is to create all of the needed PI Points; in your new PI AF Database, right-click on the "Elements" root element, and click "Create or Update Data Reference".

Next, you'll hae to update permissions on a certain group of PI AF Elements, to allow the app to write to them.  Specifically, right-click on the AF Element named "zzz Data Generation", and select the "Security..." option.  In the "Items to Configure" pane, click to select the element "zzz Data Generation", then, under "Identities", click "World" to select the World identity, then, under the "Permissions for World" area, under the "Allow" column, click "All" to grant World all permissions for this element and its children.  Finally, under "Child Permissions", make sure that "Update child permissions for modified identities", then click "OK".

The next step is to start all PI AF Analyses that are running on thsi gateway; in PI System Explorer, under Management, select and start all Analyses.

As the last step, set up an Alias for your PI AF Server: add the alias "localhost".  To do this, in PI System Explorer, click File > Server Properties, then under "Aliases", click the yellow "Add Alias" button, and enter in the new alias name

	localhost

When finished, click "OK", then "OK" once more.  Congratulations; you're finished with the needed PI AF configuration!	