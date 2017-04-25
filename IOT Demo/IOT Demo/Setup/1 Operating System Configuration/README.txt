This application requires that the target server be configured with a specific set of Server Roles and Server Features.  The accompanying text file contains a list of all of those requires Roles and Features; prior to proceeding with the other steps, make sure that all of these Roles and Features have been added to the target server, either using Control Panel, Server Manager, or PowerShell.

To see the list of currently installed features, from an elevated (Administrator) PowerShell prompt, run the command

	Get-WindowsOptionalFeature -Online | ? state -eq 'enabled' | select featurename | sort -Descending