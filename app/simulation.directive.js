(function() {
    'use strict';

    angular
    .module('simulationApp')
    .directive('simulation', simulation);

    function simulation() {
    var directive = {
        restrict: 'EA',
        templateUrl: 'app/simulation.html'
    };

    return directive;
    }

})();
