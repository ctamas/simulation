(function() {
    'use strict';

    angular
        .module('simulationApp')
        .factory('NNService', NNService);

    NNService.$inject = ['$q'];
    
    function NNService ($q) {

        var network;
        var networkType;
        var trainedImages;

        var service = {
            initNetwork : function(type, input, middle, output, connections){
                networkType = type;
                if(!type) {
                    networkType = 'Perceptron';
                }
                if (networkType == 'Perceptron' || networkType == 'Stochastic' ) {
                    network = new synaptic.Architect.Perceptron(input, middle, output);
                    if (networkType == 'Stochastic') {
                        network.layers.hidden[0].list.forEach(function(node) {
                            // Randomize biases for nodes
                            node.bias = (Math.random() * 0.5) - 0.5;
                            // Randomize weigthts of inputs
                            for(var index in node.connections.inputs) { 
                               if (node.connections.inputs.hasOwnProperty(index)) {
                                   node.connections.inputs[index].weight = (Math.random() * 0.3) - 0.3;
                               }
                            }
                            // Randomize weigthts of outputs
                            for(var index in node.connections.projected) { 
                                if (node.connections.projected.hasOwnProperty(index)) {
                                    node.connections.projected[index].weight = (Math.random() * 0.3) - 0.3;
                                }
                            }
                        });
                    }
                }
                else if (networkType == 'Liquid State Machine'){
                    // Calculate appropriate amount of gates from pool neuron count
                    var gates = Math.ceil(middle / 2);
                    network = new synaptic.Architect.Liquid(input, middle, output, connections, gates);
                }
                else if (networkType == 'Hopfield'){
                    trainedImages = [];
                    // create a network for 50-bit patterns as we have 50 inputs
                    network = new synaptic.Architect.Hopfield(50);
                }
            },
            trainNetwork : function(trainingImages, trainingRate, errorRate){
                var emptyArray = new Array(50).fill(1);
                var emptyOutputArray = new Array(trainingImages.length).fill(0);
                // Network output array of probabilites that the image is the corresponding index element in the training image array. 0 is for road and 1 for matched object.
                var errors = [];
                
                if (networkType != 'Hopfield') {
                    var trainer = new synaptic.Trainer(network)
                    var createdTrainingSet = createTrainingSet(trainingImages);
                    var trainingOptions = {
                        rate: trainingRate,
                        iterations: 20000,
                        error: errorRate,
                        log: 1000,
                        cost: synaptic.Trainer.cost.CROSS_ENTROPY,
                        schedule: {
                            every: 1,
                            do: function(data){
                                    errors.push(data.error);
                            }
                          }
                        };
    
                    // Train asyncscronously with web worker.
                    return trainer.trainAsync(createdTrainingSet, trainingOptions)
                    .then(function(results) {
                        createdTrainingSet.forEach(function(trainedElement, index) {
                            console.log('Testing object image', index, (network.activate(trainedElement.input)).map(function(confidence) {
                                return parseFloat(confidence.toFixed(6));
                            }));
                        });
                        return {trainingImages: trainingImages, trainingErrors: errors};
                    });
    
                    function createTrainingSet (pixelArrays) {
                        var trainingSet = [];
                        pixelArrays.forEach(function(pixelArray, index) {
                            // Add empty training element as first one.
                            if (index == 0) {
                                var emptyTrainingElement = {input: emptyArray, output: emptyOutputArray};
                                trainingSet.push(emptyTrainingElement);
                            }
                            var output = angular.copy(emptyOutputArray);
                            output[index] = 1;
                            var trainingElement = {input: pixelArray, output: output};
                            trainingSet.push(trainingElement)
                        });
                        return trainingSet;
                    }
                }
                // Handle special case of Hopfield training
                else {
                    var q = $q.defer();
                    var trainingImagesWithEmptyImage = trainingImages;
                    // Save trained images array for comparison on Hopfield activation.
                    trainedImages = trainingImagesWithEmptyImage;
                    // Additional learining sample to handle false positive of car detection with only front of car showing.
                    var tempImage = new Array(35).fill(0);
                    for(var i = 35; i < 50; i++) {
                        tempImage.push(trainingImagesWithEmptyImage[0][i]);
                    }
                    trainingImagesWithEmptyImage.push(emptyArray);
                    trainingImagesWithEmptyImage.push(tempImage);
                    network.learn(trainingImagesWithEmptyImage);
                    q.resolve({trainingImages: trainingImages, trainingErrors: 0});
                    return q.promise;
                }
            },
            activateNetwork : function(image) {
                if (networkType != 'Hopfield') {
                return network.activate(image);
                } else {
                    // Since hopfield gives a data object back with the closest match,
                    // we have to do the evaluation manually by simulating the network output signal of the found object.
                    var match = network.feed(image);
                    var resultArray = new Array(8).fill(0);
                    trainedImages.forEach(function(trainedElement, index) {
                        if (arraysIdentical(match, trainedElement)) {
                            resultArray[index] = 1;
                        }
                    });
                    return resultArray
                }
                function arraysIdentical(a, b) {
                    var i = a.length;
                    if (i != b.length) return false;
                    while (i--) {
                        if (a[i] !== b[i]) return false;
                    }
                    return true;
                };
            }
        };
        return service;
    }
})();
