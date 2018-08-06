
// ------------------------------------------------------------

// Specify the PI Web API endpoint URL, or (as shown below) allow it to be set automatically
var _httpsPIWebAPIUrl = "";

// Get the gateway name from the URL: everything after the first "//", before the first ":", before the first "/", and trim any "/" remaining
var HOST_NAME_FROM_URL = window.location.href
	.replace("http://", "")
	.replace("https://", "")
	.split(":", 1)[0]
	.split("/")[0]
	.replace("/", "");

// Computed PI Web API Base URL
//HOST_NAME_FROM_URL = "pi4egdemo7"; // Hard-coded; used for testing only!
var _httpsPIWebAPIUrl_fromURL = "https://" + HOST_NAME_FROM_URL + "/piwebapi/";
// Automatically try to add in the URL if it was left blank
if (_httpsPIWebAPIUrl == "") {
	_httpsPIWebAPIUrl = _httpsPIWebAPIUrl_fromURL;
}

// ------------------------------------------------------------

// Define a timeout for web requests
var WEB_REQUEST_MAX_TIMEOUT_SECONDS = 20;

// Specify how often should the visualizations be updated (how often new data should be requested from the PI System)
var DATA_REFRESH_INTERVAL_IN_MILLISECONDS = 5000;

// Specify how often sensor data should be read (and sent to the PI System)
var SENSOR_SAMPLE_RATE_IN_MILLISECONDS = 3000;

// ------------------------------------------------------------

// Specify the name of the default AF server
var DEFAULT_AF_SERVER = "localhost";

// Specify the default AF database; the default used by the demo is Asset Framework DB 1
var DEFAULT_AF_DATABASE = "Asset Framework DB 1";

// ------------------------------------------------------------

// Specify the name of the template used by assets that you would like to appear in the app; the default is "Asset Template"
var DEFAULT_AF_TEMPLATE = "Asset Template";

// Specify the name of the element category used by assets that you would like to appear in the app
var DEFAULT_AF_ELEMENT_CATEGORY = "Visible in app";

// Specify the attribute category for attributes of these elements that should appear in the table view
var SNAPSHOT_DATA_ATTRIBUTE_CATEGORY = "Snapshot";

// Specify the attribute category for attributes of these elements that should appear in the chart and bars view
var TIMESERIES_DATA_ATTRIBUTE_CATEGORY = "Timeseries";

// ------------------------------------------------------------

// Specify the name of the template used by the asset that you want to appear on the main screen of the app
var DEFAULT_TOP_LEVEL_ASSET_AF_TEMPLATE = "Top-Level Assets Template";

// Specify the name of the asset that you want to appear on the main screen of the app
var DEFAULT_TOP_LEVEL_ASSET_NAME = "Assets";

// Specify the attribute category used by the data items on that asset that you'd like to appear in the app
var DEFAULT_TOP_LEVEL_ASSET_ATTRIBUTE_CATEGORY = "KPIs and Rollups";

// Specify the name of the element category used by asset that you would like to appear on the home page of the app
var DEFAULT_TOP_LEVEL_ASSET_NAME_ELEMENT_CATEGORY = "Use on app home screen";

// ------------------------------------------------------------
