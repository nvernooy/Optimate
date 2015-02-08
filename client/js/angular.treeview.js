/*
    @license Angular Treeview version 0.1.6
    ⓒ 2013 AHN JAE-HA http://github.com/eu81273/angular.treeview
    License: MIT
    [TREE attribute]
    angular-treeview: the treeview directive
    tree-id : each tree's unique id.
    tree-model : the tree model on $scope.
    node-id : each node's id
    node-label : each node's label
    node-children: each node's children
    <div
        data-angular-treeview="true"
        data-tree-id="tree"
        data-tree-model="roleList"
        data-node-id="roleId"
        data-node-label="roleName"
        data-node-children="children" >
    </div>
*/
// Modal dialog module
(function() {
  var app;

  app = angular.module("ngModal", []);

  app.provider("ngModalDefaults", function() {
    return {
      options: {
        closeButtonHtml: "<span class='ng-modal-close-x'>X</span>"
      },
      $get: function() {
        return this.options;
      },
      set: function(keyOrHash, value) {
        var k, v, _results;
        if (typeof keyOrHash === 'object') {
          _results = [];
          for (k in keyOrHash) {
            v = keyOrHash[k];
            _results.push(this.options[k] = v);
          }
          return _results;
        } else {
          return this.options[keyOrHash] = value;
        }
      }
    };
  });

  app.directive('modalDialog', [
    'ngModalDefaults', '$sce', function(ngModalDefaults, $sce) {
      return {
        restrict: 'E',
        scope: {
          show: '=',
          dialogTitle: '@',
          onClose: '&?'
        },
        replace: true,
        transclude: true,
        link: function(scope, element, attrs) {
          var setupCloseButton, setupStyle;
          setupCloseButton = function() {
            return scope.closeButtonHtml = $sce.trustAsHtml(ngModalDefaults.closeButtonHtml);
          };
          setupStyle = function() {
            scope.dialogStyle = {};
            if (attrs.width) {
              scope.dialogStyle['width'] = attrs.width;
            }
            if (attrs.height) {
              return scope.dialogStyle['height'] = attrs.height;
            }
          };
          scope.hideModal = function() {
            return scope.show = false;
          };
          scope.$watch('show', function(newVal, oldVal) {
            if (newVal && !oldVal) {
              document.getElementsByTagName("body")[0].style.overflow = "hidden";
            } else {
              document.getElementsByTagName("body")[0].style.overflow = "";
            }
            if ((!newVal && oldVal) && (scope.onClose != null)) {
              return scope.onClose();
            }
          });
          setupCloseButton();
          return setupStyle();
        },
        template: "<div class='ng-modal' ng-show='show'>\n  <div class='ng-modal-overlay' ng-click='hideModal()'></div>\n  <div class='ng-modal-dialog' ng-style='dialogStyle'>\n    <span class='ng-modal-title' ng-show='dialogTitle && dialogTitle.length' ng-bind='dialogTitle'></span>\n    <div class='ng-modal-close' ng-click='hideModal()'>\n      <div ng-bind-html='closeButtonHtml'></div>\n    </div>\n    <div class='ng-modal-dialog-content' ng-transclude></div>\n  </div>\n</div>"
      };
    }
  ]);

}).call(this);


