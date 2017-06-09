This application requires that the target server be configured with a specific set of Server Roles and Server Features.  The accompanying text file contains a list of all of those requires Roles and Features; prior to proceeding with the other steps, make sure that all of these Roles and Features have been added to the target server, either using Control Panel, Server Manager, or PowerShell.

To see the list of currently installed features, from an elevated (Administrator) PowerShell prompt, run the command

	Get-WindowsOptionalFeature -Online | ? state -eq 'enabled' | select featurename | sort -Descending

NOTE: this app has been developed to run on Windows 10 and Windows 10 IoT; it has also been observed to run successfully on Windows Server 2012 R2 and higher.

Next, in Windows Control Panel, under Firewall, add a firewall exception (across all regions and domains) for TCP port 443.

Once the required components have been installed, under C:\inetpub, navigate to the wwwroot folder.

Into that folder, C:\inetpub\wwwroot, copy and paste all files within the GitHub IOT Demo folder https://github.com/AnnaPerry/IOTDemoVisualization/tree/master/IOT%20Demo/IOT%20Demo).  (Note: consult the screenshot "Files added to the wwwroot folder" to see what the wwwroot folder should look like after you've copied all of the required files).

As the next to last step, in the Windows IIS Manager application, select your Default Web Site and right-click on it to edit its bindings (see the included screenshot "Adding the HTTPS Binding to the Default Web Site" for details):

Add a new binding of type "https", select the Port to be 443, then below, as the SSL Certificate, select the "OSIsoft Self-Signed Certificate."

Leave all other options at their defaults, then click "OK".