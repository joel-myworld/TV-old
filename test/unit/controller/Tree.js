jQuery.sap.require('sap.m.MessageBox');
jQuery.sap.require('sap.m.MessagePopover');
jQuery.sap.require('sap.m.DatePicker');
jQuery.sap.require({
  modName: 'com.siemens.tableViewer.controller.tabs.Tree',
  type: 'controller'
});
module('Tree Table controller tests', {
  setup: function () {
    this.oController = new sap.ui.controller('com.siemens.tableViewer.controller.tabs.Tree');

    //for view methods
    var oViewStub = {
      getModel: function (sModelName) {
      //  return this.oViewModel;
      return {
          setProperty: function (oParam1, oParam2) {
          },
          getProperty: function (oParam1) {
            if(oParam1 === "/Columns") {
             return [
                {
                  COLUMN: 'LOCAT_CAL',
                  CTRLID: 'CTRL1',
                  CTYPE: 11,
                  CWIDTH: '107px',
                  DESCRIPTION: 'Description',
                  FILTER: 1,
                  FILTERTYPE: '',
                  IS_KFG: 0,
                  LABEL: 'Location',
                  SORTORDER: 30,
                  STDRD: 1
                },
                {
                  COLOR_CODE: '#0048ab',
                  COLUMN: 'LOCAT_CAL',
                  CTRLID: 'CTRL1',
                  CTYPE: 11,
                  CWIDTH: '107px',
                  DESCRIPTION: 'Description',
                  FILTER: 1,
                  FILTERTYPE: '',
                  IS_KFG: 0,
                  LABEL: 'Location',
                  SORTORDER: 30,
                  STDRD: 1
                }
              ];
            }
          },
          getData: function (sPath) {

          },
          create: sinon.stub(),
          read: sinon.stub()
        }
      }.bind(this),
      setModel: function (oModel, sModelName) {
        this.oViewModel = oModel;
      }.bind(this),
      getBindingContext: function () {
      },
      getBusyIndicatorDelay: function () {
      }
    };
    oViewStub.byId = function (sId) {
      return {
        getBinding: function (oParam) {
          return {
            filter: function (aFilter) {
              return 'Filtered Data';
            },
            getLength: function(){
            	return 1;
            }
          };
        },
        getAggregation: function (oParam) {
          return;
        },
        expand: function(iRow){
        	return [{}];
        },
        collapse: function(iRow){
        	return [{}];
        }
        
      };
    };

    this.oController.byId = function () {
      return {
        setModel : sinon.stub(),
        bindRows : function() {

        },
        bindAggregation: function() {

        }
      };
    };
    this.oController.getComponentModel = function () {
      return {
        getProperty: function() {

        }
      };
    };

    this.oController.attachRequestsForModel = sinon.stub();

    this.oController._oTPC = new sap.ui.base.ManagedObject();
    this.oController._oTPC.openDialog = sinon.stub().returns(null);
    this.oController._oTPC._oDialog = {
      attachEventOnce: function (oParam) {
      },
      mEventRegistry: {
        confirm : [{}]
      }
    };

    this.ODataUtils = new sap.ui.model.odata.ODataUtils();
    this.ODataUtils.createFilterParams = function (aParams, oParam2, sParam3) {
    };

    this.oOwnerComponentStub = new sap.ui.base.ManagedObject();
    this.oOwnerComponentStub.getMetadata = function () {
      return {
        getConfig: function () {
          return {
            //serviceUrl : "/siemens/COMMON_DEV/xs/services/tableViewerOData/"
            serviceUrl: ''
          };
        }
      };
    };

    this.oOwnerComponentStub.getModel = function () {
      return { oData: { Config: { hierarchy: 1 } } };
    };
    this.oOwnerComponentStub.getContentDensityClass = function () {
      return;
    };

    this.oEventBus = {
      unsubscribe: function (oParam1, oParams2, oParam3) {
      },
      subscribe: function () {
      }
    };
    this.oEventBus.publish = sinon.stub();
    encode = function (sPath) {
    };

     //global variable for fragment
      this.oController._oExportFormatsPopover = {
          openBy: function(o) {

          },
          close: function() {

          }
      };

    sinon.stub(this.oController, 'getView').returns(oViewStub);
    sinon.stub(this.oController, 'getOwnerComponent').returns(this.oOwnerComponentStub);
    sinon.stub(this.oController, 'getEventBus').returns(this.oEventBus);
    sinon.stub(this.ODataUtils, 'createFilterParams', function (aFilters) {
      return '$filter=((LOCAT_CAL%20eq%20DA1))';
    });
  },
  teardown: function () {
    this.oController.destroy();
    this.oOwnerComponentStub.destroy();
  }
});

 test("Test onInit function", function () {
    this.oController.getComponentModel = function (oParam) {
      return {
        getProperty : function() {
          return "";
        }
       }
    }

 	this.oController.onInit();

 	ok(true, " tree table controller Initialized successfully");

 });

test('Test onTablePersonalization function', function () {
  //Arrange
  var stub_requestNewData = sinon.stub(this.oController, '_requestNewData', function () {
    return;
  });
  //Action
  this.oController.onTablePersonalization();
  //Assert
  ok(true, 'onTablePersonalization executed successfully');
  stub_requestNewData.restore();
});