// Treeview module
(function ( angular ) {
    'use strict';
    // var optimateApp = angular.module( 'angularTreeview', [] );

    // Add the right click directive
    // optimateApp.directive(
    angular.module( 'angularTreeview', ['ngModal'] )
    .directive(
        'treeModel', ['$compile', '$http', function( $compile, $http) {
            return {
                restrict: 'A',
                link: function ( scope, element, attrs ) {
                    //tree id
                    var treeId = attrs.treeId;
                    //tree model
                    var treeModel = attrs.treeModel;
                    //node id
                    var nodeId = attrs.nodeId || 'id';
                    //node label
                    var nodeLabel = attrs.nodeLabel || 'label';
                    //children
                    var nodeChildren = attrs.nodeChildren || 'children';
                    // path
                    var nodePath = attrs.nodePath || 'path'
                    // Copied node to be pasted
                    scope.copiednode;

                    //tree template
                    var template =
                        '<ul>' +
                            '<li data-ng-repeat="node in ' + treeModel + '">' +
                                '<i class="collapsed" ' +
                                    'data-ng-show="node.' + nodeChildren + '.length && node.collapsed" data-ng-click="' +
                                    treeId + '.selectNodeHead(node)">'+
                                '</i>' +
                                '<i class="expanded" '+
                                    'data-ng-show="node.' + nodeChildren + '.length && !node.collapsed" data-ng-click="' +
                                    treeId + '.selectNodeHead(node)">'+
                                '</i>' +
                                '<i class="normal" '+
                                    'data-ng-hide="node.' + nodeChildren + '.length">'+
                                '</i> ' +

                                // '<span class = "selectedNode" data-ng-class="node.selected" '+
                                //     'data-ng-click="' + treeId + '.selectNodeLabel(node)">{{node.' + nodeLabel + '}}'+
                                //     '<span class = "addItem">'+
                                //         '<a ng-click="addItem(node.'+nodePath+')" href="">+</a>'+
                                //     '</span>'
                                // '<span>' +

                                '<span data-ng-class="node.selected" '+
                                    'data-ng-click="' + treeId + '.selectNodeLabel(node)">{{node.' + nodeLabel + '}}'+
                                '</span>' +

                                // Modal dialogue with functions
                                '<span class="additem" ng-show="node.selected">'+
                                '<button ng-click="toggleModal()">+</button>'+
                                    '<modal-dialog show="modalShown" dialog-title="Options" width="150px" on-close="logClose()">'+
                                            '<button data-ng-click="' + treeId + '.addItem(node.Path)">Add</button>'+
                                            '<button data-ng-click="' + treeId + '.deleteItem(node.Path, node.ID)">Delete</button>'+
                                            '<button data-ng-click="' + treeId + '.copy(node.Path)">Copy</button>'+
                                            '<button data-ng-click="' + treeId + '.paste(node.Path)">Paste</button>'+
                                    '</modal-dialog>'+
                                '</span>'+

                                '<div data-ng-hide="node.collapsed" '+
                                    'data-tree-id="' + treeId +
                                    '" data-tree-model="node.' + nodeChildren +
                                    '" data-node-id=' + nodeId +
                                    ' data-node-label=' + nodeLabel +
                                    ' data-node-children=' + nodeChildren + '>'+
                                    ' data-node-path=' + nodePath + '>'+
                                '</div>' +
                            '</li>' +
                        '</ul>';


                    //check tree id, tree model
                    if( treeId && treeModel ) {
                        //root node
                        if( attrs.angularTreeview ) {
                            //create tree object if not exists
                            scope[treeId] = scope[treeId] || {};

                            // function to POST data to server to add item
                            scope[treeId].addItem = function(path) {
                                console.log("Adding data to: " +path);
                                $http({method: 'POST', url: 'http://localhost:8080' + path + 'add'}).success(
                                // $http({method: 'POST', url: 'http://localhost:8080/', data: {ID: itemId, Parent:parentid}}).success(
                                    function () {
                                        alert('Success: Child added');
                                    }
                                );
                            }

                            // Function to delete data in server
                              scope[treeId].deleteItem = function(path, id) {
                                        console.log("Deleteing " + id + " from " + path);
                                        // get parent path
                                        var temp = path.substring (0, path.length-1);
                                        console.log (temp)
                                        var parentpath = temp.substring(0, temp.lastIndexOf("/"));
                                        console.log (parentpath);
                                        $http({method: 'POST', url: 'http://localhost:8080' + parentpath + '/delete', data:{'ID': id}}).success(
                                        // $http({method: 'POST', url: 'http://localhost:8080/', data: {ID: itemId, Parent:parentid}}).success(
                                            function () {
                                                alert('Success: Item deleted');
                                            }
                                    );
                            }

                            // Function to copy a node
                              scope[treeId].copy = function(cnode) {
                                        scope.copiednode = cnode;
                                        console.log("Path that is copied: " + scope.copiednode);
                                        alert('Node address copied')
                            }

                            // function to POST data to server to paste item
                              scope[treeId].paste = function(path) {
                                        console.log("Node to be pasted: " + scope.copiednode);
                                        $http({method: 'POST', url: 'http://localhost:8080' + path + 'paste', data:{'Path': scope.copiednode}}).success(
                                        // $http({method: 'POST', url: 'http://localhost:8080/', data: {ID: itemId, Parent:parentid}}).success(
                                            function () {
                                                alert('Success: Node pasted');
                                            }
                                    );
                            }

                            //if node head clicks,
                            scope[treeId].selectNodeHead = scope[treeId].selectNodeHead || function( selectedNode ){
                                //Collapse or Expand
                                selectedNode.collapsed = !selectedNode.collapsed;
                            };

                            //if node label clicks,
                            scope[treeId].selectNodeLabel = scope[treeId].selectNodeLabel || function( selectedNode ){
                                //remove highlight from previous node
                                if( scope[treeId].currentNode && scope[treeId].currentNode.selected ) {
                                    scope[treeId].currentNode.selected = undefined;
                                }

                                //set highlight to selected node
                                selectedNode.selected = 'selected';

                                //set currentNode
                                scope[treeId].currentNode = selectedNode;

                                // get path from the node
                                // and go to that path with http
                                var path = scope[treeId].currentNode.Path;
                                $http.get('http://127.0.0.1:8080'+path).success
                                    (
                                    function(data)
                                        {
                                            console.log("Htpp request success: "+ data);
                                             // Append the response data to the subitem (chilren) of the current node
                                            scope[treeId].currentNode.Subitem =  data;
                                        }
                                    );
                            };
                        }
                        //Rendering template.
                        element.html('').append( $compile( template )( scope ) );
                    }
                }
            };
    }]);
})( angular );
