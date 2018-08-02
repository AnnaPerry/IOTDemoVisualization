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

Minimum Hardware Specifications:

Dual-core processor, 2 GB RAM, 8 GB free disk space

Ideal Specifications:

Quad-core processor, 8 GB RAM, 16 GB free disk space, SSD storage

Software Prerequisites:

This demonstration can be installed by running the Install-EdgeGatewayDemo_RunAsAdministrator.ps1 PowerShell script as an Administrator (download it first, by itself, to the target gateway using this link: https://raw.githubusercontent.com/AnnaPerry/IOTDemoVisualization/master/Install-EdgeGatewayDemo_RunAsAdministrator.ps1); however, prior to running this installation script, the below PI System install kits must be downloaded from the OSIsoft Technical Support Web site (https://techsupport.osisoft.com/) (note: pay careful attention to the required software versions!):

1. SQL Server 2016 SP1 Express edition. 
Download this kit and install it first; accept all defaults for a "Basic" installation.

2. PI AF Services (at least version 2017 R2). 
Install this second, and accept and install all components and defaults EXCEPT for PI Notifications, which you should not install.  After the installation completes, you'll be prompted to complete the PI Web API Configuration Utility; complete the utility using all of the default options.

3. PI Data Archive (at least version 2017 R2). 
Install this next; you'll need a license file to complete the installation (contact OSIsoft to obtain one).  During the installation, accept all of the default installation options.

After these pieces of software have been successfully installed, run the Install-EdgeGatewayDemo_RunAsAdministrator.ps1 PowerShell script as an Administrator, which will download the rest of the needed files for this demonstration and properly configure the host PC.

NOTE: to modify this demonstration to work with a PI System that has a different AF Database name, different template, asset, and/or attribute category names, edit the file IOTDemoVisualization\IOT Demo\IOT Demo\App\Services\dataService.config.js such that the constants now reflect the correct names in your target PI System.

## For technical support related to this demonstration, email edgegatewaysupport@osisoft.com.

After the project has been downloaded for the first time, to update the gateway demo code to the most recent version, run the Install-EdgeGatewayDemo_RunAsAdministrator.ps1 PowerShell script as an Administrator to download and install the most recent version of the demo code from GitHub.
