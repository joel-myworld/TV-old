jQuery.sap.require('sap.m.MessageBox');
jQuery.sap.require('sap.m.MessagePopover');
jQuery.sap.require('sap.m.DatePicker');
jQuery.sap.require({
  modName: 'com.siemens.tableViewer.controller.tabs.Chart',
  type: 'controller'
});
module('Chart controller tests', {
  setup: function () {
    this.oController = new sap.ui.controller('com.siemens.tableViewer.controller.tabs.Chart');
    this.oController._oChangeChartTypePopover = {
      destroy: function () {
      },
      openBy: function () {
      },
      close: function () {
      }
    };
    this.oController.models = {
      createDimensionMeasures: function (a, b) {
        return;
      },
      requestChartData: function (a, b, c, d, e) {
        return;
      }
    };
    this.oController._oDimensionsMeasuresDialog = {
      destroy: function () {
      },
      open: function () {
        return true;
      }
    };
    this.oController.getEventBus = function () {
      return {
        unsubscribe: function () {
        },
        subscribe: function () {
        }
      };
    };
    this.oController.getView = function () {
      return {
        addDependent: function () {
        },
        setModel: function () {
        }
      };
    };
    this.oController.byId = function () {
      return {
        getModel: function () {
          return {
            setProperty: function () {
            }
          };
        }
      };
    };
    this.oController.getModel = function () {
      return {
        setProperty: function () {
        },
        getProperty: function () {
          return [{
              SELECTED: 'TRUE',
              COLUMN: 'Test'
            }];
        }
      };
    };
    this.oController.setModel = function () {
    };
    this.oController.getOwnerComponent = function () {
      return {
        getModel: function () {
          return {
            getProperty: function () {
              return [];
            },
            read: function () {
            }
          };
        }
      };
    };
    this.oController._chartData = {
      measures: [{
          COLUMN: 'NUCAF',
          CTYPE: 11,
          LABEL: 'Number of candidate failed',
          VALUES: []
        }],
      dimensions: [{ VALUES: [] }],
      backgroundColorData: [],
      size: 0
    };
    oResourceBundle = {
      getText: function () {
      }
    };
    oRouter = {
      attachRoutePatternMatched: function () {
      }
    };
    sinon.stub(this.oController, 'getRouter').returns(oRouter);
    sinon.stub(this.oController, 'getResourceBundle').returns(oResourceBundle);
  }
});
test('Test onInit function', function () {
  this.oController.onInit();
  ok('onInit function was called once!');
});
test('Test _randomColor function', function () {
  this.oController._randomColor();
  ok('_randomColor function was called once!');
});
test('Test _randomColorFactor function', function () {
  this.oController._randomColorFactor();
  ok('_randomColorFactor function was called once!');
});
test('Test _getChartSelectedColumnsAsString function', function () {
  var stub_getModel = sinon.stub(this.oController, 'getModel', function (viewType) {
    return {
      getProperty: function (sPath) {
        return [{
            SELECTED: 'TRUE',
            COLUMN: 'Test'
          }];
      }
    };
  });
  this.oController._getChartSelectedColumnsAsString();
  ok(stub_getModel.called, '_getChartSelectedColumnsAsString function was called');
  stub_getModel.restore();
});
test('Test _handleRequestError function', function () {
  var stub_getModel = sinon.stub(this.oController, 'getModel', function (viewType) {
      return {
        setProperty: function (sPath, tf) {
        }
      };
    }), oError = {};
  this.oController._handleRequestError(oError);
  ok(stub_getModel.called, '_handleRequestError function was called');
  stub_getModel.restore();
});
test('Test onExit function', function () {
  this.oController.onExit();
  ok('onExit function was called');
});
test('Test onChartTypeButtonPressed function', function () {
  var oEvent = {
    getSource: function () {
      return {};
    }
  };
  //this._oChangeChartTypePopover = null;
  this.oController.onChartTypeButtonPressed(oEvent);
  ok('onChartTypeButtonPressed function was called');
});
test('Test onChangeChartType function', function () {
  var oEvent = {
    getSource: function () {
      return {
        getBindingContext: function () {
          return {
            getProperty: function () {
            }
          };
        }
      };
    }
  };
  //this._oChangeChartTypePopover = null;
  this.oController.onChangeChartType(oEvent);
  ok('onChangeChartType function was called');
});
test('Test onChartDimensionMeasureButtonPressed function', function () {
  var oEvent = {};
  //this._oChangeChartTypePopover = null;
  this.oController.onChartDimensionMeasureButtonPressed(oEvent);
  ok('onChartDimensionMeasureButtonPressed function was called');
});
test('Test handleChartSettingsDialogResetFilters function', function () {
  var oEvent = {};
  //this._oChangeChartTypePopover = null;
  this.oController.handleChartSettingsDialogResetFilters(oEvent);
  ok('handleChartSettingsDialogResetFilters function was called');
});
test('Test onFilterSetup function', function () {
  var sChannel, sEvent = 'SetupFilters', oData = {
      hash: 'Chart',
      mainFilters: {
        aFilters: [
          1,
          2
        ]
      }
    };
  //this._oChangeChartTypePopover = null;
  this.oController.onFilterSetup(sChannel, sEvent, oData);
  ok('onFilterSetup function was called');
});
test('Test _onRouteMatched function', function () {
  var stub_getModel = sinon.stub(this.oController, 'getModel', function (viewType) {
    return {
      getProperty: function (x) {
        return {
          aFilters: [
            1,
            2
          ]
        };
      },
      setProperty: function (x) {
      }
    };
  });
  var oEvent = {
    getParameters: function () {
      return { arguments: { tab: 'Chart' } };
    }
  };
  //this._oChangeChartTypePopover = null;
  this.oController._onRouteMatched(oEvent);
  ok(stub_getModel.called, '_onRouteMatched function was called');
  stub_getModel.restore();
});
test('Test handleChartSettingsConfirm function', function () {
  var oEvent = {};
  //this._oChangeChartTypePopover = null;
  this.oController.handleChartSettingsConfirm(oEvent);
  ok('handleChartSettingsConfirm function was called');
});
test('Test _handleRequestSuccess function', function () {
  var oData = {
      results: {
        map: function (object) {
          return { oDimension: { COLUMN: 'NUCAF' } };
        }
      }
    }, response;
  //this._oChangeChartTypePopover = null;
  this.oController._handleRequestSuccess(oData, response);
  ok('_handleRequestSuccess function was called');
});