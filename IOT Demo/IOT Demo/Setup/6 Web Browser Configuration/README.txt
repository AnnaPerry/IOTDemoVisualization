NOTE 1:

Sending accelerometer and gyro data requires running this application on a mobile device, and sending proximity and light sensor data requires using this application on a mobile device using the Mozilla Firefox web browser.
To download and install the Firefox web browser on an Android device, click https://play.google.com/store/apps/details?id=org.mozilla.firefox&hl=en; to do the same for an iOS device, click https://itunes.apple.com/us/app/firefox-web-browser/id989804926?mt=8.

NOTE 2:

This application requires that you add a certificate exception to trust the certificates used by the PI Web API AND by this custom app's web page. 

On the device where you'd like to visit this application, please visit the PI Web API endpoint.  That endpoint is listed on line 8 of the file "dataService.js", located in the App\Services folder.

For example, if line 8 is

	var _httpsPIWebAPIUrl = "https://pi4egdemo1/piwebapi/";

Then your PI Web API endpoint URL is "https://pi4egdemo1/piwebapi/".  Open that URL in a browser on your device.

Once at this site, confirm that you would like to add a certificate exception for the PI Web API in your device browser, then reload this application.  On a mobile device, the exception will persist for 7 days.

	To temporarily add this certificate exception for the Google Chrome web browser:
		After navigating to the PI Web API URL, after being notified that "Your connection is not private", click "Advanced", then "Proceed anyway."  
		Afterwards, re-launch the web application in your browser.

	To permanently add this certificate exception for the Google Chrome web browser:
		Open the PI Web API URL in Internet Explorer and follow the Internet Explorer-specific steps below.
		Afterwards, re-launch the web application in your browser.

	To permanenently add this certificate exception for the Mozilla Firefox web browser:
		After navigating to the PI Web API URL, after being notified that "This Connection is Untrusted", click "Add Exception...", then "Confirm Security Exception."
		Afterwards, re-launch the web application in your browser.

	To permanenently add this certificate exception for the Microsoft Internet Explorer web browser:
		After navigating to the PI Web API URL, after being notified that "There is a problem with this website's security certificate":
			Click the "Continue to this website (not recommended) link.".
			Click the certificate error icon in the address bar, then click the View Certificates link in the Untrusted Certificate window.
			In the Certificate window that appears, click Install Certificate.  
			In the Certificate Import Wizard that appears, click Next, then choose the Place all certificates in the following store option and click Browse.
			In the Select Certificate Store dialog box that appears, choose Trusted Root Certificate Authorities and click OK.
			Click Next, then click Finish.  
			A Security Warning message box should appear confirming the import was successful.  Click Yes.
			A Certificate Import Wizard message box should appear and confirm that the import was successful; click OK twice and close Internet Explorer.
			Afterwards, re-launch the web application in your browser.