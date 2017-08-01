# IOTDemoVisualization

 ***********************************************************************
  DISCLAIMER:
 
  All sample code is provided by OSIsoft for illustrative purposes only.
  These examples have not been thoroughly tested under all conditions.
  OSIsoft provides no guarantee nor implies any reliability,
  serviceability, or function of these programs.
  ALL PROGRAMS CONTAINED HEREIN ARE PROVIDED TO YOU "AS IS"
  WITHOUT ANY WARRANTIES OF ANY KIND. ALL WARRANTIES INCLUDING
  THE IMPLIED WARRANTIES OF NON-INFRINGEMENT, MERCHANTABILITY
  AND FITNESS FOR A PARTICULAR PURPOSE ARE EXPRESSLY DISCLAIMED.
 ************************************************************************

## Requirements:

Operating System:
Windows 10

Software Prerequisites:
This demonstration can be installed by running the Install-EdgeGatewayDemo_RunAsAdministrator.ps1 PowerShell script as an Administrator (download it first, by itself, to the target gateway using this link: https://raw.githubusercontent.com/AnnaPerry/IOTDemoVisualization/master/Install-EdgeGatewayDemo_RunAsAdministrator.ps1); however, prior to running that installation script, three files must be downloaded from the OSIsoft Technical Support Web site (https://techsupport.osisoft.com/):

1. SQL Server 2016 SP1 Express edition. 
Download this kit and install it first; accept all defaults for a "Basic" installation.

2. PI AF Services (version 2017 SP1a or the most recent version). 
Install this second, and accept and install all components and defaults EXCEPT for PI Notifications, which you should not install.  After the installation completes, you'll be prompted to complete the PI Web API Configuration Utility; complete the utility using all of the default options.

3. PI Data Archive (version 2017 SP1 or the most recent version). 
Install this last; you'll need a license file to complete the installation (contact OSIsoft to obtain one).  During the installation, accept all of the default installation options.

After these three pieces of software have been successfully installed, Install-EdgeGatewayDemo_RunAsAdministrator.ps1 PowerShell script as an Administrator, which will download the rest of the needed files for this demonstration and properly configure the host PC.
