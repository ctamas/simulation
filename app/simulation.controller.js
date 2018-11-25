(function() {
    'use strict';

    angular
        .module('simulationApp')
        .controller('SimulationController', SimulationController);

    SimulationController.$inject = ['$scope', '$q', 'NNService', '$timeout'];

    function SimulationController ($scope, $q, NNService, $timeout) {

        var vm = this;

        vm.consoleOut = "";
        vm.collisionAlert = false;
        vm.start = start;
        vm.stop = stop;
        vm.reset = reset;
        vm.init = init;
        vm.handleFindOptimum = handleFindOptimum;
        vm.clearScenario = clearScenario;
        vm.click = click;
        vm.changeNNPreview = changeNNPreview;
        vm.changeScenario = changeScenario;
        vm.updateRainDirt = updateRainDirt;
        vm.selectedScenarioNumber = 0;
        vm.trainingSet = [];
        vm.previewImages = [];
        vm.exampleObjects = [];
        vm.selectedVelocity;
        vm.currentVelocity = 90;
        vm.selectedType;
        vm.status;
        vm.runtime = 30;
        vm.frameTime = 300;
        vm.hiddenNeuron = 12;
        vm.connectionCount = 18;
        vm.trainingRate = 0.1;
        vm.errorRate = 0.01;
        vm.optimum = {hiddenCount: 0, iterations: 30000};
        vm.stopped;
        vm.smallImage = [];
        vm.rainDirt = false;
        vm.canvHeight = 800;
        vm.canvWidth = 640;
        vm.netView = convert1dTo2dArray(new Array(vm.canvWidth / 16 * vm.canvHeight / 16).fill(1), 40);
        vm.netView[0][0] = 0;
        var canv = document.getElementById('rcanvas');
        var ctx = canv.getContext('2d');
        var carLength = 160;
        var carWidth = 80;
        var laneOffset = 160;
        var laneMiddle = 40;
        var carOffset = 160;
        var bikeOffset = 160;
        var truckOffset = 160;
        var roadLines = -100;
        vm.scenarios = [
                           [
                               {lane: 0, yPosition: 0, velocity: 3, type: 'truckBlack'},
                               {lane: 0, yPosition: 500, velocity: 3, type: 'bikeBlack'},
                               {lane: 1, yPosition: 400, velocity: 0, type: 'carBlue'},
                               {lane: 1, yPosition: 0, velocity: 1, type: 'carBlack'},
                               {lane: 1, yPosition: 700, velocity: -2, type: 'truckBlack'},
                               {lane: 2, yPosition: 500, velocity: -2, type: 'carBlack'},
                               {lane: 3, yPosition: 50, type: 'sign110'}
                           ],
                           [
                               {lane: 0, yPosition: 0, velocity: 1, type: 'truckBlack'},
                               {lane: 0, yPosition: 500, velocity: -2, type: 'carBlack'},
                               {lane: 1, yPosition: 400, velocity: 0, type: 'carBlue'},
                               {lane: 1, yPosition: 50, velocity: 3, type: 'carBlack'},
                               {lane: 1, yPosition: 700, velocity: 1, type: 'carBlack'},
                               {lane: 2, yPosition: 200, velocity: -2, type: 'bikeBlack'},
                               {lane: 3, yPosition: 30, type: 'sign70'}
                           ],
                           [
                               {lane: 0, yPosition: 0, velocity: 2, type: 'truckBlack'},
                               {lane: 0, yPosition: 500, velocity: -1, type: 'carBlack'},
                               {lane: 1, yPosition: 400, velocity: 0, type: 'carBlue'},
                               {lane: 1, yPosition: 120, velocity: 1, type: 'bikeBlack'},
                               {lane: 2, yPosition: 200, velocity: 2, type: 'carBlack'},
                               {lane: 1, yPosition: 700, velocity: -2, type: 'truckBlack'},
                               {lane: 3, yPosition: 50, type: 'sign70'},
                               {lane: 3, yPosition: 210, type: 'sign110'}
                           ],
                           [
                               {lane: 0, yPosition: 0, velocity: 1, type: 'truckBlack'},
                               {lane: 0, yPosition: 500, velocity: -2, type: 'bikeBlack'},
                               {lane: 1, yPosition: 400, velocity: 0, type: 'carBlue'},
                               {lane: 1, yPosition: 50, velocity: 3, type: 'carBlack'},
                               {lane: 1, yPosition: 620, velocity: -1, type: 'carBlack'},
                               {lane: 2, yPosition: 220, velocity: -2, type: 'carBlack'},
                               {lane: 3, yPosition: 80, type: 'sign90'},
                               {lane: 3, yPosition: 240, type: 'sign70'}
                           ],
                           [
                               {lane: 0, yPosition: 680, velocity: -1, type: 'carBlack'},
                               {lane: 1, yPosition: 400, velocity: 0, type: 'carBlue'},
                               {lane: 1, yPosition: 50, velocity: 2, type: 'carBlack'},
                               {lane: 1, yPosition: 700, velocity: -2, type: 'carBlack'},
                               {lane: 2, yPosition: 200, velocity: -1, type: 'bikeBlack'},
                               {lane: 2, yPosition: 420, velocity: -1, type: 'bikeBlack'},
                               {lane: 3, yPosition: 30, type: 'sign110'},
                               {lane: 3, yPosition: 230, type: 'sign70'}
                           ]
                       ];
        // Readable names are needed for dropdown list labels.
        // These items are drawn on canvas at start, converted to matrix image, then taught to NN.
        vm.exampleObjects = [
                               {lane: 0, yPosition: 0, type: 'carBlack', readableName: 'Car'},
                               {lane: 1, yPosition: 0, type: 'bikeBlack', readableName: 'Bike'},
                               {lane: 2, yPosition: 0, type: 'truckBlack', readableName: 'Truck'},
                               {lane: 3, yPosition: 0, type: 'sign110', readableName: '110 Km/h sign'},
                               {lane: 3, yPosition: 200, type: 'sign90', readableName: '90 Km/h sign'},
                               {lane: 3, yPosition: 400, type: 'sign70', readableName: '70 Km/h sign'}
                               ];
        vm.selectableVelocities = [
                             {value: -3, readableName: 'Fastest'},
                             {value: -2, readableName: 'Faster'},
                             {value: -1, readableName: 'Fast'},
                             {value: 0, readableName: 'Normal'},
                             {value: 1, readableName: 'Slow'},
                             {value: 2, readableName: 'Slower'},
                             {value: 3, readableName: 'Slowest'},
                             ];
        vm.selectableNetworkTypes = ['Perceptron', 'Stochastic', 'Liquid State Machine', 'Hopfield'];
        canv.oncontextmenu = function(evt) {
            rightClick(evt);
            return false;
        }
        cacheImages().then(function(){
        init();
        });

        function init () {
            clearCanvas()
            vm.consoleOut = 'Error rate: ' + vm.errorRate + ', hidden nodes: ' + vm.hiddenNeuron + '\n\n' + vm.consoleOut;
            if (vm.selectedNetworkType == 'Liquid State Machine') {
                vm.consoleOut = 'Connections: ' + vm.connectionCount + '\n' + vm.consoleOut;
                
            }
            vm.consoleOut = 'Initializing network: ' + vm.selectedNetworkType + '\n' + vm.consoleOut;
            vm.smallImage = convert1dTo2dArray(new Array(50).fill(1), 5);
            vm.selectedScenario = vm.scenarios[vm.selectedScenarioNumber];
            vm.scenarioObjects = angular.copy(vm.selectedScenario);
            NNService.initNetwork(vm.selectedNetworkType, 50, vm.hiddenNeuron, vm.exampleObjects.length, vm.connectionCount);
            train().then(function() {
                drawObjects();
            });
        }

        // Collecting images to train NN with.
        function getTrainingImages (objects) {
            vm.previewImages = [];
            objects.forEach(function(object) {
                vm.previewImages.push(canvasImageSelectionToDotMatrix(ctx, object.lane, object.yPosition));
            });
        }

        function train () {
            var q = $q.defer();
            vm.status = 'Training network';
            drawTrainerObjects().then(function() {
                getTrainingImages(vm.exampleObjects);
                var t0 = performance.now();
                NNService.trainNetwork(vm.previewImages, vm.trainingRate, vm.errorRate).then(function (result) {
                    var t1 = performance.now();
                    vm.previewImages = result.trainingImages;
                    vm.trainingErrors = result.trainingErrors;
                    vm.consoleOut = 'Training done in ' + (t1 - t0).toFixed(2) + ' milliseconds.\nIterations needed: ' + vm.trainingErrors.length + '\n\n' + vm.consoleOut;
                    // Start an update cycle to show status.
                    $timeout(function() {
                        // Anything you want can go here and will safely be run on the next digest.
                        vm.status = 'Standby';
                    })
                });
                q.resolve();
            });
            return q.promise;

            function drawTrainerObjects () {
                return drawObjects(vm.exampleObjects);
            }
        }

        function start() {
            vm.currentVelocity = 90;
            // Frame time in milliseconds, increase this if computer has trouble keeping up with game loop.
            vm.status = 'Running...';
            vm.stopped = false;
            vm.collisionAlert = false;
            for(var i = 0; i <= (vm.runtime * (1 / (vm.frameTime / 1000))); i++){
                (function(i){
                    setTimeout(function(){
                        if (!vm.collisionAlert && !vm.stopped) {
                        gameLoop()
                        }
                    }, vm.frameTime * i);
                }(i));
            }
        }

        function handleFindOptimum() {
                	console.log(findOptimum(), 'vm.optimum')            
        }

        function findOptimum() {
            vm.consoleOut = '\nHidden nodes: ' + '\n';
            vm.consoleOut = 'Error rate: ' + '\n' + vm.errorRate + vm.consoleOut;
            if (vm.selectedNetworkType == 'Liquid State Machine') {
                vm.consoleOut = ', Connections: ' + vm.connectionCount + '\n';
            }
            vm.consoleOut = 'Finding optimal hidden node count network for network: ' + vm.selectedNetworkType + '\n' + vm.consoleOut;
            var objectArray = [6, 8, 8, 10, 12, 14, 16, 18, 20, 22, 24];
            var promises = [];
            vm.optimum = {hiddenCount: 0, iterations: 30000};
            var promises = objectArray.forEach(function(object) {
                    return testNetwork(object);
                });
            return $q.all(promises);
            function testNetwork (hiddenNeurons) {
                NNService.initNetwork(vm.selectedNetworkType, 50, hiddenNeurons, vm.exampleObjects.length, vm.connectionCount);
                var t0 = performance.now();
                NNService.trainNetwork(vm.previewImages, vm.trainingRate, vm.errorRate).then(function (result) {
                    var t1 = performance.now();
                    vm.previewImages = result.trainingImages;
                    vm.trainingErrors = result.trainingErrors;
                    if (vm.optimum.iterations > result.trainingErrors.length) {
                    	vm.optimum.iterations = result.trainingErrors.length;
                    	vm.hiddenNeuron = hiddenNeurons;
                    }
                    vm.consoleOut = '' + hiddenNeurons + vm.consoleOut + '\n';
                	vm.consoleOut = 'Training done in ' + (t1 - t0).toFixed(2) + ' milliseconds.\nIterations needed: ' + vm.trainingErrors.length + '\n\n' + vm.consoleOut + '\n';
                    $timeout(function() {
                    });
                });
            }
        }

        function click(evt) {
            var placeLane = Math.floor(evt.offsetX / 160);
            var car = {lane: placeLane, yPosition: evt.offsetY, velocity: parseInt(vm.selectedVelocity, 10), type: vm.selectedType};
            var isBlocked;
            // Detect if placement location is blocked by existing object, while dealing with different length of object types.
            vm.scenarioObjects.forEach(function(object) {
                if (object.lane == placeLane && (evt.offsetY > object.yPosition - getObjectLength(vm.selectedType) && evt.offsetY < object.yPosition + getObjectLength(object.type))) {
                    isBlocked = true;    
                }
            });
            if (!isBlocked && vm.selectedType && ((placeLane < 3 && vm.selectedVelocity && vm.selectedType.indexOf('sign') < 0) || (placeLane == 3 && vm.selectedType.indexOf('sign') >= 0))) {
                vm.scenarioObjects.push(car);
                drawObjects();
            } else if (vm.selectedType && placeLane < 3 && vm.selectedType.indexOf('sign') >= 0){
                alert("Road signs can only be placed on road side!");
            } else if (!isBlocked && !vm.selectedVelocity || !vm.selectedType){
                alert("Select velocity and element type!");
            } else if (placeLane == 3 && vm.selectedType.indexOf('sign') < 0){
                alert("Only road signs can be place on road side!");
            } else {
                alert("Already an element at the location!");
            }
        }

        function rightClick(evt) {
            var placeLane = Math.floor(evt.offsetX / 160);
            var isBlocked;
            // Detect if click location is occupied by existing object, while dealing with different length of object types, remove if present.
            vm.scenarioObjects.forEach(function(object, index) {
                if (object.lane == placeLane && (evt.offsetY > object.yPosition && evt.offsetY < object.yPosition + getObjectLength(object.type))) {
                    vm.scenarioObjects.splice(index, 1);
                }
            });
            drawObjects();
        }

        function updateRainDirt(dirt) {
            // Functionality and state tied to ng-model, this call only updates canvas.
            drawObjects();
        }

        function changeNNPreview(selected) {
            // Find preview by type name.
            var images = angular.copy(vm.previewImages);
            vm.exampleObjects.forEach(function(object, index) {
                if (selected == object.type) {
                    vm.smallImage = convert1dTo2dArray(images[index], 5);
                }
            });
        }

        function changeScenario() {
            vm.stopped = true;
            vm.collisionAlert = false;
            // Both selected and objects variables have to be updated to keep changed scenario after start/reset/stop.
            vm.selectedScenario = vm.scenarios[vm.selectedScenarioNumber];
            vm.scenarioObjects = angular.copy(vm.selectedScenario);
            drawObjects();
        }

        function stop() {
            vm.scenarioObjects = angular.copy(vm.selectedScenario);
            vm.stopped = true;
            vm.collisionAlert = false;
            vm.status = 'Standby';
        }

        function reset() {
            vm.collisionAlert = false;
            vm.scenarioObjects = angular.copy(vm.selectedScenario);
            drawObjects();
        }

        function clearScenario() {
            vm.collisionAlert = false;
            vm.scenarioObjects = [
                {lane: 1, yPosition: 400, velocity: 0, type: 'carBlue'},
            ];
            drawObjects();
        }

        function clearCanvas() {
            ctx.clearRect(0, 0, 640, 800);
        }

        function setCollisionAlert(collisionType) {
            vm.stopped = true;
            vm.collisionAlert = collisionType;
            vm.status = 'Standby';
        }

        function drawObjects (objects) {
            clearCanvas();
            if (vm.rainDirt) {
                drawRainDirt();
            }
            var objectArray = objects || vm.scenarioObjects;
            var promises = [];

            var promises = objectArray.map(function(object) {
                    return drawObject(object);
                });
            return $q.all(promises);
        }

        function gameLoop () {
            advanceLines();
            advanceObjects();
            drawLines();
            drawObjects().then(function() {
                mapObjects();
            });


            function mapObjects () {
                /* Forward detection: watching for speed difference where closest car ahead is slower and comes inside warning range.
                * Rear detection: watching for speed difference where closest car behind is faster and comes inside warning range. */
                var detectedObjects = angular.copy(detectObjects());
                var mappedLanes = [
                                   {lane: 0, front: {distance: 2000}, rear: {distance: 2000}},
                                   {lane: 1, front: {distance: 2000}, rear: {distance: 2000}},
                                   {lane: 2, front: {distance: 2000}, rear: {distance: 2000}},
                                   {lane: 3, front: {distance: 2000}, rear: {distance: 2000}}
                               ];
                for (var i = 0; i < 4; i++) {
                    getObjectDistances(i);
                }
                detectCollision();
                // Detect collision between foreign objects and remove colliding objects.
                detectInternalCollision(vm.scenarioObjects);
                detectSpeedLimit();
                function getObjectDistances (lane) {
                    // Map detected objects and create data structure of the area.
                    // Get closest front and rear cars in selected lane.
                    var ownCarYposition = 400;
                    detectedObjects.forEach(function(object) {
                        if (object.lane == lane) {
                            // Handle detected car next to ours, consider side blocked
                            if ((object.yPosition + getObjectLength(object.type) > ownCarYposition) && (object.yPosition < ownCarYposition + carLength) && object.lane != 3) {
                                mappedLanes[lane].front.distance = 0;
                                mappedLanes[lane].rear.distance = 0;
                                mappedLanes[lane].front.type = object.type;
                                mappedLanes[lane].rear.type = object.type;
                            }
                            // Handle detected car in front of ours
                            else if (object.yPosition <= ownCarYposition) {
                                mappedLanes[lane].front.distance = ownCarYposition - (object.yPosition + getObjectLength(object.type));
                                mappedLanes[lane].front.type = object.type;
                           }
                           // Handle detected car in behind ours
                           else if (object.yPosition > ownCarYposition) {
                                mappedLanes[lane].rear.distance = Math.abs((ownCarYposition + 160) - object.yPosition);
                                mappedLanes[lane].rear.type = object.type;
                           }
                        }
                    });
                }
                function detectCollision () {
                    /* Detect if collision would happen in current course.
                     * Forward detection: watching closest car ahead coming inside warning range.
                     * Rear detection: watching closest car behind coming inside warning range. */
                    if (mappedLanes[1].rear.distance < 30) {
                        setCollisionAlert('Rear collision');
                        showEscapePath()
                    }
                    else if (mappedLanes[1].front.distance < 30) {
                        setCollisionAlert('Front collision');
                        showEscapePath()
                    }

                    function showEscapePath () {
                        if (mappedLanes[1].rear.distance > 120) {
                            drawArrow(5);
                            alert(vm.collisionAlert + ' alert!\nRear space clear, breaking to avoid impact.');
                        }
                        else if (mappedLanes[1].front.distance > 120) {
                            drawArrow(1);
                            alert(vm.collisionAlert + ' alert!\nFront space clear, accelerating to avoid impact.');
                        }
                        else if (mappedLanes[2].rear.distance > 100 && mappedLanes[2].front.distance > 100) {
                            drawArrow(3);
                            alert(vm.collisionAlert + ' alert!\nRight lane clear, switching to avoid impact.');
                        } 
                        else if (mappedLanes[0].rear.distance > 100 && mappedLanes[0].front.distance > 100) {
                            drawArrow(7);
                            alert(vm.collisionAlert + ' alert!\nLeft lane clear, switching to avoid impact.');
                        }
                        else if (mappedLanes[2].rear.distance > 120 && mappedLanes[2].front.distance > 50) {
                            drawArrow(4);
                            alert(vm.collisionAlert + ' alert!\nRight lane clear, switching and slowing to avoid impact.');
                        }
                        else if (mappedLanes[2].rear.distance > 50 &&  mappedLanes[2].front.distance > 120) {
                            drawArrow(2);
                            alert(vm.collisionAlert + ' alert!\nRight lane clear, switching and accelerating to avoid impact.');
                        }
                        else if (mappedLanes[0].rear.distance > 120 && mappedLanes[0].front.distance > 50) {
                            drawArrow(6);
                            alert(vm.collisionAlert + ' alert!\nLeft lane clear, switching and slowing to avoid impact.');
                        }
                        else if (mappedLanes[0].rear.distance > 50 &&  mappedLanes[0].front.distance > 120) {
                            drawArrow(8);
                            alert(vm.collisionAlert + ' alert!\nLeft lane clear, switching and accelerating to avoid impact.');
                        }
                        else {
                            alert(vm.collisionAlert + ' alert!\nNo valid evasion moves avalible!');
                        }
                    }
                }

                // Remove one element if they occupy the same space.
                function detectInternalCollision (objects) {
                    objects.forEach(function(outerObject) {
                        objects.forEach(function(object, index) {
                            if (outerObject.yPosition != object.yPosition && object.lane == outerObject.lane && (outerObject.yPosition > object.yPosition - getObjectLength(outerObject.type) && outerObject.yPosition < object.yPosition + getObjectLength(object.type))) {
                                alert('Scenario element collision! Removing object!');
                                objects.splice(index);
                            }
                        });
                    });
                }

                function detectSpeedLimit () {
                    // Read only speed of sign close and in front.
                    if (mappedLanes[3].front.distance < 30 && mappedLanes[3].front.distance > 10 && vm.currentVelocity != mappedLanes[3].front.type.slice(4)) {
                        vm.currentVelocity = mappedLanes[3].front.type.slice(4);
                    }
                }
            }

            function advanceObjects () {
                vm.scenarioObjects.forEach(function(object) {
                    // Signs advance faster because of absolute velocity.
                    if (object.type.indexOf('sign') >= 0) {
                        object.yPosition = object.yPosition + vm.currentVelocity * 0.14;
                    } else {
                        object.yPosition = object.yPosition + object.velocity;
                    }
                });
            }

            function advanceLines () {
                if (roadLines <= 0) {
                    roadLines = roadLines + (vm.currentVelocity * 0.14);
                } else {
                    roadLines = - 75;
                }
            }

            function detectObjects () {
                var detected;
                var objects = [];
                var objectType;
                var confidenceFactor = 0.97;
                for (var lane = 0; lane < 4; lane ++) {
                    for (var yPosition = 0; yPosition < 632; yPosition += 3) {
                        // Skip detecting our own car.
                        if (lane == 1 && yPosition == 400) {
                            yPosition += carLength;
                        }
                        var netOutput = NNService.activateNetwork(canvasImageSelectionToDotMatrix(ctx, lane, yPosition));
                        if(netOutput[0] > confidenceFactor) {
                            objectType = 'carBlack';
                            objects.push({lane: lane, yPosition: yPosition, type: objectType});
                            yPosition += getObjectLength(objectType);
                            updateNNPreview(yPosition, lane, objectType);
                        }
                        else if(netOutput[1] > confidenceFactor) {
                            objectType = 'bikeBlack';
                            objects.push({lane: lane, yPosition: yPosition, type: objectType});
                            yPosition += getObjectLength(objectType);
                            updateNNPreview(yPosition, lane, objectType);
                        }
                        else if(netOutput[2] > confidenceFactor) {
                            objectType = 'truckBlack';
                            objects.push({lane: lane, yPosition: yPosition, type: objectType});
                            yPosition += getObjectLength(objectType);
                            updateNNPreview(yPosition, lane, objectType);
                        }
                        else if(netOutput[3] > confidenceFactor) {
                            objectType = 'sign110';
                            objects.push({lane: lane, yPosition: yPosition, type: objectType});
                            yPosition += getObjectLength(objectType);
                            updateNNPreview(yPosition, lane, objectType);
                        }
                        else if(netOutput[4] > confidenceFactor) {
                            objectType = 'sign90';
                            objects.push({lane: lane, yPosition: yPosition, type: objectType});
                            yPosition += getObjectLength(objectType);
                            updateNNPreview(yPosition, lane, objectType);
                        }
                        else if(netOutput[5] > confidenceFactor) {
                            objectType = 'sign70';
                            objects.push({lane: lane, yPosition: yPosition, type: objectType});
                            yPosition += getObjectLength(objectType);
                            updateNNPreview(yPosition, lane, objectType);
                        }
                    }
                }
                return objects;
            }

            function drawLines() {
                // Direction is given as a number that represents the 8 directions clockwise. 1 for north, 2 for northeast ect..
                var myImageUrl = 'content/images/roadLines.png';
                var myImage = new Image();
                myImage.src = myImageUrl;
                myImage.onload = function(){
                    ctx.drawImage(myImage, 158, roadLines);
                    ctx.drawImage(myImage, 318, roadLines);
                }
            }
        }

        function canvasImageSelectionToDotMatrix (canvasContext, lane, distance) {
            var imgd = canvasContext.getImageData((lane * laneOffset) + laneMiddle, distance, carWidth, carLength);
            var pix = imgd.data;
            var matrixImage = [];
            var horizontalRows = pix.length;
            var verticalRows = pix.length;
            var j = 0;

            // Put only one color channel into nn input
            var blackWhiteImage = [];
            for (var i = 1; i < pix.length; i += 4) {
                // Convert from greyscale to black and white
                if (pix[i] < 10) {
                    pix[i] = 0;
                } else {
                    pix[i] = 1;
                }
                blackWhiteImage.push(pix[i]);
            }
            var reductionFactor = 8;
            // We examine middle pixel of boxes on canvas, leave first 8 pixels out of starting row and column,
            // then leave 16 pixels out of every row and column (one box on canvas).
            var horizontalSmallImageLine = 80;
            for (var i = reductionFactor * horizontalSmallImageLine + reductionFactor, row = 0; i < blackWhiteImage.length - (horizontalSmallImageLine * reductionFactor - (reductionFactor + horizontalSmallImageLine)); i += reductionFactor * 2) {
                // Start new row of boxes after five boxes, dont add 11th row.
                if (row == 5) {
                    row = 0;
                    i += ((reductionFactor * 2 - 1) * horizontalSmallImageLine); 
                }
                matrixImage.push(blackWhiteImage[i]);
                row++;
            }
            return convert2dTo1dArray(matrixImage);
        }

        function convert2dTo1dArray(arrToConvert) {
            var newArr = [];
            for(var i = 0; i < arrToConvert.length; i++)
            {
                newArr = newArr.concat(arrToConvert[i]);
            }
            return newArr;
        }

        function convert1dTo2dArray(arrToConvert, lineLength) {
            var newArr = [];
            while(arrToConvert.length > 0) {
                newArr.push(arrToConvert.splice(0, lineLength));
            }
            return newArr;
        }

        function drawReticule(object) {
            ctx.drawImage(vm[object.type + 'Ret'], getObjectMiddleLaneOffset(object) + laneOffset * object.lane - 7, object.yPosition - 2);
        }
        
        function drawObject(object) {
            var q = $q.defer();
            ctx.drawImage(vm[object.type], getObjectMiddleLaneOffset(object) + laneOffset * object.lane, object.yPosition);
            q.resolve();
            return q.promise;
        }

        function cacheImages(){
            var objects = ['truckBlack', 'carBlack', 'carBlue', 'bikeBlack', 'sign70', 'sign90', 'sign110', 'roadLines', 'raindrops',
                           'truckBlackRet', 'carBlackRet', 'bikeBlackRet', 'sign70Ret', 'sign90Ret', 'sign110Ret'];
            var promises = objects.map(function(object) {
                return cacheObject(object);
            });
            return $q.all(promises);

            function cacheObject(object) {
                var q = $q.defer();
                var myImageUrl = 'content/images/' + object + '.png';
                vm[object] = new Image();
                vm[object].src = myImageUrl;
                vm[object].onload = function(){
                    q.resolve();
                }
                return q.promise;
            }
        }

        function drawRainDirt() {
            var q = $q.defer();
                ctx.drawImage(vm.raindrops, 0, 0);
                q.resolve();
            return q.promise;
        }

        function drawArrow(direction) {
            // Direction is given as a number that represents the 8 directions clockwise. 1 for north, 2 for northeast ect..
            var myImageUrl = 'content/images/arw' + direction + '.png';
            var myImage = new Image();
            myImage.src = myImageUrl;
            myImage.onload = function(){
                ctx.drawImage(myImage, 200, 420);
            }
        }

        function updateNNPreview(yPosition, lane, objectType) {
            var reticule = {type: objectType, lane: lane, yPosition: yPosition - getObjectLength(objectType)};
            drawReticule(reticule);
        }

        function drawMatrixOnMatrix(source, destination, xOffset, yOffset) {
            var images = angular.copy(vm.previewImages);
            vm.exampleObjects.forEach(function(object, index) {
                if (type == object.type) {
                    vm.smallImage = convert1dTo2dArray(images[index], 5);
                }
            });
        }

        function getObjectLength(objectType) {
            // Gives back the length of a lane the object occupies. 
            var length;
            switch(objectType) {
            case 'bikeBlack':
                length = 144;
                break;
            case 'truckBlack':
                length = 192;
                break;
            case 'carBlack':
            case 'carBlue':
                length = 160;
                break;
            default:
                length = 120;
            }
            return length;
        }

        function getObjectMiddleLaneOffset(object) {
            // Gives back the distance the object will keep from the lanes' sides. 
            var offset;
            switch(object.type) {
                case 'bikeBlack':
                    offset = 40;
                    break;
                case 'truckBlack':
                    offset = 32;
                    break;
                case 'carBlack':
                case 'carBlue':
                    offset = 40;
                    break;
                case 'rainDirt':
                    offset = 0;
                    break;
                default:
                    offset = 18;
            }
            return offset;
        }
    }
})();