test('Test _readVisibleColumns function', function () {
  var oColumnModel = {
    getProperty: function () {
      return [{
          STDRD: 1,
          COLUMN: 'ABC'
        }];
    }
  },
  aColumns = [{
        mProperties: {
          autoResizable: true,
          coloredStyleClass: 'red',
          hAlign: 'Left',
          sortProperty: 'CALMONTH',
          visible: false,
          width: '107px'
        }
      }];
  aColumns[0].getProperty = function(sProperty) {
    if(sProperty === "visible") {
      return true;
    } 
  }

   aColumns[0].getSortProperty = function() {
      return "asc";
   }
  this.oController._readVisibleColumns(aColumns);
  ok('_readVisibleColumns function was called once!');
});

  test("Test to generates a column for a table with all settings _columnsFactory", function() {
    //Arrange
    var sId = "sId", oContext = {}, oUIControl = {};
    oContext.getProperty = function(sName) {
      return "Column";
    }

    //Act
    oUIControl = this.oController._columnsFactory(sId, oContext);
    //Assert
    if (oUIControl !== null) {
      ok(true, '_columnsFactory returned UI Control');
    } else {
      ok(false, '_columnsFactory couldnt return UI Control');
    }
  });

     test("Test to check Binding JSON model data to Tree Table _bindTree function", function () {
      //Arrange
       var oTable = {
      		bindAggregation: function () {
      			return;
      		},
      		bindRows: function () {
      			return;
      		},
          getProperty: function() {
            return [{}];
          }
      	},
        oController = this.oController;
      //Act
     	this.oController._bindTree(oTable, oController);
      //Assert
      	ok("_bindTable function was called once!");
      });

     test("Test for export to excel event handler onExport", function() {
      //Arrange
      var oEvent = {};
       oEvent.getSource = function () {
          return {
            getCustomData: function () {
              return [{
                  getProperty: function (value) {
                    return 'json';
                  }
                }];
            }
          };
        };

      var aColumns = [{
          mProperties: {
            autoResizable: true,
            coloredStyleClass: 'red',
            hAlign: 'Left',
            sortProperty: 'CALMONTH',
            visible: false,
            width: '107px'
          }
        }];
      var stub_readVisibleColumns = sinon.stub(this.oController, '_readVisibleColumns', function (aColumns) {
        return 'CALMONTH';
      });

      //Act
      this.oController.onExport(oEvent);
      //Assert
      ok(true, "Export to excel executed successfully");

      stub_readVisibleColumns.restore();
     });

     test("test to Setup filters before requesting for a new data _setupFilters", function() {
      //Arrange
      var sChannel, sEvent = "SetupFilters", oData = { 
        hash: "Tree",
        mainFilters: {
        'aFilters': [{
            bAnd: false,
            aFilters: [new sap.ui.model.Filter('LOCAT_CAL', sap.ui.model.FilterOperator.EQ, 'DA1', undefined)]
          }]
        }
      };

        var stub_requestNewData = sinon.stub(this.oController, '_requestNewData', function () {
          return;
        });
      //Act
      this.oController._setupFilters(sChannel, sEvent, oData);
      //Assert
      ok(true, "_setupFilters executed successfully");
      stub_requestNewData.restore();
     });

     test("test to Request to load new data from backend _requestJsonData", function() {
      //Arrange
      var oTable = {
        getModel : function () {
            return {
              loadData : sinon.stub()
            }
        }
      }, sVisibleColumns = "CALMONTH", sFilters = "((LOCAT_CAL%20eq%20DA1))";
      //Act
      this.oController._requestJsonData(oTable, sVisibleColumns, sFilters);
      //Assert
      ok(true, "_requestJsonData executed successfully");
     });

     test("test Requests new data from database based on visible columns _requestNewData", function() {
      //Arrange
      var aColumns = [{
          mProperties: {
            autoResizable: true,
            coloredStyleClass: 'red',
            hAlign: 'Left',
            sortProperty: 'CALMONTH',
            visible: false,
            width: '107px'
          }
        }],

        oTable = {
        getModel : function () {
            return {
              loadData : sinon.stub()
            }
        }
      }, sVisibleColumns = "CALMONTH", sFilters = "((LOCAT_CAL%20eq%20DA1))";

      var stub_readVisibleColumns = sinon.stub(this.oController, '_readVisibleColumns', function (aColumns) {
        return 'CALMONTH';
      });

      var stub_requestJsonData = sinon.stub(this.oController, '_requestJsonData', function (oTable, sVisibleColumns, sFilters) {
        return;
      });
      //Act
      this.oController._requestNewData();
      //Assert
      ok(true, "_requestNewData executed successfully");
      stub_readVisibleColumns.restore();
      stub_requestJsonData.restore();
     });

     test("Test to Event handler when an export button is pressed onExportToExcel", function() {
      //Arrange
      var oEvent = {
        getSource : function() {
          return {};
        }
      }
      //Act
      this.oController.onExportToExcel(oEvent);
      //Assert
      ok(true, "onExportToExcel executed successfully");
     });
     
     //TreeTable Expand/Collapse functionality 
     test("Test to Event on Clicking buttons Expand All in the header of Tree Table", function() {
    	 //Act
         this.oController._expandAll();
         //Assert
         ok(true, "ExpandAll executed successfully");
        });

     test("Test to Event on Clicking buttons Collapse All in the header of Tree Table", function() {
     	 //Act
          this.oController._collapseAll();
          //Assert
          ok(true, "CollapseAll executed successfully");
         });
