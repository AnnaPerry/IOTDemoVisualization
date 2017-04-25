In order to use this application, you must set the PI Web API to a specific configuration.  The accompanying text file in this directory contains JSON configuration for the PI Web API; to apply these to your target system, launch the PI System Explorer client tool on your target PI System, and connect to your AF Server--specifically, to the PI AF Database named "Configuration".  Within that database, drill down through the PI AF Element tree to the "System Configuration" Element; it should be located under

OSIsoft
	|___ PI Web API
			|___ <your server name>
					|___ System Configuration <-------

Within this Element, you'll see a list of several PI AF Attributes that control the configuration of the PI Web API.  The JSON file that accompanies this Readme contains the correct values that you shoudl use for each of the PI AF Attributes in the System Configuration Element.  Once you've edited the AF Attributes in the System Configuration Element to match what you see in the accompanying JSON file, check in your changes, then restart the PI Web API Windows service.
