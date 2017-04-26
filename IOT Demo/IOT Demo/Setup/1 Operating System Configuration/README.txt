This application requires that the target server be configured with a specific set of Server Roles and Server Features.  The accompanying text file contains a list of all of those requires Roles and Features; prior to proceeding with the other steps, make sure that all of these Roles and Features have been added to the target server, either using Control Panel, Server Manager, or PowerShell.

To see the list of currently installed features, from an elevated (Administrator) PowerShell prompt, run the command

	Get-WindowsOptionalFeature -Online | ? state -eq 'enabled' | select featurename | sort -Descending

NOTE: this app has been developed to run on Windows 10 and Windows 10 IoT; it has also been observed to run successfully on Windows Server 2012 R2 and higher.

Next, in Windows Control Panel, under Firewall, add a firewall exception (across all regions and domains) for TCP port 82.

Once the required components have been installed, under C:\inetpub, create a new folder called "WebApp" in C:\inetpub to hold the files for this application.

Into that new folder, C:\inetpub\WebApp, copy and paste all files within the GitHub IOT Demo folder (https://github.com/AnnaPerry/IOTDemoVisualization/tree/master/IOT%20Demo/IOT%20Demo).

As the next to last step, in the Windows IIS Manager application, create a new Web Site named "WebApp" (see https://support.microsoft.com/en-us/help/323972/how-to-set-up-your-first-iis-web-site); in the "Add Website" dialog:

	Set the "Site name" to be "WebApp"
	
	Under "Content Directory", select the path to the folder that you just created, C:\inetpub\WebApp, as the folder that contains this Web Site's documents.

	Under the "Binding" section, select the binding type of "https", select the Port to be 82, then below, as the SSL Certificate, select the "OSIsoft Self-Signed Certificate."

	Leave all other options at their defaults, then click "OK" to create your site!