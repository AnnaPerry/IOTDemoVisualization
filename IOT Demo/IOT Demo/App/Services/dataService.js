'use strict';
angular.module('iotdemoApp')
.service('dataService', ['$http', '$q', '$window', function ($http, $q, $window) {
 
    // Constants for connecting to and querying the target AF database and AF server
    //var _afserver = 'localhost';
    //var _afdb = 'Asset Framework DB 1'; // The default is 'Asset Framework DB 1'; try changing this to 'DB 2' for phase 2!
    var _afserver = DEFAULT_AF_SERVER;
    var _afdb = DEFAULT_AF_DATABASE; // The default is 'Asset Framework DB 1'; try changing this to 'DB 2' for phase 2!
	var _afdbwebid = '';
    var _startTime = '*-2m';
    var _endTime = '*';
	var _interval = '1s';
	
	// Cache variables used to remember the results of recent queries
	var _cachedElements;
	var _cachedElementAttributes_timeSeriesCaterory;
	var _cachedElementAttributes_snapshotCategory;
	var _cachedElementAttributes_TopLevelKPISAsset;
	var _cachedElementNameFilter;
	var _cachedElementTemplate;
	var _cachedElementCategory;
	
	// Allow verbose debugging
	var ALLOW_VERBOSE_CONSOLE_OUTPUT = false;

    // ---------------------------------------------------------------------------------------------
    // ---------------------------------------------------------------------------------------------
    // Functions for interacting with the PI Web API to read and write data

	// Fired when an HTTP request returns an error!
	function respondToHTTPRequestError(response, attemptedTask) {
		// Hide the loading spinner
		document.getElementById("loadingSpinnerIcon").className = "fa fa-refresh fa-fw"; 
		// Set the modal body text to the error
		//console.log(response);
		var newModalText = "Error when " + attemptedTask + ".<br/>";
		if (response.data && response.data.Errors) {
			newModalText += "Error code " + response.status + ": " + response.data.Errors[0] + "<br/>";
		} else if (response.data) {
			newModalText += response.data;
		}
		// Append some instructions
		newModalText += "<br />Plese try refreshing this app. If this error reappears, please verify that the PI Web API Service is running, that the PI System is running, and that the target AF object exists.  If this error persists, please try restarting the PI Web API service.";
		// Write this text to the modal
		document.getElementById("errorMessageModalBodyText").innerHTML = newModalText;
		// Open the modal, but only if it's not already open!
		if (!$('#errorMessageModal').is(':visible')) {
			$("#errorMessageModal").modal();
		} else {
			console.log("Tried to open error modal, but it is already open.");
		}
	}
	
    // Returns the webId of a particular AF database, based on the hard-coded AF database name
    function getafdb() {
		if (_afdbwebid) {
			console.log("Using cached AF DB WebId...");
			//return _afdbwebid;
			var deferred = $q.defer();
			deferred.resolve(_afdbwebid);
			return deferred.promise;
			
		} else {
			var selectedFieldsParameters = "&selectedFields=WebId";
			var url = _httpsPIWebAPIUrl + 'assetdatabases?path=\\\\' + _afserver + '\\' + _afdb + selectedFieldsParameters;
			if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("----- OUTGOING REQUEST -----");
			if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("Requesting the WebId for the default AF Database (DB) via a request to " + url);
			return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(
				// If success!
				function (response) {
					if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("Response: ", response);
					_afdbwebid = response.data.WebId;
					if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("Found AF DB WebId: ", _afdbwebid);
					return response.data.WebId;
				}, 
				// If failure...
				function (response) {
					respondToHTTPRequestError(response, "first getting the target AF DB web ID");
					return null;
				}
			);
		}
    };

    // Returns a properly formatted query URL for asking for AF attributes within a particular database,
    // belonging to Elements with a certain name, template, and (if provided) a certain attribute category
    function buildElementAttributesUrl(elementTemplate, afElementCategory, elementNameFilter, attributeCategory, includeAttributeNameInQueryResults) {
		// By default, return just the Web Id
		var selectedFieldsParameters = '&selectedFields=Items.WebId';
		// Return the attribute name too, if desired
		if (includeAttributeNameInQueryResults) {
			selectedFieldsParameters += ';Items.Name';
		}
		// Start with the base query URL, which always includes the AF DB web ID and the element name
		var url = _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elementattributes?searchFullHierarchy=true' + '&elementNameFilter=' + elementNameFilter;
		// If the element template is included, append that as well
		if (elementTemplate && (elementTemplate != '')) {
			url += ('&elementTemplate=' + elementTemplate);
		}
		// If the element category is included, append that as well
		if (afElementCategory && (afElementCategory != '')) {
			url += ('&elementCategory=' + afElementCategory);
		}
		// If the attribute category is included, append that as well
		if (attributeCategory && (attributeCategory != '')) {
			url += ('&attributeCategory=' + attributeCategory);		
		} else {
			// If there is no category, then you must be writing to the PI System, in which case, you need both the attribute name and WebId too!
			//selectedFieldsParameters = selectedFieldsParameters + ';Items.Name';
		}
		// Add the selected fields parameters
		url = url + selectedFieldsParameters;
		return url;
    };

    // Returns a properly formatted multi-attribute URL given a URL prefix and a collection of additional attributes
    function constructUrl(url, attributes) {
		try {
			attributes.forEach(function (attribute) { url += 'webid=' + attribute.WebId + '&' });
		} catch (err) {
			console.log("An error occurred while appending attribute WebIds to URL: " + err.message);
		}
		// Remove the last character from the URL, which will be an extra '&'
        url = url.slice(0, -1);
        return url;
    };
	


	// Variable to for tracking if a page has loaded before
	var isFirstTimeThisPageHasLoadedFlag = true;
	
	//-----------------------------------------------------------------------------------------------------------------------------------
	//-----------------------------------------------------------------------------------------------------------------------------------
	
    // Functions and objects accessible by the service
	var methodsExposedByThisService = {
		// Tracks how often any given page loads
		isFirstTimeThisPageHasLoaded: function () {
            if (isFirstTimeThisPageHasLoadedFlag == true) {
				isFirstTimeThisPageHasLoadedFlag = false; 
				return true;
			} else {
				return false;
			}				
        },	
        // Get an array of elements within an AF database that match a particular element template or category
        getElements: function (elementTemplate, elementCategory) {
			console.log("Clearing cached element attributes...");
			// Since you have arrived back on the elements screen, delete the cached snapshot and time series attributes
			_cachedElementAttributes_timeSeriesCaterory = null;
			_cachedElementAttributes_snapshotCategory = null;
			_cachedElementNameFilter = null;
			_cachedElementTemplate = null;
			_cachedElementCategory = null;			
			
			// If the elements have already been found, return the cached list!
			if (_cachedElements != null) {
				console.log("Using cached elements list...");
				// Convert the cached variable into a promise, and return it
				var deferred = $q.defer();
				deferred.resolve(_cachedElements);
				return deferred.promise;
			} else { 
				// Ask for the web ID of the database (the cached value will be used if it exists), and next launch the query
				return getafdb().then(function (webid) {
					_afdbwebid = webid;
					if (_afdbwebid) {
						var selectedFieldsParameters = '&selectedFields=Items.Name;Items.Description';//;Items.WebId';
						// Build the URL; depending on whether the template or category was used, add that as a URL parameter
						var url = _httpsPIWebAPIUrl + 'assetdatabases/' + _afdbwebid + '/elements?searchFullHierarchy=true';
						if (elementTemplate != '') {
							url += ('&templateName=' + elementTemplate);
						}
						if (elementCategory != '') {
							url += ('&categoryName=' + elementCategory);
						}
						// Finally, add the suffix that specifies what parameters will be returned
						url += selectedFieldsParameters;
						if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("----- OUTGOING REQUEST -----");
						if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("Searching for AF Elements within the selected AF DB via a request to " + url);
						// Send the query, and return the results!						
						return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(
							// If success!
							function (response) { 
								if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("Response: ", response);
								// Save the element list!
								_cachedElements = response.data.Items;
								if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("Found Elements: ", _cachedElements);
								return response.data.Items;
							}, 
							// If failure...
							function (response) {
								respondToHTTPRequestError(response, "getting elements that match the desired name, template, and/or category");
								return [];
							}
						);
					} else {
						console.log("Unable to get elements; AFDB WebID is null!!");
						//respondToHTTPRequestError("", "looking up elements: AF DBV WebID is null");
						return [];
					}
				});
			}
        },
        // Get an array of element attributes
        getElementAttributes: function (elementTemplate, afElementCategory, elementNameFilter, attributeCategory, includeAttributeNameInQueryResults) {
			// Check if this a request for attributes for the top-level element, and if that element has already been queried
			if ((attributeCategory == DEFAULT_TOP_LEVEL_ASSET_ATTRIBUTE_CATEGORY) &&
			(_cachedElementAttributes_TopLevelKPISAsset != null) &&
			(elementNameFilter == DEFAULT_TOP_LEVEL_ASSET_NAME)) {
				console.log("Using cached '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'...");
				// Convert the cached variable into a promise, and return it
				var deferred = $q.defer();
				deferred.resolve(_cachedElementAttributes_TopLevelKPISAsset);
				return deferred.promise;

			// Check if the element is the same! Then see if the attributes have been saved and if so, return the corresponding cached attributes
			} else if ((attributeCategory == TIMESERIES_DATA_ATTRIBUTE_CATEGORY) &&
			(_cachedElementAttributes_timeSeriesCaterory != null) &&
			(elementTemplate == _cachedElementTemplate) && 
			(afElementCategory == _cachedElementCategory) && 
			(elementNameFilter == _cachedElementNameFilter)) {
				console.log("Using cached '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'...");
				// Convert the cached variable into a promise, and return it
				var deferred = $q.defer();
				deferred.resolve(_cachedElementAttributes_timeSeriesCaterory);
				return deferred.promise;	
			
			// Check if the element is the same! Then see if the attributes have been saved and if so, return the corresponding cached attribute				
			} else if ((attributeCategory == SNAPSHOT_DATA_ATTRIBUTE_CATEGORY) &&
			(_cachedElementAttributes_snapshotCategory != null) &&
			(elementTemplate == _cachedElementTemplate) && 
			(afElementCategory == _cachedElementCategory) && 
			(elementNameFilter == _cachedElementNameFilter)) {
				console.log("Using cached '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'...");
				// Convert the cached variable into a promise, and return it
				var deferred = $q.defer();
				deferred.resolve(_cachedElementAttributes_snapshotCategory);
				return deferred.promise;	
			
			// At this point, the element name matched, but either the cached attributes were null or the attribute category didn't match
			} else {
				// Ask for the web ID of the database (the cached value will be used if it exists), and next launch the query
				return getafdb().then(function (webid) {
					_afdbwebid = webid;
					if (_afdbwebid) {
						var url = buildElementAttributesUrl(elementTemplate, afElementCategory, elementNameFilter, attributeCategory, includeAttributeNameInQueryResults);
						if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("----- OUTGOING REQUEST -----");
						if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("Searching for AF Element Attributes for the selected AF Element via a request to " + url);
						return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(
							// If success!
							function (response) {
								if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("Response: ", response);
								//console.log(attributeCategory, elementNameFilter, includeAttributeNameInQueryResults);
								// Save the attributes and element name filter for future reference!
								if ((attributeCategory == DEFAULT_TOP_LEVEL_ASSET_ATTRIBUTE_CATEGORY) &&
								(elementTemplate == DEFAULT_TOP_LEVEL_ASSET_AF_TEMPLATE) &&
								(afElementCategory == DEFAULT_TOP_LEVEL_ASSET_NAME_ELEMENT_CATEGORY)) {
									console.log("Caching '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'.");
									_cachedElementAttributes_TopLevelKPISAsset = response.data.Items;
								} else {
									// Depending on if it's a time series or snapshot query, save that in the appropriate global var
									if (attributeCategory == TIMESERIES_DATA_ATTRIBUTE_CATEGORY) {
										console.log("Caching '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'.");
										_cachedElementNameFilter = elementNameFilter;
										_cachedElementAttributes_timeSeriesCaterory = response.data.Items;
										_cachedElementTemplate = elementTemplate;
										_cachedElementCategory = afElementCategory;
									} else if (attributeCategory == SNAPSHOT_DATA_ATTRIBUTE_CATEGORY) {
										console.log("Caching '" + attributeCategory + "' attributes for element '" + elementNameFilter + "'.");
										_cachedElementNameFilter = elementNameFilter;
										_cachedElementAttributes_snapshotCategory = response.data.Items;
										_cachedElementTemplate = elementTemplate;
										_cachedElementCategory = afElementCategory;
									}
								}
								if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("Found Element Attributes: ", response.data.Items);
								return response.data.Items;
							}, 
							// If failure...
							function (response) {
								respondToHTTPRequestError(response, "getting element attribute web IDs");
								return null;
							}
						);
					} else {
						console.log("Error looking up Web Id for AF DB!");
						//respondToHTTPRequestError("", "looking up Web Id for AF DB!");
						return null;
					}
				});
			}
        },
        // Return an array of snapshot values, based on an array of attributes to query
        getSnapshots: function (attributes) {
			if (attributes) {
				var selectedFieldsParameters = '?selectedFields=Items.Name;Items.Value.Value;Items.Value.UnitsAbbreviation';
				var url = constructUrl(_httpsPIWebAPIUrl + '/streamsets/value' + selectedFieldsParameters + '&', attributes);
				if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("----- OUTGOING REQUEST -----");
				if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("Getting snapshot (most recent) values for the Attributes for the selected Element via a request to " + url);
				return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(
					// If success!
					function (response) {
						if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("Response (values): ", response);
						return response;
					}, 
					// If failure...
					function (response) {
						respondToHTTPRequestError(response, "requesting snapshot data");
						return [];
					}
				);  
			} else {
				console.log("Error getting snapshots: attribute webIDs are null!");
				//respondToHTTPRequestError("", "getting snapshot values: attribute webIDs are null");
				return [];
			}			
        },
        // Return an array of arrays of interpolated values for a certain array of attributes
        getInterpolatedValues : function (attributes, interval_seconds, duration_minutes) {
			if (attributes) {
				var selectedFieldsParameters = '?selectedFields=Items.Name;Items.Items.Value;Items.Items.Timestamp;Items.Items.UnitsAbbreviation';
				var url = constructUrl(_httpsPIWebAPIUrl + '/streamsets/interpolated' + selectedFieldsParameters + '&startTime=' + "*-" + duration_minutes + "m" + '&endTime=' + _endTime + '&interval=' + interval_seconds + "s" + '&', attributes);
				if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("----- OUTGOING REQUEST -----");
				if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("Getting a range of interpolated values for the Attributes for the selected Element via a request to " + url);
				return $http.get(url, {timeout: WEB_REQUEST_MAX_TIMEOUT_SECONDS*1000}).then(
					// If success!
					function (response) {
						if (ALLOW_VERBOSE_CONSOLE_OUTPUT) console.log("Response (values): ", response);
						return response;
					}, 
					// If failure...
					function (response) {
						respondToHTTPRequestError(response, "requesting interpolated data");
						return [];
					}
				);   
			} else {
				console.log("Error getting interpolated values: attribute webIDs are null!");
				//respondToHTTPRequestError("", "getting interpolated values: attribute webIDs are null");
				return [];
			}				
        }
   };
   return methodsExposedByThisService;
}]);