(function() {
    'use strict';

    angular
        .module('simulationApp')
        .config(stateConfig);

    stateConfig.$inject = ['$stateProvider'];

    function stateConfig($stateProvider) {
        $stateProvider.state('app', {
            abstract: true
        });
    }
})();
