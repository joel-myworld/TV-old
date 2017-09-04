sap.ui.define([
  'com/siemens/tableViewer/controller/BaseController',
  'sap/ui/core/mvc/Controller',
  'sap/ui/core/routing/History'
], function (formatter, Controller, History) {
  'use strict';
  module('Base controller tests', {
    setup: function () {
      this.oController = new sap.ui.controller('com.siemens.tableViewer.controller.BaseController');
      this.oController.getView = function () {
        return {
          getModel: function (prop) {
            return;
          },
          setModel: function (oModel, sName) {
          }
        };
      };
      this.oController.getOwnerComponent = function () {
        return {
          getModel: function (prop) {
            return {
              getResourceBundle: function () {
              },
              getProperty: function () {
              }
            };
          },
          getEventBus: function () {
          }
        };
      };

      this.oController.config = { paths: { mainConfig: 'abc' } };
    }
  });

  test('Test getRouter function', function () {
    sap.ui.core.UIComponent = {
      getRouterFor: function(o) {
        return;
      }
    }
    this.oController.getRouter();
    ok('getRouter function was called once!');
  });

  test('Test getModel function', function () {
    this.oController.getModel();
    ok('getModel function was called once!');
  });
  test('Test getComponentModel function', function () {
    this.oController.getComponentModel();
    ok('getComponentModel function was called once!');
  });
  test('Test setModel function', function () {
    var oModel = {}, sName;
    this.oController.setModel(oModel, sName);
    ok('setModel function was called once!');
  });
  test('Test getResourceBundle function', function () {
    this.oController.getResourceBundle();
    ok('getResourceBundle function was called once!');
  });
  test('Test getEventBus function', function () {
    this.oController.getEventBus();
    ok('getEventBus function was called once!');
  });
  test('Test getEntityName function', function () {
    this.oController.getEntityName();
    ok('getEntityName function was called once!');
  });

  test('Test attachRequestsForControlBusyIndicator function', function () {
    var oModel = {
        attachEventOnce: function () {
        }
      }, oControl = {
        getBusyIndicatorDelay: function () {
          return 1000;
        },
        setBusyIndicatorDelay: function () {
          return;
        },
        setBusy: function () {
        }
      };
    this.oController.attachRequestsForControlBusyIndicator(oModel, oControl);
    ok('attachRequestsForControlBusyIndicator function was called once!');
  });

  module("Base controller handleNavBack", {
    setup: function () {
      this.oController = new sap.ui.controller('com.siemens.tableViewer.controller.BaseController');
      this.oController.getRouter = function () {
        return {
          navTo: function () {
          }
        };
      };
    },
    teardown: function () {

    }
  });
  test('Test handleNavBack function', function () {
    this.oController.handleNavBack();
    ok('handleNavBack function was called once!');
  });

});
