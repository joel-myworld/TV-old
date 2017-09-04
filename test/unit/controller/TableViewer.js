jQuery.sap.require('sap.m.MessageBox');
jQuery.sap.require('sap.m.MessagePopover');
jQuery.sap.require('sap.m.DatePicker');
jQuery.sap.require({
  modName: 'com.siemens.tableViewer.controller.TableViewer',
  type: 'controller'
});
module('TableViewer controller tests', {
  setup: function () {
    this.oController = new sap.ui.controller('com.siemens.tableViewer.controller.TableViewer');
    this.oController._tableViewerTableType;
    this.oController.getEntitySet = function () {
      return '/FreeDateCrossPlant';
    };
    this.oController.getFieldID = function () {
      return 'LOCAT_CAL';
    };
    this.oController.byId = function (sId) {
      return {
        fireSearch: function (evt) {
        },
        getFilterItems: function () {
          return [{}];
        },
        determineControlByFilterItem: function (oFilterItem) {
          return {
            getMetadata: function () {
              return { _sClassName: 'sap.m.MultiInput' };
            },
            getTokens: function () {
              return [{
                  getKey: function () {
                    return 'sKey1';
                  },
                  getText: function () {
                    return 'tokenText';
                  },
                  getCustomData: function () {
                    return [{
                        getProperty: function (value) {
                          if (value === 'value') {
                            return 'DA1';
                          }
                        }
                      }];
                  }
                }];
            },
            getName: function () {
              return 'token';
            }
          };
        },
        determineControlByName: function (sFieldName) {
          return {
            setTokens: function (aNewTokens) {
            }
          };
        },
        bindAggregation: sinon.stub()
      };
    };
    //for routing
    var oRouter = {
      getRoute: function (x) {
        return {
          attachMatched: function (oParam) {
          }
        };
      },
      getTargets: function () {
        return {
          display: function (a) {
          }
        };
      },
      attachRoutePatternMatched: function (oParam) {
      }
    };
    oRouter.navTo = sinon.stub();
    //for view methods
    var oStub = {
      getModel: function (sModelName) {
        //return this.oViewModel;
        return {
          setProperty: function (oParam1, oParam2) {
          },
          getProperty: function (oParam1) {
            if (oParam1 === '/ServiceColumns/results') {
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
            if (oParam1 === '/ENTITY_NAME') {
              return 'FreeDateCrossPlant';
            }

            if(oParam1 === "sPath2") {
              return {
                VariantName : "VariantName"
              };
            }
          },
          getData: function (sPath) {
            if (sPath === '/data(sKey)') {
              return {
                Column: 'LOCAT_CAL',
                Operator: 'EQ',
                Option1: 'DA1',
                Option2: undefined
              };
            }
          },
          create: sinon.stub(),
          read: sinon.stub(),
          update : sinon.stub(),
          refresh : sinon.stub()
        };
      }.bind(this),
      setModel: function (oModel, sModelName) {
        this.oViewModel = oModel;
      }.bind(this),
      getBindingContext: function () {
      },
      getBusyIndicatorDelay: function () {
      }
    };
    oStub.byId = function (sId) {
      return {
        getBinding: function (oParam) {
          return {
            aFilters: function () {
              return [];
            },
            filter: function (aFilter) {
              return 'Filtered Data';
            }
          };
        },
        getAggregation: function (oParam) {
          return [];
        }
      };
    };
    this.oComponentStub = new sap.ui.base.ManagedObject();
    this.oComponentStub.getProperty = function (sId) {
      if (sId === '/CTRLID') {
        return 'CTRL1';
      }
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
      return { oData: { Config: { hierarchy: 1 } },
      getResourceBundle: function() {
        return {
          getText: function(sText) {
            return "Message"
          }
        }
      } };
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
    //this.oOwnerComponentStub.getModel().
    //sinon stubs
    sinon.stub(this.oController, 'getComponentModel').returns(this.oComponentStub);
    sinon.stub(this.oController, 'getOwnerComponent').returns(this.oOwnerComponentStub);
    sinon.stub(this.oController, 'getView').returns(oStub);
    sinon.stub(this.oController, 'getRouter').returns(oRouter);
    sinon.stub(this.oController, 'getEventBus').returns(this.oEventBus);
  },
  teardown: function () {
    this.oController.destroy();
    this.oOwnerComponentStub.destroy();
    this.oComponentStub.destroy();
  }
});
test('Test to initialize TableViewer controller onInit', function () {
  //Arrange
  var sinon_onRouteMatched = sinon.stub(this.oController, '_onRouteMatched', function () {
    return;
  });
  var sinon_filterItemsFactory = sinon.stub(this.oController, '_filterItemsFactory', function () {
    return;
  });
  var sinon_retrieveTableType = sinon.stub(this.oController, '_retrieveTableType', function () {
    return;
  });
  //Act
  this.oController.onInit();
  //Assert
  ok(true, 'Controller initialized successfully');
  sinon_onRouteMatched.restore();
  sinon_filterItemsFactory.restore();
  sinon_retrieveTableType.restore();
});
test('Test onSearch function', function () {
  var stub_searchTable = sinon.stub(this.oController, '_searchTable', function () {
      return;
    }), oEvent = {}, sTableID = 'siemensUiTable';
  this.oController.onSearch(oEvent);
  ok(stub_searchTable.calledOnce, '_searchTable was called once!');
  ok(stub_searchTable.calledWith(oEvent, sTableID), '_searchTable was successfully called with two parameters oEvent and sTableID!');
  stub_searchTable.restore();
});
test('Test onClear function', function () {
  var stub_clearFilterBar = sinon.stub(this.oController, '_clearFilterBar', function () {
      return;
    }), sTableID = 'siemensUiTable', oEvent = {};
  this.oController.onClear(oEvent);
  ok(stub_clearFilterBar.calledOnce, '_clearFilter was called once!');
  ok(stub_clearFilterBar.calledWith(oEvent, sTableID), '_clearFilter was successfully called with two parameters oEvent and sTableID!');
  stub_clearFilterBar.restore();
});
//Qunit test for _retrieveFilters for tokens
test('Test _retrieveFilters function for tokens', function () {
  //Arrange
  var aFields = [{}], aMainFilters = {};
  aFields[0].getTokens = function () {
    return [
      {
        getAggregation: function (oParam) {
          if (oParam === 'customData') {
            return [{
                getProperty: function (sValue) {
                  return { operation: undefined };
                }
              }];
          }
        },
        getKey: function () {
          return 'key1';
        }
      },
      {
        getAggregation: function (oParam) {
          if (oParam === 'customData') {
            return [{
                getProperty: function (sValue) {
                  return {
                    exclude: 1,
                    operation: 'NE',
                    value1: 'DA1',
                    value2: undefined
                  };
                }
              }];
          }
        },
        getKey: function () {
          return 'key2';
        }
      }
    ];
  };
  aFields[0].getDateValue = undefined;
  aFields[0].getValue = function () {
    return '';
  };
  aFields[0].getSelectedKey = undefined;
  aFields[0].getSelectedKeys = undefined;
  aFields[0].getProperty = function (oParam) {
    if (oParam === 'name') {
      return 'input';
    }
  };
  //Act
  aMainFilters = this.oController._retrieveFilters(aFields);
  //Assert
  if (aMainFilters.aFilters !== null || aMainFilters.aFilters !== undefined) {
    ok(true, '_retrieveFilters executed successfully');
  } else {
    ok(false, '_retrieveFilters function failed to execute');
  }
});
test('Test _retrieveFilters function for value input', function () {
  //Arrange
  var aFields = [{}], aMainFilters = {};
  aFields[0].getTokens = undefined;
  aFields[0].getDateValue = undefined;
  aFields[0].getSelectedKey = undefined;
  aFields[0].getSelectedKeys = undefined;
  aFields[0].getValue = function () {
    return 'value';
  };
  aFields[0].getProperty = function (oParam) {
    if (oParam === 'name') {
      return 'input';
    }
  };
  aFields[0].getAggregation = function (oParam) {
    if (oParam === 'customData') {
      return [{
          getValue: function () {
            return 'number';
          }
        }];
    }
  };
  //Act
  aMainFilters = this.oController._retrieveFilters(aFields);
  //Assert
  if (aMainFilters.aFilters !== null || aMainFilters.aFilters !== undefined) {
    ok(true, '_retrieveFilters executed successfully');
  } else {
    ok(false, '_retrieveFilters function failed to execute');
  }
});
test('Test _retrieveFilters function for Date', function () {
  //Arrange
  var aFields = [{}], aMainFilters = {};
  aFields[0].getTokens = undefined, sKey = 'CALMONTH', stub_retreiveColumnModelObject = sinon.stub(this.oController, '_retreiveColumnModelObject', function (sKey) {
    return [{ CTYPE: '22' }];
  });
  aFields[0].getDateValue = function () {
    return new Date();
  };
  aFields[0].getSecondDateValue = function () {
    return new Date();
  };
  aFields[0].getSelectedKey = undefined;
  aFields[0].getSelectedKeys = undefined;
  aFields[0].getValue = function () {
    return '';
  };
  aFields[0].getProperty = function (oParam) {
    if (oParam === 'name') {
      return 'date';
    }
  };
  //Act
  aMainFilters = this.oController._retrieveFilters(aFields);
  //Assert
  if (aMainFilters.aFilters !== null || aMainFilters.aFilters !== undefined) {
    ok(true, '_retrieveFilters executed successfully');
  } else {
    ok(false, '_retrieveFilters function failed to execute');
  }
  stub_retreiveColumnModelObject.restore();
});
test('Test to retreive column object model _retreiveColumnModelObject', function () {
  //Arrange
  var sKey = 'LOCAT_CAL', oMatched = {};
  //Act
  bMatched = this.oController._retreiveColumnModelObject(sKey);
  //Assert
  if (bMatched !== null || bMatched !== undefined) {
    ok(true, 'Returned the matched column model object');
  } else {
    ok(false, 'Couldnt return the matched column model object');
  }
});
test('Test _retrieveFilters function for SelectedKey', function () {
  //Arrange
  var aFields = [{}], aMainFilters = {};
  aFields[0].getTokens = undefined;
  aFields[0].getDateValue = undefined;
  aFields[0].getSelectedKey = function () {
    return 'sKey';
  };
  aFields[0].sId = 'idKey1';
  aFields[0].getSelectedKeys = undefined;
  aFields[0].getValue = function () {
    return '';
  };
  aFields[0].getProperty = function (oParam) {
    if (oParam === 'name') {
      return 'input';
    }
  };
  //Act
  aMainFilters = this.oController._retrieveFilters(aFields);
  //Assert
  if (aMainFilters.aFilters !== null || aMainFilters.aFilters !== undefined) {
    ok(true, '_retrieveFilters executed successfully');
  } else {
    ok(false, '_retrieveFilters function failed to execute');
  }
});
test('Test _retrieveFilters function for SelectedKeys', function () {
  //Arrange
  var aFields = [{}], aMainFilters = {};
  aFields[0].getTokens = undefined;
  aFields[0].getDateValue = undefined;
  aFields[0].getSelectedKey = undefined;
  aFields[0].sId = 'idKey2';
  aFields[0].getSelectedKeys = function () {
    return ['sKey'];
  };
  aFields[0].getValue = function () {
    return '';
  };
  aFields[0].getProperty = function (oParam) {
    if (oParam === 'name') {
      return 'input';
    }
  };
  //Act
  aMainFilters = this.oController._retrieveFilters(aFields);
  //Assert
  if (aMainFilters.aFilters !== null || aMainFilters.aFilters !== undefined) {
    ok(true, '_retrieveFilters executed successfully');
  } else {
    ok(false, '_retrieveFilters function failed to execute');
  }
});
test('Test to clear filter bar _clearFilterBar', function () {
  //Arrange
  var oEvent = {}, oField1 = {}, oField2 = {}, oField3 = {}, oField4 = {}, sTableID = 'siemensUiTable';
  oField1.setDateValue = function () {
    return 'Wed Feb 17 2016 00:00:00 GMT+0530 (India Standard Time)';
  };
  oField2.setSelectedKey = function () {
    return 'key';
  };
  oField3.setSelectedKeys = function () {
    return 'key1,key2';
  };
  oField4.removeAllTokens = function () {
    return;
  };
  oEvent.getParameter = function (oParam) {
    if (oParam === 'selectionSet') {
      return [
        oField1,
        oField2,
        oField3,
        oField4
      ];
    }
  };
  oField1.setValue = function (sValue) {
    return sValue;
  };
  oField2.setValue = function (sValue) {
    return sValue;
  };
  oField3.setValue = function (sValue) {
    return sValue;
  };
  oField4.setValue = function (sValue) {
    return sValue;
  };
  //Act
  this.oController._clearFilterBar(oEvent, sTableID);
  //Assert
  ok(true, 'filters cleared successfully');
});
test('Test _retrieveFilterFields function', function () {
  //Arrange
  var content = [
    {
      getAggregation: function (aggName) {
        return content;
      }
    },
    {
      getAggregation: function (aggName) {
        return content;
      }
    }
  ];
  var oFilterBar = {
    getAggregation: function (aggName) {
      return content;
    }
  };
  oEvent = {
    getSource: function () {
      return oFilterBar;
    }
  };
  var stub_byId = sinon.stub(this.oController, 'byId', function () {
    return oFilterBar;
  });
  //Act
  this.oController._retrieveFilterFields(oEvent);
  //Assert
  ok(stub_byId.calledOnce, '_retrieveFilterFields called successfully');
  stub_byId.restore();
});
test('Test to search table based on filter values', function () {
  //Arrange
  var oEvent = {}, sTableId = 'siemensUiTable', aFields = [];
  oEvent.getParameter = function (oParam) {
    if (oParam === 'selectionSet') {
      return;
    }
  };
  var stub_retrieveFilterFields = sinon.stub(this.oController, '_retrieveFilterFields', function (oEvent) {
    return [{}];
  });
  var stub_retrieveFilters = sinon.stub(this.oController, '_retrieveFilters', function (aFields) {
    return {
      'aFilters': [],
      'bAnd': true,
      '_bMultiFilter': true
    };
  });
  //Act
  this.oController._searchTable(oEvent, sTableId);
  //Assert
  ok(true, 'search table with filter values successful');
  stub_retrieveFilterFields.restore();
  stub_retrieveFilters.restore();
});
test('Test to Retrieves and globalizes table type _retrieveTableType', function () {
  this.oController.getComponentModel = function (oParam) {
    if (oParam === 'mainConfig') {
      return {
        getData: function () {
          return {
            CHART_HIDDEN: 0,
            CTRLID: 'CTRL1',
            DESCRIPTION: 'Title is coming from Backend',
            ENTITY_NAME: 'FreeDateCrossPlant',
            IS_HIERARCHY: 0,
            ODATA_SRV: 1,
            SERVICE_NAME: 'srv1.xsodata',
            ServiceColumns: {
              results: [{
                  COLOR_CODE: '#0048ab',
                  COLUMN: 'CALMONTH',
                  CTRLID: 'CTRL1',
                  CTYPE: 11,
                  CWIDTH: '107px',
                  DESCRIPTION: 'Description',
                  FILTER: 1,
                  FILTERTYPE: '',
                  IS_KFG: 0,
                  LABEL: 'Calmonth',
                  SORTORDER: 10,
                  STDRD: 0
                }]
            },
            TABLE_TITLE: 'Table Title',
            THRESHOLD: 100,
            VARIANT_HIDDEN: 0
          };
        }
      };
    }
  };
  this.oController._retrieveTableType();
  //Assert
  ok(true, '_retrieveTableType executed successfully');
});
test('Test to check for _createComboBoxControl function for Filtertype StaticSingleSelect', function () {
  //Arrange
  var sFilterId = 'id', sFilterType = 'StaticSingleSelect', oMultiComboBox = {};
  //Act
  oMultiComboBox = this.oController._createComboBoxControl(sFilterId, sFilterType);
  //Assert
  if (oMultiComboBox !== null) {
    ok(true, 'Multicombobox controls created');
  } else {
    ok(false, 'Multicombobox controls not created');
  }
});
test('Test to check for _createComboBoxControl function for Filtertype StaticMultiSelect', function () {
  //Arrange
  var sFilterId = 'id2', sFilterType = 'StaticMultiSelect', oMultiComboBox = {};
  //Act
  oMultiComboBox = this.oController._createComboBoxControl(sFilterId, sFilterType);
  //Assert
  if (oMultiComboBox !== null) {
    ok(true, 'Multicombobox controls created');
  } else {
    ok(false, 'Multicombobox controls not created');
  }
});
test('Test to check for _createComboBoxControl function for Filtertype default', function () {
  //Arrange
  var sFilterId = 'id3', sFilterType = '', oMultiComboBox = {};
  //Act
  oMultiComboBox = this.oController._createComboBoxControl(sFilterId, sFilterType);
  //Assert
  if (oMultiComboBox !== null) {
    ok(true, 'Multicombobox controls created');
  } else {
    ok(false, 'Multicombobox controls not created');
  }
});
test('Test to check _onDateChangeFilter function', function () {
  var oEvent = {};
  oEvent.getParameter = function (oParam) {
    if (oParam === 'valid') {
      return true;
    }
  };
  this.oController._onDateChangeFilter(oEvent);
  ok(true, '_onDateChangeFilter executed successfully');
});
test('Test to check Create fields by MultiInput type  _createFieldByType function', function () {
  //Arrange
  var iColumnType = 3, sFilterId = '_id1', oContext = {}, sFilterType = 'MultiInput', oFilterFieldContent = {}, sCustomDataType = 'string';
  var stub_createMultiInputControl = sinon.stub(this.oController, '_createMultiInputControl', function (sFilterId, oContext, sCustomDataType) {
    return;
  });
  //Act
  oFilterFieldContent = this.oController._createFieldByType(iColumnType, sFilterId, oContext, sFilterType);
  //Assert
  if (oFilterFieldContent !== null || oFilterFieldContent !== undefined) {
    ok(true, 'Fields created by Filter Type');
  } else {
    ok(false, 'Fields could not be created by Filter Type');
  }
  stub_createMultiInputControl.restore();
});
test('Test to check Create fields by default type  _createFieldByType function', function () {
  //Arrange
  var iColumnType = 3, sFilterId = '_idDefault', oContext = {}, sFilterType = '', oFilterFieldContent = {}, sCustomDataType = 'string';
  var stub_createMultiInputControl = sinon.stub(this.oController, '_createMultiInputControl', function (sFilterId, oContext, sCustomDataType) {
    return;
  });
  //Act
  oFilterFieldContent = this.oController._createFieldByType(iColumnType, sFilterId, oContext, sFilterType);
  //Assert
  if (oFilterFieldContent !== null || oFilterFieldContent !== undefined) {
    ok(true, 'Fields created by Filter Type');
  } else {
    ok(false, 'Fields could not be created by Filter Type');
  }
  stub_createMultiInputControl.restore();
});
test('Test to check Create fields by DateRangeSelection type  _createFieldByType function', function () {
  //Arrange
  var iColumnType = 3, sFilterId = '_id2', oContext = {}, sFilterType = 'DateRangeSelection', oFilterFieldContent = {};
  var stub_onDateChangeFilter = sinon.stub(this.oController, '_onDateChangeFilter', function () {
    return;
  });
  //Act
  oFilterFieldContent = this.oController._createFieldByType(iColumnType, sFilterId, oContext, sFilterType);
  //Assert
  if (oFilterFieldContent !== null || oFilterFieldContent !== undefined) {
    ok(true, 'Fields created by Filter Type');
  } else {
    ok(false, 'Fields could not be created by Filter Type');
  }
  stub_onDateChangeFilter.restore();
});
test('Test to check Create fields by DatePicker type  _createFieldByType function', function () {
  //Arrange
  var iColumnType = 3, sFilterId = '_id3', oContext = {}, sFilterType = 'DatePicker', oFilterFieldContent = {};
  var stub_onDateChangeFilter = sinon.stub(this.oController, '_onDateChangeFilter', function () {
    return;
  });
  //Act
  oFilterFieldContent = this.oController._createFieldByType(iColumnType, sFilterId, oContext, sFilterType);
  //Assert
  if (oFilterFieldContent !== null || oFilterFieldContent !== undefined) {
    ok(true, 'Fields created by Filter Type');
  } else {
    ok(false, 'Fields could not be created by Filter Type');
  }
  stub_onDateChangeFilter.restore();
});
test('Test to check Create fields by StaticSingleSelect type  _createFieldByType function', function () {
  //Arrange
  var iColumnType = 3, sFilterId = '_id4', oContext = {}, sFilterType = 'StaticSingleSelect', oFilterFieldContent = {};
  var stub_createComboBoxControl = sinon.stub(this.oController, '_createComboBoxControl', function (sFilterId, sFilterType) {
    return;
  });
  //Act
  oFilterFieldContent = this.oController._createFieldByType(iColumnType, sFilterId, oContext, sFilterType);
  //Assert
  if (oFilterFieldContent !== null || oFilterFieldContent !== undefined) {
    ok(true, 'Fields created by Filter Type');
  } else {
    ok(false, 'Fields could not be created by Filter Type');
  }
  stub_createComboBoxControl.restore();
});
test('Test to check Create fields by StaticMultiSelect type  _createFieldByType function', function () {
  //Arrange
  var iColumnType = 3, sFilterId = '_id5', oContext = {}, sFilterType = 'StaticMultiSelect', oFilterFieldContent = {}, sCustomDataType = 'string';
  var stub_createComboBoxControl = sinon.stub(this.oController, '_createComboBoxControl', function (sFilterId, sCustomDataType) {
    return;
  });
  //Act
  oFilterFieldContent = this.oController._createFieldByType(iColumnType, sFilterId, oContext, sFilterType);
  //Assert
  if (oFilterFieldContent !== null || oFilterFieldContent !== undefined) {
    ok(true, 'Fields created by Filter Type');
  } else {
    ok(false, 'Fields could not be created by Filter Type');
  }
  stub_createComboBoxControl.restore();
});
test('Test to check Create fields by Input type  _createFieldByType function', function () {
  //Arrange
  var iColumnType = 3, sFilterId = '_id6', oContext = {}, sFilterType = 'Input', oFilterFieldContent = {}, sCustomDataType = 'string';
  var stub_createInputControl = sinon.stub(this.oController, '_createInputControl', function (sFilterId, sCustomDataType) {
    return;
  });
  //Act
  oFilterFieldContent = this.oController._createFieldByType(iColumnType, sFilterId, oContext, sFilterType);
  //Assert
  if (oFilterFieldContent !== null || oFilterFieldContent !== undefined) {
    ok(true, 'Fields created by Filter Type');
  } else {
    ok(false, 'Fields could not be created by Filter Type');
  }
  stub_createInputControl.restore();
});
test('Test to check Create fields by Multicombobox type  _createFieldByType function', function () {
  //Arrange
  var iColumnType = 3, sFilterId = '_id7', oContext = {}, sFilterType = 'MultiComboBox', oFilterFieldContent = {}, sCustomDataType = 'string';
  var stub_createMultiComboBox = sinon.stub(this.oController, '_createMultiComboBox', function (sFilterId, sCustomDataType) {
    return;
  });
  //Act
  oFilterFieldContent = this.oController._createFieldByType(iColumnType, sFilterId, oContext, sFilterType);
  //Assert
  if (oFilterFieldContent !== null || oFilterFieldContent !== undefined) {
    ok(true, 'Fields created by Filter Type');
  } else {
    ok(false, 'Fields could not be created by Filter Type');
  }
  stub_createMultiComboBox.restore();
});
test('Test to check Create fields by Input Integer type  _createFieldByType function', function () {
  //Arrange
  var iColumnType = 3, sFilterId = '_id8', oContext = {}, sFilterType = 'InputInteger', oFilterFieldContent = {}, sCustomDataType = 'string';
  var stub_createInputIntegerControl = sinon.stub(this.oController, '_createInputIntegerControl', function (sFilterId, sCustomDataType) {
    return;
  });
  //Act
  oFilterFieldContent = this.oController._createFieldByType(iColumnType, sFilterId, oContext, sFilterType);
  //Assert
  if (oFilterFieldContent !== null || oFilterFieldContent !== undefined) {
    ok(true, 'Fields created by Filter Type');
  } else {
    ok(false, 'Fields could not be created by Filter Type');
  }
  stub_createInputIntegerControl.restore();
});
test('Test to create Input control _createInputControl function', function () {
  //Arrange
  var sFilterId = 'idInputControl1', sTypeValue = 'number', oInput = {};
  //Act
  oInput = this.oController._createInputControl(sFilterId, sTypeValue);
  //Assert
  if (oInput !== null || oInput !== undefined) {
    ok(true, 'Input control created');
  } else {
    ok(false, 'Could not be create Input control');
  }
});
test('Test to create Multicombobox control _createMultiComboBox function', function () {
  //Arrange
  var sFilterId = 'idMultiComboboxControl1', sTypeValue = 'string', oCombobox = {};
  //Act
  oCombobox = this.oController._createMultiComboBox(sFilterId, sTypeValue);
  //Assert
  if (oCombobox !== null || oCombobox !== undefined) {
    ok(true, 'Multicombobox control created');
  } else {
    ok(false, 'Could not be create Multicombobox control');
  }
});
test('Test to create InputInteger control _createInputIntegerControl function', function () {
  //Arrange
  var sFilterId = 'idInputIntegerControl1', sTypeValue = 'number', oInputInteger = {};
  //Act
  oInputInteger = this.oController._createInputIntegerControl(sFilterId, sTypeValue);
  //Assert
  if (oInputInteger !== null || oInputInteger !== undefined) {
    ok(true, 'InputInteger control created');
  } else {
    ok(false, 'Could not be create InputInteger control');
  }
});
test('Test _filterItemsFactory function', function () {
  var sId, oContext = {
      getProperty: function () {
        return;
      }
    };
  this.oController._filterItemsFactory(sId, oContext);
  ok('_filterItemsFactory called successfully');
});
test('Test to Creates value help dialog using _filterValueHelpRequest function', function () {
  //Arrange
  var oEvent = {}, sFieldID = 'LOCAT_CAL', sFieldText = 'Location', sEntitySet = '/FreeDateCrossPlant', oValueHelpDialog = {}, sColumnType = 11, oActual = {};
  oEvent.getParameter = function (sId) {
    if (sId === 'id') {
      return 'LOCAT_CAL';
    }
  };
  var stub_createValueHelpDialog = sinon.stub(this.oController, '_createValueHelpDialog', function (sFieldID, sFieldText, sEntitySet) {
    return {
      open: function () {
      },
      addStyleClass: function (sClass) {
      }
    };
  });
  var stub_setValueHelpTokens = sinon.stub(this.oController, '_setValueHelpTokens', function (oValueHelpDialog, oEvent) {
    return;
  });
  var stub_setSearchHelpColumns = sinon.stub(this.oController, '_setSearchHelpColumns', function (sFieldID, sFieldText, sColumnType, oValueHelpDialog) {
    return;
  });
  var stub_setSearchHelpData = sinon.stub(this.oController, '_setSearchHelpData', function () {
    return;
  });
  var stub_prepareRangeKeyFields = sinon.stub(this.oController, '_prepareRangeKeyFields', function (sFieldID, sFieldText, oValueHelpDialog) {
    return;
  });
  //Act
  this.oController._filterValueHelpRequest(oEvent);
  //Assert
  ok(true, '_filterValueHelpRequest executed successfully');
  stub_createValueHelpDialog.restore();
  stub_setValueHelpTokens.restore();
  stub_setSearchHelpColumns.restore();
  stub_setSearchHelpData.restore();
  stub_prepareRangeKeyFields.restore();
});
test('Test _createMultiInputControl function', function () {
  var sFilterId, oContext, sTypeValue;
  this.oController._createMultiInputControl(sFilterId, oContext, sTypeValue);
  ok('_createMultiInputControl called successfully');
});
//
// test("Test _createValueHelpDialog function", function () {
// 	var sFieldID, sFieldText, sEntitySet;
//
// 	this.oController._createValueHelpDialog(sFieldID, sFieldText, sEntitySet);
//
// 	ok("_createValueHelpDialog called successfully");
//
// });
test('Test _setValueHelpTokens function', function () {
  var oValueHelpDialog = {
      setTokens: function (sToken) {
      }
    }, oEvent = {
      getSource: function () {
        return {
          getTokens: function () {
          }
        };
      }
    };
  this.oController._setValueHelpTokens(oValueHelpDialog, oEvent);
  ok('_setValueHelpTokens called successfully');
});
test('Test _setSearchHelpColumns function', function () {
  var sFieldID, sFieldText, sColumnType, oValueHelpDialog = {
      getTable: function () {
        return {
          setModel: function () {
          },
          setEnableBusyIndicator: function () {
          }
        };
      }
    };
  this.oController._setSearchHelpColumns(sFieldID, sFieldText, sColumnType, oValueHelpDialog);
  ok('_setSearchHelpColumns called successfully');
});
test('Test to retrieve column model _retreiveColumnsModel function for sColumnType integer', function () {
  //Arrange
  var sFieldID = 'idColumnInt', sFieldText = 'Text1', sColumnType = 3, oColModel = {};
  //Act
  oColModel = this.oController._retreiveColumnsModel(sFieldID, sFieldText, sColumnType);
  //Assert
  if (oColModel !== null || oColModel !== undefined) {
    ok(true, 'column model returned successfully');
  } else {
    ok(false, 'couldnt not return column model');
  }
});
test('Test to retrieve column model _retreiveColumnsModel function for sColumnType float', function () {
  //Arrange
  var sFieldID = 'idColumnFloat', sFieldText = 'Text2', sColumnType = 7, oColModel = {};
  //Act
  oColModel = this.oController._retreiveColumnsModel(sFieldID, sFieldText, sColumnType);
  //Assert
  if (oColModel !== null || oColModel !== undefined) {
    ok(true, 'column model returned successfully');
  } else {
    ok(false, 'couldnt not return column model');
  }
});
test('Test to retrieve column model _retreiveColumnsModel function for sColumnType DateTime', function () {
  //Arrange
  var sFieldID = 'idColumnDateTime', sFieldText = 'Text3', sColumnType = 14, oColModel = {};
  //Act
  oColModel = this.oController._retreiveColumnsModel(sFieldID, sFieldText, sColumnType);
  //Assert
  if (oColModel !== null || oColModel !== undefined) {
    ok(true, 'column model returned successfully');
  } else {
    ok(false, 'couldnt not return column model');
  }
});
test('Test to retrieve column model _retreiveColumnsModel function for sColumnType date', function () {
  //Arrange
  var sFieldID = 'idColumnDate', sFieldText = 'Text4', sColumnType = 15, oColModel = {};
  //Act
  oColModel = this.oController._retreiveColumnsModel(sFieldID, sFieldText, sColumnType);
  //Assert
  if (oColModel !== null || oColModel !== undefined) {
    ok(true, 'column model returned successfully');
  } else {
    ok(false, 'couldnt not return column model');
  }
});
test('Test to retrieve column model _retreiveColumnsModel function for sColumnType MonthDate', function () {
  //Arrange
  var sFieldID = 'idColumnMonthDate', sFieldText = 'Text5', sColumnType = 17, oColModel = {};
  //Act
  oColModel = this.oController._retreiveColumnsModel(sFieldID, sFieldText, sColumnType);
  //Assert
  if (oColModel !== null || oColModel !== undefined) {
    ok(true, 'column model returned successfully');
  } else {
    ok(false, 'couldnt not return column model');
  }
});
test('Test to retrieve column model _retreiveColumnsModel function for sColumnType EdmDate', function () {
  //Arrange
  var sFieldID = 'idColumnEdmDate', sFieldText = 'Text6', sColumnType = 20, oColModel = {};
  //Act
  oColModel = this.oController._retreiveColumnsModel(sFieldID, sFieldText, sColumnType);
  //Assert
  if (oColModel !== null || oColModel !== undefined) {
    ok(true, 'column model returned successfully');
  } else {
    ok(false, 'couldnt not return column model');
  }
});
test('Test to retrieve column model _retreiveColumnsModel function for sColumnType EdmShortDate', function () {
  //Arrange
  var sFieldID = 'idColumnEdmShortDate', sFieldText = 'Text7', sColumnType = 21, oColModel = {};
  //Act
  oColModel = this.oController._retreiveColumnsModel(sFieldID, sFieldText, sColumnType);
  //Assert
  if (oColModel !== null || oColModel !== undefined) {
    ok(true, 'column model returned successfully');
  } else {
    ok(false, 'couldnt not return column model');
  }
});
test('Test to retrieve column model _retreiveColumnsModel function for sColumnType EdmTime', function () {
  //Arrange
  var sFieldID = 'idColumnEdmTime', sFieldText = 'Text8', sColumnType = 22, oColModel = {};
  //Act
  oColModel = this.oController._retreiveColumnsModel(sFieldID, sFieldText, sColumnType);
  //Assert
  if (oColModel !== null || oColModel !== undefined) {
    ok(true, 'column model returned successfully');
  } else {
    ok(false, 'couldnt not return column model');
  }
});
test('Test to retrieve column model _retreiveColumnsModel function for sColumnType default', function () {
  //Arrange
  var sFieldID = 'idColumnDefault', sFieldText = 'Text9', sColumnType = '', oColModel = {};
  //Act
  oColModel = this.oController._retreiveColumnsModel(sFieldID, sFieldText, sColumnType);
  //Assert
  if (oColModel !== null || oColModel !== undefined) {
    ok(true, 'column model returned successfully');
  } else {
    ok(false, 'couldnt not return column model');
  }
});
test('Test _setSearchHelpData function', function () {
  var stub_attachRequestsForControlBusyIndicator = sinon.stub(this.oController, 'attachRequestsForControlBusyIndicator', function () {
      return;
    }), oModel, sFieldID, sEntitySet, oValueHelpDialog = {
      setModel: function () {
      },
      getTable: function () {
        return {
          bindRows: function () {
          }
        };
      }
    }, oValueHelpDialogTable = {};
  this.oController._setSearchHelpData(oModel, sFieldID, oValueHelpDialog, sEntitySet);
  ok(stub_attachRequestsForControlBusyIndicator.calledOnce, '_setSearchHelpData called successfully');
  //ok( stub_attachRequestsForControlBusyIndicator.calledWith(oModel, oValueHelpDialogTable), "_searchTable was successfully called with two parameters oModel, oValueHelpDialogTable!");
  stub_attachRequestsForControlBusyIndicator.restore();
});
test('Test _prepareRangeKeyFields function', function () {
  var sFieldID, sFieldText, oValueHelpDialog = {
      setRangeKeyFields: function () {
      }
    };
  this.oController._prepareRangeKeyFields(sFieldID, sFieldText, oValueHelpDialog);
  ok('_prepareRangeKeyFields called successfully');
});
test('Test _onRouteMatched function with tab arguements', function () {
  this.oController._aValidTabKeys = [
    'Table',
    'Chart',
    'Tree'
  ];
  var oEvent = {
    mParameters: { name: 'tableviewer' },
    arguments: { tab: 'Table' }
  };
  oEvent.getParameter = function (oParam) {
    if (oParam === 'arguments') {
      return { tab: 'Table' };
    }
  };
  this.oController._onRouteMatched(oEvent);
  ok(true, '_onRouteMatched called successfully');
});
test('Test _onRouteMatched function without arguements and no hierarchy', function () {
  var oEvent = {};
  oEvent.getParameter = function (oParam) {
    if (oParam === 'arguments') {
      return {};
    }
  };
  this.oOwnerComponentStub.getModel = function () {
    return {
      oData: {},
      getProperty: function () {
        return true;
      }
    };
  };
  this.oController._onRouteMatched(oEvent);
  ok(true, '_onRouteMatched called successfully');
});
test('Test _onRouteMatched function without arguements', function () {
  var oEvent = {};
  oEvent.getParameter = function (oParam) {
    if (oParam === 'arguments') {
      return {};
    }
  };
  this.oOwnerComponentStub.getModel = function () {
    return {
      oData: { Config: { hierarchy: 1 } },
      getProperty: function () {
        return true;
      }
    };
  };
  this.oController._onRouteMatched(oEvent);
  ok(true, '_onRouteMatched called successfully');
});
test('Test onNavBack function', function () {
  sap.ushell = {
    Container: {
      getService: function (oParam) {
        return {
          toExternal: function (external) {
            return {
              target: {},
              params: ''
            };
          }
        };
      }
    }
  };
  this.oController.onNavBack();
  ok(true, 'onNavBack called successfully');
  delete sap.ushell;
});
test('Test onTabSelect function', function () {
  //Arrange
  var oEvent = {
    getParameter: function (oParam) {
      if (oParam === 'selectedKey') {
        return 'Chart';
      }
    }
  };
  //Act
  this.oController.onTabSelect(oEvent);
  //Assert
  ok('onTabSelect called successfully');
});
//Qunit test for Variants functionality
// test("Test the variant selection event for Standard", function () {
// 	//Arrange
// 	var oEvent = {
// 		getParameter: function (sKey) {
// 			if (sKey === "key") {
// 				return "*standard*";
// 			}
// 		},
// 		getSource: function () {
// 			return {
// 				getItemByKey: function (sKey) {
// 					return {
// 						data: function () {
//
// 						}
// 					}
// 				}
// 			}
// 		}
// 	}
// 	//Act
// 	this.oController.onVariantSelect(oEvent);
// 	//Assert
// 	ok(true, "Variant selected successfully");
// });
//
// test("Test the variant selection event for other variant type", function () {
// 	//Arrange
// 	var oEvent = {
// 		getParameter: function (sKey) {
// 			if (sKey === "key") {
// 				return "";
// 			}
// 		},
// 		getSource: function () {
// 			return {
// 				getItemByKey: function (sKey) {
// 					return {
// 						data: function (filters) {
// 							return "%5B%7B%22sFieldName%22%3A%22LOCAT_CAL%22%2C%22aTokens%22%3A%22%5B%7B%5C%22sKey%5C%22%3A%5C%22range_0%5C%22%2C%5C%22sText%5C%22%3A%5C%22DA1...FLE%5C%22%2C%5C%22sCustomData%5C%22%3A%5C%22%7B%5C%5C%5C%22exclude%5C%5C%5C%22%3Afalse%2C%5C%5C%5C%22operation%5C%5C%5C%22%3A%5C%5C%5C%22BT%5C%5C%5C%22%2C%5C%5C%5C%22keyField%5C%5C%5C%22%3A%5C%5C%5C%22LOCAT_CAL%5C%5C%5C%22%2C%5C%5C%5C%22value1%5C%5C%5C%22%3A%5C%5C%5C%22DA1%5C%5C%5C%22%2C%5C%5C%5C%22value2%5C%5C%5C%22%3A%5C%5C%5C%22FLE%5C%5C%5C%22%7D%5C%22%7D%2C%7B%5C%22sKey%5C%22%3A%5C%22range_1%5C%22%2C%5C%22sText%5C%22%3A%5C%22%21%28%3DDA1%29%5C%22%2C%5C%22sCustomData%5C%22%3A%5C%22%7B%5C%5C%5C%22exclude%5C%5C%5C%22%3Atrue%2C%5C%5C%5C%22operation%5C%5C%5C%22%3A%5C%5C%5C%22EQ%5C%5C%5C%22%2C%5C%5C%5C%22keyField%5C%5C%5C%22%3A%5C%5C%5C%22LOCAT_CAL%5C%5C%5C%22%2C%5C%5C%5C%22value1%5C%5C%5C%22%3A%5C%5C%5C%22DA1%5C%5C%5C%22%2C%5C%5C%5C%22value2%5C%5C%5C%22%3A%5C%5C%5C%22%5C%5C%5C%22%7D%5C%22%7D%5D%22%7D%5D"
// 						}
// 					}
// 				}
// 			}
// 		}
// 	}
// 	//Act
// 	this.oController.onVariantSelect(oEvent);
// 	//Assert
// 	ok(true, "Variant selected successfully");
// });
test('Test saving of variant onVariantSave', function () {
  //Arrange
  var oEvent = {};
  oEvent.getParameter = function (sProperty) {
    if (sProperty === 'global' || sProperty === 'def') {
      return 1;
    } else if (sProperty === 'key') {
      return 'std';
    } else if (sProperty === 'name') {
      return 'variant';
    }
  };
  //Act
  this.oController.onVariantSave(oEvent);
  //Assert
  ok(true, 'Variants saved successfully');
});

test("Test manage variants onVariantManage", function() {
//Arrange
var oEvent = {
  getSource: function() {
    return {
      getVariantItems : function() {
        return [{
           getBindingContext: function(sVariantPath) {
              return {
                getObject : function() {
                  return {}
                },
              sPath: {
               replace : function(VariantsGet, VariantsSet) {
                return "VariantsSet"
               } 
              }
              }
            },
            getProperty: function(key) {
              if(key === "key") {
                return "SV1470280803733";  
              }else {
                return;
              }
              
            }
        }]
      }
      }
    
  },
  getParameters: function() {
    return {
      renamed : [],
      deleted : []
    }
  },
  getParameter: function(oParam) {
    return "SV1470280803733"
  }
};
this.oController._previousDefaultKey === "*standard*";
//Act
this.oController.onVariantManage(oEvent);
//Assert
ok(true, "Variants manage success");
});

test("Test success handler for update variant model _handleSuccessUpdateVariantModel", function() {
//Arrange
var oData = {}, response = {
  requestUri: {
    split: sinon.stub().returns(["sPath1","sPath2"])
  }
};

//Act
this.oController._handleSuccessUpdateVariantModel(oData, response);
//Assert
ok(true, "Success handler for update variant model executed successfully");
});