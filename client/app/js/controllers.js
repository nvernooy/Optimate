'use strict';

/* Controllers */

var costItems = angular.module('controller', []);

costItems.controller
('ItemListCtrl',
    [
        '$scope', '$http', function($scope, $http)
        {
            //$http.get('cost_items/cost_items.json').success(function(data) {
            $http.get('http://127.0.0.1:8080/').success
            (
                function(data)
                {
                $scope.projects = data;
                }
            );
        }
    ]
);
