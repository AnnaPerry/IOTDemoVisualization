The final step in configuring this application is to edit a single .js file to instruct this app on how to properly locate the PI Web API endpoint needed for it to retrieve data.

To specify this endpoing, look in the App\Services folder, and edit the file "dataService.js": specifically, edit line 8, which is where the variable __httpsPIWebAPIUrl is defined.  That line by default will look something like this:

	var _httpsPIWebAPIUrl = "https://pi4egdemo1/piwebapi/";

You should edit this line to refer to the PI Web API that was just installed on this new machine.  If that new PI Web API URL is "https://mynewgateway/piwebapi/", then you should edit the file line to be

	var _httpsPIWebAPIUrl = "https://mynewgateway/piwebapi/";

Once you've made this change to the file, save the file; from here, you should be all set to run the application!