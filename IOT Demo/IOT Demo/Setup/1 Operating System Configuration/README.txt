This application requires that the target server be configured with a specific set of Server Roles and Server Features.  The accompanying text file contains a list of all of those requires Roles and Features; prior to proceeding with the other steps, make sure that all of these Roles and Features have been added to the target server, either using Control Panel, Server Manager, or PowerShell.

To see the list of currently installed features, from an elevated (Administrator) PowerShell prompt, run the command

	Get-WindowsOptionalFeature -Online | ? state -eq 'enabled' | select featurename | sort -Descending

NOTE: this app has been developed to run on Windows 10 and Windows 10 IoT; it has also been observed to run successfully on Windows Server 2012 R2 and higher.

Once the required components have been installed, in the Windows IIS Manager application, create a new Web Site, and copy and paste all of the files for this application into the folder for that new Web Site.  Additionally, when configuring that Web Site in IIS Manager, make sure that it is configured with an HTTPS web binding, NOT a mere HTTP web binding, as the code used by this application requires running on an HTTPS site in order to properly read local sensor data values.