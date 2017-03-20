'use strict';
app.controller('arController', ['$scope', '$stateParams', '$interval', 'dataService', function ($scope, $stateParams, $interval, dataService) {

    var afTemplate = 'Phone Sensors Template';
    var attributeCategory = '*';

    $scope.init = function () {

        
        $scope.xRotation = 170;
        $scope.yRotation = 360;
        $scope.zRotation = 184;

        $scope.xPosition = 20;
        $scope.yPosition = 0;
        $scope.zPosition = 0;


        window.awe.init({
            device_type: awe.AUTO_DETECT_DEVICE_TYPE,
            settings: {
                container_id: 'container',
                default_camera_position: { x: 0, y: 0, z: 0 },
                default_lights: [
                  {
                      id: 'ambient_light',
                      type: 'ambient',
                      color: 0x666666
                  },
                  {
                      id: 'hemi',
                      type: 'hemisphere',
                      color: 0xCCCCCC,
                  },
                ],
            },
            ready: function () {
                var d = '?_=' + Date.now();

                awe.util.require([
                  {
                      capabilities: ['gum', 'webgl'],
                      files: [
                        // base libraries
                        ['Scripts/awe-standard-dependencies.js', 'Scripts/awe-standard.js' + d],
                        // plugin dependencies
                        ['Scripts/awe-jsartoolkit-dependencies.js', 'Scripts/StereoEffect.js', 'Scripts/VREffect.js'],
                        // plugins
                        ['Scripts/awe.marker_ar.js' + d, 'Scripts/awe.rendering_effects.js' + d]
                      ],
                      success: function () {

                          awe.setup_scene();

                          //document.getElementById("container").style.zIndex = 10;

                          awe.settings.update({ data: { value: 'ar' }, where: { id: 'view_mode' } })

                          /*
                            Binding a POI to a jsartoolkit marker is easy
                            - First add the awe-jsartoolkit-dependencies.js plugin (see above)
                            - Then select a marker image you'd like to use
                            - Then add the matching number as a suffix for your POI id (e.g. _64)
                            NOTE: See 64.png in this directory or https://github.com/kig/JSARToolKit/blob/master/demos/markers
                            This automatically binds your POI to that marker id - easy!
                          */



                          // real marker 
                          awe.pois.add({ id: 'jsartoolkit_marker_64', position: { x: 0, y: 0, z: 0 }, visible: true });

                          awe.projections.add({
                              id: 'marker_projection1',
                              // geometry: { shape: 'plane', width: 300, height: 225, widthSegments: 1, heightSegments: 1 },
                              geometry: { path: 'Images/pump.obj' },
                              position: { x: $scope.xPosition, y: $scope.yPosition, z: $scope.zPosition },
                              rotation: { x: $scope.xRotation, y: $scope.yRotation, z: $scope.zRotation },
                              scale: { x: 0.1, y: 0.1, z: 0.1 },
                              //material: { type: 'phong', color: 0xFFFFFF, transparent: true, alphaTest: 0.5 },
                              material: { path: 'Images/pump.mtl' },
                              texture: { path: 'Images/process_SDM-2.png' },
                              visible: true
                          }, { poi_id: 'jsartoolkit_marker_64' });



                          awe.plugins.view('render_effects').enable();
                          awe.plugins.view('jsartoolkit').enable();
                      },
                  },
                  {
                      capabilities: [],
                      success: function () {
                          document.body.innerHTML = '<p>Try this demo in the latest version of Chrome or Firefox on a PC or Android device</p>';
                      },
                  },
                ]);
            }
        });


    };


    var stop;
    $scope.$on('$destroy', function () {
        stopInt();
    });

    function stopInt() {
        if (angular.isDefined(stop)) {
            $interval.cancel(stop);
            stop = undefined;
        };

    };

    $scope.toggleAR = function () {
        if (awe) {
            //remove video stream, delete all projections
            //as a static picture


        } else {
            //start video strem
            //add projections

        }
    };

    $scope.sendDatatoPI = function() {


        stop = $interval(function () {
            var targetAsset = dataService.getTargetAsset($stateParams.assetName);

            dataService.sendDatatoPI(afTemplate, targetAsset, attributeCategory);

        }, 3000);
        


    };


}]);