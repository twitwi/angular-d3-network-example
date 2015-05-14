
angular.module('d3mod', []).factory('d3', function(){ return d3; });

var mod = angular.module('network-test', [
    'd3mod'
]);

mod.controller('network-test', ['$scope', function($scope) {
    $scope.allData = [
        [ [.8, .01, .24, 0], // 0,0
        ],
        [ [.5, .5, .24, 0], // 1,0
          [.2, .5, .4, 0] // 1,1
        ],
        [ [0.2, 0, .2, 0], // 2,0
          [0, .5, .444, 0], // 2,1
          [.1, .1, .88, 0] // 2,2
        ],
        [ [0.2, 0, .2, 1], // 3,0
          [0, .5, .444, 8], // 3,1
          [.1, .1, .88, 7], // 3,2
          [.1, .1, .88, 5] // 3,3
        ]
    ];
    $scope.currentData = [];
    $scope.currentNodes = [
        {name: 'hum', x: 100, y: 100},
        {name: 'yeah', x:80, y: 200},
        {name: 'hum hum', x: 200, y: 150},
        {name: 'right', x: 200, y: 200},
    ];
    var e = function(i,j,d) { return {source:i, target:j, value:100, name:d}; };
    $scope.currentEdges = [
        e(0, 1, 'a'),
        e(0, 2, 'b'),
        e(1, 3, 'c'),
    ];
    $scope.selected = function(v) {
        var i = Math.max(v[0], v[1]);
        var j = Math.min(v[0], v[1]);
        if (j < -1) return;
        $scope.currentData = $scope.allData[i][j];
    };
}]);

mod.directive('myDistribution', [function() {
    return {
        restrict: 'E',
        templateUrl: 'distribution.html',
        scope: {
            values: '=',
            normalize: '=',
            width: '@',
            height: '@',
        },
        link: function(scope, element, attrs) {
            scope.$watch('values', function() {
                if (!scope.values) return;
                scope.sumValues = scope.values.reduce(function(prev, curr) {return prev + curr;}, 0);
            });
        }
    }
}]);

mod.directive('myNetwork', ['d3', function(d3) {
    return {
        restrict: 'E',
        templateUrl: 'svg-network.html',
        scope: {
            spring: '=',
            nodes: '=',
            edges: '=',
            width: '@',
            height: '@',
            onSelectionChange: '='
        },
        link: function(scope, element, attrs) {
            scope.sel = [-1, -1];
            scope.$watchGroup(['nodes', 'edges', 'sel'], function() {
                if (!scope.nodes || !scope.edges) return;
                var width = scope.width;
                var height = scope.height;
                var n = 100;
                var force = d3.layout.force()
                    .nodes(scope.nodes)
                    .links(scope.edges)
                    .linkDistance(function(d) { return d.value; })
                    .size([width, height]);
                
                var svg = d3.select('svg')
                    .attr("width", width)
                    .attr("height", height);
                
                var loading = svg.append("text")
                    .attr("x", width / 2)
                    .attr("y", height / 2)
                    .attr("dy", ".35em")
                    .attr("text-anchor", "middle");
                
                if (scope.spring) {
                    // Run the layout a fixed number of times.
                    // The ideal number of times scales with graph complexity.
                    // Of course, don't run too long—you'll hang the page!
                    force.start();
                    for (var i = n * n; i > 0; --i) {
                        force.tick()
                    }
                    force.stop();
                }
                
                var link = svg.selectAll(".zedge").data(scope.edges);
                link.enter().append("line").classed("zedge", true);
                link
                    .attr("x1", function(d) { return scope.nodes[d.source].x; })
                    .attr("y1", function(d) { return scope.nodes[d.source].y; })
                    .attr("x2", function(d) { return scope.nodes[d.target].x; })
                    .attr("y2", function(d) { return scope.nodes[d.target].y; });
                
                var node = svg.selectAll(".znode").data(scope.nodes);
                node.enter().append("g").classed("znode", true);
                node.attr('transform', function(d) { return 'translate('+d.x+','+d.y+')'; });
                node.classed('selected', function(d, i) {
                    return (i == scope.sel[0] || i == scope.sel[1]);
                });
                node.classed('lastSelected', function(d, i) {
                    return i == scope.sel[1];
                });
                node.on('click', function(d, i) {
                    var newOne = [scope.sel[1], i];
                    scope.$apply(function() {
                        scope.sel = newOne;
                        if (scope.onSelectionChange) {
                            scope.onSelectionChange(newOne, scope.sel);
                        }
                    });
                });
                node.append('circle')
                    .attr("r", 20);
                node.append("text")
                    .attr("dy", ".35em")
                    .attr("text-anchor", "middle")
                    .text(function(d, i){return i;});
                
            });            
        }
    };
}]);

