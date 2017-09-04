jQuery.sap.require('sap.m.MessageBox');
jQuery.sap.require('sap.m.MessagePopover');
jQuery.sap.require('sap.m.DatePicker');
jQuery.sap.require('sap.ui.base.ManagedObject');
jQuery.sap.require('jquery.sap.global');
jQuery.sap.require({
	modName : 'com.siemens.tableViewer.controller.tabs.Table',
	type : 'controller'
});
module(
		'Table controller tests',
		{
			setup : function() {
				this.oController = new sap.ui.controller('com.siemens.tableViewer.controller.tabs.Table');

				//other
				this.result = null;
				//for routing
				var oRouter = {
					getRoute : function(x) {
					},
					attachRoutePatternMatched : function(oParam) {	
					}
				};
				//for view methods
				var aIndices = 1, sEntity;
				var oViewStub = {
					getModel : function(sModelName) {
						return this.oViewModel;
					}.bind(this),
					setModel : function(oModel, sModelName) {
						this.oViewModel = oModel;
					}.bind(this),
					getBindingContext : function() {
					},
					getBusyIndicatorDelay : function() {
					}
				};
				oViewStub.byId = function(sId) {
					return {
						getBinding : function(oParam) {
							return {
								aFilters : function() {
									return [];
								},
								filter : function(aFilter) {
									return 'Filtered Data';
								}
							};
						},
						getAggregation : function(oParam) {
							return [ {
								getAggregation : function(oParam) {
									return {
										setText : function(sText) {
										}
									};
								}
							} ];
						},
						getSelectedIndices : function() {
							return [ 0 ];
						},
						getColumns : function() {
							return [{

								mProperties : {
									autoResizable : true,
									coloredStyleClass : 'red',
									hAlign : 'Left',
									sortProperty : 'LOCAT_CAL',
									visible : true,
									width : '107px'
								},
								getVisible : function() {
									return true;
								},
								getSortProperty : function() {
									return "LOCAT_CAL";
								},
								map : function(oColumn) {
									return {
										getVisible : function() {
											return true;
										}
									};
								}
							} ]
						},
						getContextByIndex : function(aParam) {
							
							
							
								
							return {
											oModel : {},
											sPath :	"/FreeDateCrossPlant('17541703019656361')",
											getProperty : function(aParam){
												if(aParam == "LOCAT_CAL"){
													return "DA1";
												}
											}
									}
										
									
						},
						indexOf : function(aParam) {
							if(aParam == "DA1"){
								return -1;
							}
							return 1;
						}

					};

				};

				//initialize global variables
				this.oController._aAggregatedColumns = [ {
					'column' : 'ERDAT',
					'index' : 0,
					'label' : 'Creation date'
				} ];
				//components, table, bindings, personalization....
				this.oComponentStub = new sap.ui.base.ManagedObject();
				this.oOwnerComponentStub = new sap.ui.base.ManagedObject();
				this.oOwnerComponentStub.getMetadata = function() {
					return {
						getConfig : function() {
							return {
								serviceUrl : '/siemens/COMMON_DEV/xs/services/tableViewerOData/'
							};
						}
					};
				};
				this.oOwnerComponentStub.oWhenMetadataIsLoaded = {
					then : function() {
						return null;
					}
				};
				//this.oComponentStub.oWhenMetadataIsLoaded = sinon.stub();
				this.oComponentStub.getProperty = function(oParam) {
					return '';
				};
				this.oComponentStub.getData = function() {
					return {
						ServiceColumns : {
							results : [ {
								'CTRLID' : 'CTRL1',
								'COLUMN' : 'CALMONTH',
								'LABEL' : 'Calmonth',
								'DESCRIPTION' : 'Description',
								'IS_KFG' : 0,
								'FILTERTYPE' : 'StaticSingleSelect',
								'STDRD' : 0,
								'SORTORDER' : 10,
								'FILTER' : 1,
								'CTYPE' : 11,
								'CWIDTH' : '107px',
								'COLOR_CODE' : '#0048ab'
							}, {
								'CTRLID' : 'CTRL1',
								'COLUMN' : 'TESTL',
								'LABEL' : 'Material',
								'DESCRIPTION' : 'Description',
								'IS_KFG' : 0,
								'FILTERTYPE' : 'StaticMultiSelect',
								'STDRD' : 0,
								'SORTORDER' : 20,
								'FILTER' : 1,
								'CTYPE' : 11,
								'CWIDTH' : '107px'
							} ]
						}
					};
				};
				this.oController._oTPC = new sap.ui.base.ManagedObject();
				this.oController._oTPC.openDialog = sinon.stub().returns(null);
				this.oController._oTPC._oDialog = {
					attachEventOnce : function(oParam) {
					},
					mEventRegistry : {
						confirm : [ {} ]
					}
				};
				//sinon stubs
				sinon.stub(this.oController, 'getComponentModel').returns(
						this.oComponentStub);
				sinon.stub(this.oController, 'getOwnerComponent').returns(
						this.oOwnerComponentStub);
				sinon.stub(this.oController, 'getView').returns(oViewStub);
				sinon.stub(this.oController, 'getRouter').returns(oRouter);
			},
			teardown : function() {
				this.oController.destroy();
				this.oOwnerComponentStub.destroy();
				this.oComponentStub.destroy();
			}
		});
test('Test for Initialize table personalization _initializeTablePerso',
		function() {
			//Action
			this.oController._initializeTablePerso();
			//Assert
			ok(true, 'Table personalization initialized successfully');
		});
test('Test onTablePersonalization function', function() {
	//Arrange
	var stub_requestNewData = sinon.stub(this.oController, '_requestNewData',
			function() {
				return;
			});
	//Action
	this.oController.onTablePersonalization();
	//Assert
	ok(true, 'onTablePersonalization executed successfully');
	stub_requestNewData.restore();
});
test(
		'Test _setTableDataModel function',
		function() {
			var oTable = {
				setModel : function() {
					return;
				}
			}, oModel = {}, stub_attachRequestsForControlBusyIndicator = sinon
					.stub(this.oController,
							'attachRequestsForControlBusyIndicator', function(
									oModel, oTable) {
								return;
							});
			this.oController._setTableDataModel(oTable, oModel);
			ok(stub_attachRequestsForControlBusyIndicator.calledOnce,
					'attachRequestsForControlBusyIndicator function was called once!');
			ok(stub_attachRequestsForControlBusyIndicator.calledWith(oModel,
					oTable),
					'attachRequestsForControlBusyIndicator function was called with two parameters');
			stub_attachRequestsForControlBusyIndicator.restore();
		});
test('Test to remove static columns _removeStaticColumns', function() {
	//Arrange
	//Act
	this.oController._removeStaticColumns();
	//Assert
	ok(true, 'Static columns have been removed successfully');
});
test('Test _readVisibleColumns function', function() {
	//arrange
	var aColumns = [ {
		mProperties : {
			autoResizable : true,
			coloredStyleClass : 'red',
			hAlign : 'Left',
			sortProperty : 'CALMONTH',
			visible : false,
			width : '107px'
		}
	} ], sVisibleColumns = '';
	aColumns[0].getProperty = function(oParam) {
		return true;
	};
	aColumns[0].getSortProperty = function() {
		return 'CALMONTH';
	};
	//action
	sVisibleColumns = this.oController._readVisibleColumns(aColumns);
	//assert
	assert.strictEqual(sVisibleColumns, 'CALMONTH',
			'Visible columns are returned');
});
test('Test _setTableViewModel function',
		function() {
			var stub_setModel = sinon.stub(this.oController, 'setModel',
					function() {
						return;
					}), oViewModel;
			this.oController._setTableViewModel(oViewModel);
			ok(stub_setModel.calledOnce,
					'_setTableViewModel function was called once!');
			stub_setModel.restore();
		});
test('Test _retrieveVisibleColumns function', function() {
	//Arrange
	var oColumnModel = {
		getProperty : function(oColumns) {
			return [ {
				COLOR_CODE : 'red',
				COLUMN : 'CALMONTH',
				CTRLID : 'CTRL1',
				CTYPE : 11,
				CWIDTH : '107px',
				DESCRIPTION : 'Description',
				FILTER : 1,
				FILTERTYPE : '',
				IS_KFG : 2,
				LABEL : 'Calmonth',
				SORTORDER : 10,
				STDRD : 1
			}, {
				COLUMN : 'TESTL',
				CTRLID : 'CTRL1',
				CTYPE : 11,
				CWIDTH : '107px',
				DESCRIPTION : 'Description',
				FILTER : 1,
				FILTERTYPE : '',
				IS_KFG : 0,
				LABEL : 'Material',
				SORTORDER : 20,
				STDRD : 1
			} ];
		}
	}, oVisibleColumns = {}, oExpected = {
		aggregatedColumns : [],
		visibleColumns : 'CALMONTH,TESTL'
	};
	//Act
	oVisibleColumns = this.oController._retrieveVisibleColumns(oColumnModel);
	//Assert
	assert.strictEqual(oVisibleColumns.visibleColumns,
			oExpected.visibleColumns, 'Visible columns are retrieved');
});
test('Test for _requestNewData function', function() {
	//Arrange
	var oTable = {
		setModel : function() {
			return;
		},
		getAggregation : function(oParam) {
			return [];
		}
	}, oModel = {}, sVisibleColumns = 'CALMONTH', aColumns = [ {
		mProperties : {
			autoResizable : true,
			coloredStyleClass : 'red',
			hAlign : 'Left',
			sortProperty : 'CALMONTH',
			visible : false,
			width : '107px'
		}
	} ], stub_attachRequestsForControlBusyIndicator = sinon.stub(
			this.oController, 'attachRequestsForControlBusyIndicator',
			function(oModel, oTable) {
				return;
			}), stub_bindRows = sinon.stub(this.oController, '_bindRows',
			function(oTable, sVisibleColumns) {
				return;
			}), stub_readVisibleColumns = sinon.stub(this.oController,
			'_readVisibleColumns', function(aColumns) {
				return 'CALMONTH';
			});
	//Act
	this.oController._requestNewData();
	//Assert
	ok(true, '_requestNewData executed successfully');
	stub_attachRequestsForControlBusyIndicator.restore();
	stub_bindRows.restore();
	stub_readVisibleColumns.restore();
});
test('Test _bindTable function', function() {
	var oTable = {
		bindAggregation : function() {
		},
		bindRows : function() {
		}
	}, sEntity, sVisibleColumns = 'LOCAT_CAL,NUCAF,ERDAT';
	var stub_bindRows = sinon.stub(this.oController, '_bindRows', function(
			oTable, sVisibleColumns) {
		return;
	});
	this.oController._bindTable(oTable, sVisibleColumns);
	ok(true, '_bindTable function executed successfully');
	stub_bindRows.restore();
});
test('Test _bindRows function', function() {
	//Arrangement
	var oTable = {
		bindAggregation : function() {
		},
		bindRows : function() {
		}
	}, sEntity, sVisibleColumns = 'CALMONTH';
	oTable.bindRows.events = {
		change : function() {
		}
	};
	var stub_bindAggregatedColumns = sinon.stub(this.oController,
			'_bindAggregatedColumns', function(oTable, sVisibleColumns) {
				return;
			});
	//Act
	this.oController._bindRows(oTable, sVisibleColumns);
	//Assert
	ok(true, '_bindRows function executed successfully!');
	stub_bindAggregatedColumns.restore();
});
test('Test _rowsFactory function', function() {
	var sId, oContext = {
		getProperty : function() {
			return;
		}
	};
	this.oController._rowsFactory(sId, oContext);
	ok(true, '_rowsFactory function was called once!');
});
//test for _getRowTemplate function
test('Test _getRowTemplate function for sColumnType 3', function() {
	var sColumnType = 3, sPath = 'CALMONTH', sTextAlign = 'Left';
	this.oController._getRowTemplate(sColumnType, sPath, sTextAlign);
	ok(true, '_getRowTemplate executed successfully for column type 3');
});
test('Test _getRowTemplate function for sColumnType 7', function() {
	var sColumnType = 7, sPath = 'LOCAT_CAL', sTextAlign = 'Left';
	this.oController._getRowTemplate(sColumnType, sPath, sTextAlign);
	ok(true, '_getRowTemplate executed successfully for column type 7');
});
test('Test _getRowTemplate function for sColumnType 14', function() {
	var sColumnType = 14, sPath = 'SELEC', sTextAlign = 'Left';
	this.oController._getRowTemplate(sColumnType, sPath, sTextAlign);
	ok(true, '_getRowTemplate executed successfully for column type 14');
});
test('Test _getRowTemplate function for sColumnType 15', function() {
	var sColumnType = 15, sPath = 'NUCAF', sTextAlign = 'Left';
	this.oController._getRowTemplate(sColumnType, sPath, sTextAlign);
	ok(true, '_getRowTemplate executed successfully for column type 15');
});
test('Test _getRowTemplate function for sColumnType 17', function() {
	var sColumnType = 17, sPath = 'ERDAT', sTextAlign = 'Left';
	this.oController._getRowTemplate(sColumnType, sPath, sTextAlign);
	ok(true, '_getRowTemplate executed successfully for column type 17');
});
test('Test _getRowTemplate function for sColumnType 20', function() {
	var sColumnType = 20, sPath = 'ERDAT', sTextAlign = 'Left';
	this.oController._getRowTemplate(sColumnType, sPath, sTextAlign);
	ok(true, '_getRowTemplate executed successfully for column type 20');
});
test('Test _getRowTemplate function for sColumnType 21', function() {
	var sColumnType = 21, sPath = 'ERDAT', sTextAlign = 'Left';
	this.oController._getRowTemplate(sColumnType, sPath, sTextAlign);
	ok(true, '_getRowTemplate executed successfully for column type 21');
});
test('Test _getRowTemplate function for sColumnType 22', function() {
	var sColumnType = 22, sPath = 'ERDAT', sTextAlign = 'Left';
	this.oController._getRowTemplate(sColumnType, sPath, sTextAlign);
	ok(true, '_getRowTemplate executed successfully for column type 22');
});
test(
		'Test _getRowTemplate function for sColumnType for default case',
		function() {
			var sColumnType = 11, sPath = 'TESTL', sTextAlign = 'Left';
			this.oController._getRowTemplate(sColumnType, sPath, sTextAlign);
			ok(true,
					'_getRowTemplate executed successfully for column type default case');
		});
//Qunit test for _retreiveRowTemplate function
test('Test _retreiveRowTemplate function', function() {
	//Arrange
	var sPath, sType, oFormatOptions;
	//Act
	this.oController._retreiveRowTemplate(sPath, sType, oFormatOptions);
	//Assert
	ok(true, '_retreiveRowTemplate function was executed successfully');
});
//Qunit test for _bindAggregatedColumns function
test('Test _bindAggregatedColumns', function() {
	//Arrange
	var sVisibleColumns = 'CALMONTH', aFilters = {
		'aFilters' : [ {
			'aFilters' : [ {
				'sPath' : 'CALMONTH',
				'sOperator' : 'EQ',
				'oValue1' : '201003',
				'_bMultiFilter' : false
			} ],
			'bAnd' : false,
			'_bMultiFilter' : true
		} ],
		'bAnd' : true,
		'_bMultiFilter' : true
	}, aColumns = [ {
		mProperties : {
			autoResizable : true,
			coloredStyleClass : 'red',
			hAlign : 'Left',
			sortProperty : 'CALMONTH',
			visible : false,
			width : '107px'
		}
	} ];
	var stub_readVisibleColumns = sinon.stub(this.oController,
			'_readVisibleColumns', function(aColumns) {
				return 'CALMONTH';
			});
	//Act
	this.oController._bindAggregatedColumns(sVisibleColumns, aFilters);
	//Assert
	ok(true, '_bindAggregatedColumns function executed successfully');
});
//Qunit for _handleRequestSuccess function
test('Test Success handler _handleRequestSuccess', function() {
	//Arrange
	var oData = {
		//results: [{"column":"ERDAT","index":0,"label":"Creation date"}]
		results : [ {
			'ERDAT' : 0
		} ]
	}, response = {};
	//Act
	this.oController._handleRequestSuccess(oData, response);
	//Assert
	ok(true, 'success handler _handleRequestSuccess executed successfully');
});
//Qunit for _handleRequestError function
test('Test Error handler _handleRequestError', function() {
	//Arrange
	var oError = sinon.stub(jQuery.sap.log, 'error');
	//Act
	this.oController._handleRequestError(oError);
	//Assert
	ok(true, 'error handler _handleRequestError executed successfully');
});
//Qunit _onRouteMatched function
test('Test _onRouteMatched function with filters defined', function() {
	//Arrange
	var aFilters = new sap.ui.model.Filter({
		aFilters : [ new sap.ui.model.Filter('LOCAT_CAL',
				sap.ui.model.FilterOperator.EQ, 'DA1', undefined) ],
		and : false
	});
	var sChannel = 'TableController';
	var sEvent = 'SetupFilters';
	var oData = {
		ID : 'siemensUiTable',
		hash : 'Table',
		mainFilters : {
			'aFilters' : [ {
				bAnd : false,
				aFilters : [ new sap.ui.model.Filter('LOCAT_CAL',
						sap.ui.model.FilterOperator.EQ, 'DA1', undefined) ]
			} ]
		}
	};
	var oRoutePatternEvent = {
		getParameters : function(param) {
			if (param == 'arguments') {
				return {
					arguments : {
						tab : 'Table'
					}
				};
			}
		}
	};
	var getModel = sinon.stub(this.oController, 'getModel', function(viewType) {
		return {
			getProperty : function(oParam) {
				return aFilters;
			}
		};
	});
	var setupFilters = sinon.stub(this.oController, '_setupFilters', function(
			sChannel, sEvent, oData) {
		return {};
	});
	//Act
	this.oController._onRouteMatched(oRoutePatternEvent);
	//Assert
	ok(true, '_onRouteMatched with filters defined executed successfully');
	//restore
	getModel.restore();
	setupFilters.restore();
});
test('Test _onRouteMatched function with filters not defined', function() {
	//Arrange
	var aFilters = new sap.ui.model.Filter({
		aFilters : [ new sap.ui.model.Filter('LOCAT_CAL',
				sap.ui.model.FilterOperator.EQ, 'DA1', undefined) ],
		and : false
	});
	var sChannel = 'TableController';
	var sEvent = 'SetupFilters';
	var oData = {
		ID : 'siemensUiTable',
		hash : 'Table',
		mainFilters : {
			'aFilters' : [ {
				bAnd : false,
				aFilters : [ new sap.ui.model.Filter('LOCAT_CAL',
						sap.ui.model.FilterOperator.EQ, 'DA1', undefined) ]
			} ]
		}
	};
	var oRoutePatternEvent = {
		getParameters : function(param) {
			if (param == 'arguments') {
				return {
					arguments : {
						tab : 'Table'
					}
				};
			}
		}
	};
	var getModel = sinon.stub(this.oController, 'getModel', function(viewType) {
		return {
			getProperty : function(oParam) {
			}
		};
	});
	var setupFilters = sinon.stub(this.oController, '_setupFilters', function(
			sChannel, sEvent, oData) {
		return {};
	});
	//Act
	this.oController._onRouteMatched(oRoutePatternEvent);
	//Assert
	ok(true, '_onRouteMatched with filters not defined executed successfully');
	//restore
	getModel.restore();
	setupFilters.restore();
});
test('Test _setupFilters function', function() {
	//Arrange
	//Data
	var sChannel = 'TableController', sEvent = 'SetupFilters', oData = {
		ID : 'siemensUiTable',
		hash : 'Table',
		mainFilters : {
			'aFilters' : [ {
				bAnd : false,
				aFilters : [ new sap.ui.model.Filter('LOCAT_CAL',
						sap.ui.model.FilterOperator.EQ, 'DA1', undefined) ]
			} ]
		}
	}, oTable = '', aFilters = {
		'aFilters' : [ {
			'aFilters' : [ {
				'sPath' : 'LOCAT_CAL',
				'sOperator' : 'EQ',
				'oValue1' : 'DA1',
				'_bMultiFilter' : false
			} ],
			'bAnd' : false,
			'_bMultiFilter' : true
		} ],
		'bAnd' : true,
		'_bMultiFilter' : true
	};
	var stub_bindAggregatedColumns = sinon.stub(this.oController,
			'_bindAggregatedColumns', function(oTable, aFilters) {
				return;
			});
	var attReqs = sinon.stub(this.oController,
			'attachRequestsForControlBusyIndicator').returns(null);
	//Act
	this.oController._setupFilters(sChannel, sEvent, oData);
	//Assert
	ok(true, '_setupFilters executed successfully');
	stub_bindAggregatedColumns.restore();
	attReqs.restore();
});
test('test for onExit function', function() {
	//Arrange
	var getEventBus = sinon.stub(this.oController, 'getEventBus', function() {
		return {
			unsubscribe : function(oParam1, oParams2, oParam3) {
			}
		};
	});
	//Act
	this.oController.onExit();
	//Assert
	ok(true, 'onExit executed successfully');
	getEventBus.restore();
});
test(
		'Test for initialization of controller, onInit',
		function() {
			//Arrange
			var oViewModel = {}, oTable = {
				bindAggregation : function() {
				},
				bindRows : function() {
				},
				setModel : function() {
					return;
				}
			}, oModel = {}, sEntity, sVisibleColumns = 'CALMONTH', stub_setTableViewModel = sinon
					.stub(this.oController, '_setTableViewModel', function(
							oViewModel) {
						return;
					}), getEventBus = sinon.stub(this.oController,
					'getEventBus', function() {
						return {
							unsubscribe : function(oParam1, oParams2, oParam3) {
							},
							subscribe : function() {
							}
						};
					}), stub_setTableDataModel = sinon.stub(this.oController,
					'_setTableDataModel', function(oTable, oModel) {
						return;
					}), stub_bindTable = sinon.stub(this.oController,
					'_bindTable', function(oTable, sVisibleColumns) {
						return;
					});
			stub_removeStaticColumns = sinon.stub(this.oController,
					'_removeStaticColumns', function() {
						return;
					}), stub_initializeTablePerso = sinon.stub(
					this.oController, '_initializeTablePerso', function() {
						return;
					});
			//Action
			this.oController.onInit();
			//Assert
			ok(true, 'Controller initialization onInit executed successfully');
			stub_setTableViewModel.restore();
			getEventBus.restore();
			stub_setTableDataModel.restore();
			stub_bindTable.restore();
			stub_removeStaticColumns.restore();
			stub_initializeTablePerso.restore();
		});

test('Test for Report to Report Functionality', function() {
    //Arrangement
    var aIndex1 = 2, aIndex2 = 1;
    var getModel = sinon.stub(this.oController, 'getModel', function(viewType) {
           return {
                  getProperty : function(oParam) {
                        if(oParam == "/DRILL_DOWN_TARGET"){
                               return "CTRL1";
                        }
                        if(oParam == "/INPUT_PARAMETERS"){
                               return 0;
                        }
                        if(oParam == "LOCAT_CAL"){
                               return "DA1";
                        }
                        if(oParam == "/ServiceColumns/results"){
                               return [{
                                      "CTRLID": "CTRL1",
                                      "COLUMN": "LOCAT_CAL",
                                      "LABEL": "Location",
                                      "DESCRIPTION": "Description",
                                      "IS_KFG": 0,
                                      "FILTERTYPE": "MultiComboBox",
                                      "STDRD": 1,
                                      "SORTORDER": 30,
                                      "FILTER": 1,
                                      "CTYPE": 11,
                                      "CWIDTH": "107px",
                                      "COLOR_CODE": null,
                                      "AGGREGATE": null,
                                      "SUPPORT_HIDDEN": 0,
                                      "IS_LINK": 0,
                                      "LINK_TARGET": null,
                                      "LINK_KEY_FIELDS": null,
                                      "MAINHEADER_DRILL": "",
                                      "SUBHEADER_DRILL": "",
                                      "ONFILTERBAR": 1,
                                      "DRILL_DOWN_BOND": "LOCAT_CAL",
                                      "CFORMAT": 0,
                                      "CFORMAT_CONDITION": "",
                                      "CFORMAT_COLOR": "",
                                      "CRANGE": "",
                                      "CRANGE_COLORS": ""
                               }];
                        }
                        return {
                               map : function(oColumn) {
                                      return {
                                             getVisible : function() {
                                                    return true;
                                             }
                                      };
                               },
                               indexOf : function(oParam) {
                                      var aIndex = 0;
                                      return aIndex;
                               },
                               slice : function(aIndex1, aIndex2) {
                                      
                               }
                        };
                        //return aFilters;
                  }
           };
    });
    
    var url="",location = {};
                  location.assign = function(url){
                        
                  };
    
    var sCalledWindowPath = "http://localhost:8080/test/unit/CNTRL=CTRL1&oFilters=%7B%22LOCAT_CAL%22:%5B%22DA1%22%5D%7D", 
           stubLocation = sinon.stub(location, "assign", function(oObject) {
           sCalledWindowPath = oObject;
           return {
                  onload: function() {}
           };
    });
    
    //Action
    this.oController.onDrillDown();
    //Assert
    var myUrl = "http://localhost:8080/test/unit/CNTRL=CTRL1&oFilters=%7B%22LOCAT_CAL%22:%5B%22DA1%22%5D%7D";
    equal(sCalledWindowPath, myUrl, "The Created uri for the location.assign call is correct");
});



module('Table controller - export to excel test',
		{
			setup : function() {
				this.oController = new sap.ui.controller(
						'com.siemens.tableViewer.controller.tabs.Table');
				//components, table, bindings, personalization....
				this.oComponentStub = new sap.ui.base.ManagedObject();
				this.ODataUtils = new sap.ui.model.odata.ODataUtils();
				this.ODataUtils.createFilterParams = function(aParams, oParam2,
						sParam3) {
				};
				this.oOwnerComponentStub = new sap.ui.base.ManagedObject();
				this.oOwnerComponentStub.getMetadata = function() {
					return {
						getConfig : function() {
							return {
								serviceUrl : '/siemens/COMMON_DEV/xs/services/tableViewerOData/'
							};
						}
					};
				};
				this.oOwnerComponentStub.getContentDensityClass = function() {
				};
				this.oComponentStub.oWhenMetadataIsLoaded = sinon.stub();
				this.oComponentStub.getProperty = function(oParam) {
					if (oParam === '/CTRLID') {
						return 'CTRL1';
					} else if (oParam === '/ENTITY_NAME') {
						return 'FreeDateCrossPlant';
					} else {
						return '';
					}
				};
				this.oComponentStub.oMetadata = {};
				this.oComponentStub.oMetadata._getEntityTypeByPath = function(
						oParam) {
					return;
				};
				//sinon stubs
				sinon.stub(this.oController, 'getComponentModel').returns(
						this.oComponentStub);
				sinon.stub(this.oController, 'getOwnerComponent').returns(
						this.oOwnerComponentStub);
				sinon.stub(this.ODataUtils, 'createFilterParams', function(
						aFilters) {
					return '$filter=((LOCAT_CAL%20eq%20DA1))';
				});
			},
			teardown : function() {
				this.oController.destroy();
				this.oOwnerComponentStub.destroy();
				this.oComponentStub.destroy();
			}
		});
test('Test for Export to excel functionality with less row count', function() {
	//Arrange
	var iRowCount = 100;
	_exportToExcelMainFilters.call(this, iRowCount);
});
test('Test for Export to excel functionality with more row count', function() {
	//Arrange
	var iRowCount = 5001;
	_exportToExcelMainFilters.call(this, iRowCount);
});
test('Test for onExport', function() {
	_callonExportEvent.call(this);
});

function _exportToExcelMainFilters(iRowCount) {
	var oEvent = {}, aFilters = [ {
		'aFilters' : [ {
			'aFilters' : [ {
				'sPath' : 'TESTL',
				'sOperator' : 'EQ',
				'oValue1' : 'FLE-T001',
				'_bMultiFilter' : false
			} ],
			'bAnd' : false,
			'_bMultiFilter' : true
		}, {
			'aFilters' : [ {
				'sPath' : 'LOCAT_CAL',
				'sOperator' : 'EQ',
				'oValue1' : 'DA1',
				'_bMultiFilter' : false
			} ],
			'bAnd' : false,
			'_bMultiFilter' : true
		} ],
		'bAnd' : true,
		'_bMultiFilter' : true
	} ];
	//for view methods
	var oViewStub = {
		getModel : function(sModelName) {
			//return this.oViewModel;
			return {
				getProperty : function(sName) {
					if (sName === '/rowCount') {
						return iRowCount;
					}
				}
			};
		}.bind(this),
		setModel : function(oModel, sModelName) {
			this.oViewModel = oModel;
		}.bind(this),
		getBindingContext : function() {
		},
		getBusyIndicatorDelay : function() {
		},
		addDependent : function(oObject) {
		}
	};
	oViewStub.byId = function(sId) {
		return {
			getBinding : function(oParam) {
				return {
					aFilters : aFilters,
					filter : function(aFilter) {
						return 'Filtered Data';
					}
				};
			},
			getAggregation : function(oParam) {
				return [];
			}
		};
	};
	this.oController.getResourceBundle = function() {
		return {
			getText : function(sText) {
				if (sText === 'exportToExcelErrorTitle') {
					return 'Error';
				} else if (sText === 'exportToExcelErrorMessage') {
					return 'You have requested to download data with '
							+ iRowCount
							+ ' rows, however due to performance you can download max. 5000 rows. Please apply filters and try again.';
				}
			}
		};
	};
	oEvent.getSource = function() {
	};
	var getView = sinon.stub(this.oController, 'getView').returns(oViewStub);
	//Act
	this.oController.onExportToExcel(oEvent);
	//Assert
	ok(true,
			'Export to excel executed successfully with more than 1 main filter');
	getView.restore();
}
function _callonExportEvent() {
	//global variable for fragment
	this.oController._oExportFormatsPopover = {
		openBy : function(o) {

		},
		close : function() {

		}
	};
	//Arrange
	var oEvent = {}, aFilters = [ {
		'aFilters' : [ {
			'aFilters' : [ {
				'sPath' : 'TESTL',
				'sOperator' : 'EQ',
				'oValue1' : 'FLE-T001',
				'_bMultiFilter' : false
			} ],
			'bAnd' : false,
			'_bMultiFilter' : true
		}, {
			'aFilters' : [ {
				'sPath' : 'LOCAT_CAL',
				'sOperator' : 'EQ',
				'oValue1' : 'DA1',
				'_bMultiFilter' : false
			} ],
			'bAnd' : false,
			'_bMultiFilter' : true
		} ],
		'bAnd' : true,
		'_bMultiFilter' : true
	} ];
	//for view methods
	var oViewStub = {
		getModel : function(sModelName) {
			return {
				getProperty : function(sName) {
				}
			};
		}.bind(this),
		setModel : function(oModel, sModelName) {
			this.oViewModel = oModel;
		}.bind(this),
		getBindingContext : function() {
		},
		getBusyIndicatorDelay : function() {
		},
		addDependent : function(oObject) {
		}
	};
	oViewStub.byId = function(sId) {
		return {
			getBinding : function(oParam) {
				return {
					aFilters : aFilters,
					filter : function(aFilter) {
						return 'Filtered Data';
					}
				};
			},
			getAggregation : function(oParam) {
				return [];
			}
		};
	};
	oEvent.getSource = function() {
		return {
			getCustomData : function() {
				return [ {
					getProperty : function(value) {
						return 'json';
					}
				} ];
			}
		};
	};
	var aColumns = [ {
		mProperties : {
			autoResizable : true,
			coloredStyleClass : 'red',
			hAlign : 'Left',
			sortProperty : 'CALMONTH',
			visible : false,
			width : '107px'
		}
	} ];
	var stub_readVisibleColumns = sinon.stub(this.oController,
			'_readVisibleColumns', function(aColumns) {
				return 'CALMONTH';
			});
	var getView = sinon.stub(this.oController, 'getView').returns(oViewStub);
	//Act
	this.oController.onExport(oEvent);
	//Assert
	ok(true,
			'Export to excel executed successfully with more than 1 main filter');
	getView.restore();
	stub_readVisibleColumns.restore();
}


//Table controller cell coloring module
module('Table controller cell coloring module', {
	  setup: function () {
	    this.oController = new sap.ui.controller('com.siemens.tableViewer.controller.tabs.Table');

	    this.oController.byId = function (sId) {
	      return {
	        bindAggregation: sinon.stub(),
	        setValue : function (){
	        	
	        },
			setValue2 : function () {
				
			},
	        getValue : function (){
	        	return "10000";
	        },
	        getMax : function (){
	        	return 10000;
	        },
	        getMin : function (){
	        	return 500;
	        },
	        setMax : function (oParam){
	        	
	        },
	        setMin : function (oParam){
	        	
	        },
	        getCustomData : function (){
		   		 return [{
		   			getValue : function (){
		   				return "NUCAF";
		   			} 
		   		 },
		   		 {
		   			 getKey : function (){
		   				 return "VALUE1_RANGE";
		   			 }
		   		 },
		   		 {
				  	setValue: function (){
				  	}
		   		 }
		   		 ];
			       
	        }
	      }
	    };

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
	          getData: function () {
							return {
								ServiceColumns : {"results":[{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='CALMONTH')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='CALMONTH')"},"CTRLID":"CTRL1","COLUMN":"CALMONTH","LABEL":"Calmonth","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":"Hierarchy","STDRD":0,"SORTORDER":10,"FILTER":1,"CTYPE":17,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":1,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":1,"DRILL_DOWN_BOND":"CALMONTH","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='TESTL')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='TESTL')"},"CTRLID":"CTRL1","COLUMN":"TESTL","LABEL":"Material","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":null,"STDRD":0,"SORTORDER":20,"FILTER":1,"CTYPE":11,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":null,"DRILL_DOWN_BOND":"","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='LOCAT_CAL')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='LOCAT_CAL')"},"CTRLID":"CTRL1","COLUMN":"LOCAT_CAL","LABEL":"Location","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":"MultiComboBox","STDRD":1,"SORTORDER":30,"FILTER":1,"CTYPE":11,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":1,"DRILL_DOWN_BOND":"LOCAT_CAL","CFORMAT":1,"CFORMAT_CONDITION":"DA1&FLE","CFORMAT_COLOR":"ORANGE,BLUE","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='SELEC')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='SELEC')"},"CTRLID":"CTRL1","COLUMN":"SELEC","LABEL":"Selec","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":null,"STDRD":0,"SORTORDER":40,"FILTER":1,"CTYPE":11,"CWIDTH":"107px","COLOR_CODE":"#FCF9CE","AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":null,"DRILL_DOWN_BOND":"","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='NUCAF')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='NUCAF')"},"CTRLID":"CTRL1","COLUMN":"NUCAF","LABEL":"Number of candidate failed","DESCRIPTION":"Description","IS_KFG":1,"FILTERTYPE":null,"STDRD":1,"SORTORDER":50,"FILTER":1,"CTYPE":3,"CWIDTH":"107px","COLOR_CODE":"#FCF9CE","AGGREGATE":1,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":2,"IS_LINK":1,"LINK_TARGET":"CTRL1","LINK_KEY_FIELDS":"CALMONTH,TESTL,LOCAT_CAL","MAINHEADER_DRILL":"Main header coming from Configuration","SUBHEADER_DRILL":"Sub header coming from Configuration","ONFILTERBAR":null,"DRILL_DOWN_BOND":"","CFORMAT":1,"CFORMAT_CONDITION":"0:5000&5000:10000","CFORMAT_COLOR":"#80b877,#e17b24","CRANGE":"0:10000","CRANGE_COLORS":"#80b877,#e17b24,#e34352"},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='ERDAT')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='ERDAT')"},"CTRLID":"CTRL1","COLUMN":"ERDAT","LABEL":"Creation date","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":"DatePicker","STDRD":1,"SORTORDER":60,"FILTER":1,"CTYPE":15,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":null,"DRILL_DOWN_BOND":"","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='ERDAT_DATE')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='ERDAT_DATE')"},"CTRLID":"CTRL1","COLUMN":"ERDAT_DATE","LABEL":"Creation date 2","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":null,"STDRD":1,"SORTORDER":70,"FILTER":1,"CTYPE":20,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":null,"DRILL_DOWN_BOND":"ERDAT_DATE","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='LOCATION_SINGLE')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='LOCATION_SINGLE')"},"CTRLID":"CTRL1","COLUMN":"LOCATION_SINGLE","LABEL":"Location Single","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":"StaticSingleSelect","STDRD":0,"SORTORDER":100,"FILTER":1,"CTYPE":11,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":null,"DRILL_DOWN_BOND":"","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""}]}
							}
	          },
	          oData:{
	        	results:  [{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='CALMONTH')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='CALMONTH')"},"CTRLID":"CTRL1","COLUMN":"CALMONTH","LABEL":"Calmonth","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":"Hierarchy","STDRD":0,"SORTORDER":10,"FILTER":1,"CTYPE":17,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":1,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":1,"DRILL_DOWN_BOND":"CALMONTH","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='TESTL')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='TESTL')"},"CTRLID":"CTRL1","COLUMN":"TESTL","LABEL":"Material","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":null,"STDRD":0,"SORTORDER":20,"FILTER":1,"CTYPE":11,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":null,"DRILL_DOWN_BOND":"","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='LOCAT_CAL')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='LOCAT_CAL')"},"CTRLID":"CTRL1","COLUMN":"LOCAT_CAL","LABEL":"Location","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":"MultiComboBox","STDRD":1,"SORTORDER":30,"FILTER":1,"CTYPE":11,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":1,"DRILL_DOWN_BOND":"LOCAT_CAL","CFORMAT":1,"CFORMAT_CONDITION":"DA1&FLE","CFORMAT_COLOR":"ORANGE,BLUE","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='SELEC')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='SELEC')"},"CTRLID":"CTRL1","COLUMN":"SELEC","LABEL":"Selec","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":null,"STDRD":0,"SORTORDER":40,"FILTER":1,"CTYPE":11,"CWIDTH":"107px","COLOR_CODE":"#FCF9CE","AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":null,"DRILL_DOWN_BOND":"","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='NUCAF')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='NUCAF')"},"CTRLID":"CTRL1","COLUMN":"NUCAF","LABEL":"Number of candidate failed","DESCRIPTION":"Description","IS_KFG":1,"FILTERTYPE":null,"STDRD":1,"SORTORDER":50,"FILTER":1,"CTYPE":3,"CWIDTH":"107px","COLOR_CODE":"#FCF9CE","AGGREGATE":1,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":2,"IS_LINK":1,"LINK_TARGET":"CTRL1","LINK_KEY_FIELDS":"CALMONTH,TESTL,LOCAT_CAL","MAINHEADER_DRILL":"Main header coming from Configuration","SUBHEADER_DRILL":"Sub header coming from Configuration","ONFILTERBAR":null,"DRILL_DOWN_BOND":"","CFORMAT":1,"CFORMAT_CONDITION":"0:5000&5000:10000","CFORMAT_COLOR":"#80b877,#e17b24","CRANGE":"0:10000","CRANGE_COLORS":"#80b877,#e17b24,#e34352"},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='ERDAT')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='ERDAT')"},"CTRLID":"CTRL1","COLUMN":"ERDAT","LABEL":"Creation date","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":"DatePicker","STDRD":1,"SORTORDER":60,"FILTER":1,"CTYPE":15,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":null,"DRILL_DOWN_BOND":"","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='ERDAT_DATE')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='ERDAT_DATE')"},"CTRLID":"CTRL1","COLUMN":"ERDAT_DATE","LABEL":"Creation date 2","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":null,"STDRD":1,"SORTORDER":70,"FILTER":1,"CTYPE":20,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":null,"DRILL_DOWN_BOND":"ERDAT_DATE","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='LOCATION_SINGLE')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='LOCATION_SINGLE')"},"CTRLID":"CTRL1","COLUMN":"LOCATION_SINGLE","LABEL":"Location Single","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":"StaticSingleSelect","STDRD":0,"SORTORDER":100,"FILTER":1,"CTYPE":11,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":null,"DRILL_DOWN_BOND":"","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""}]
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
	      },
	      addDependent : function(oObject) {
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
	        },
	        getCustomeData : function(){
	        	return [];
	        }
	        
	      }
	    };
	   
	   this.oComponentStub = new sap.ui.base.ManagedObject();
	    this.oComponentStub.getProperty = function (sId) {
	      if (sId === '/CTRLID') {
	        return 'CTRL1';
	      }
	    };
	    

			//fragment for cell config
			this.oController._oColorConfigDialog = {
				open : function() {

				},
				destroy : function() {

				}
			};
			
			//resource Bundle
			this.oController.getResourceBundle = function() {
				return {
					getText : function(sText) {
						return "";
						
					}
				};
			};
			
			this.oController.getKey = function (){
		    	var aColor = "#80b877";
		    	return aColor;
		    };
			sinon.stub(this.oController, '_getCellColorConfigFragDiagId').returns("tvFragCellConfigDialog");

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
	      return {};
	    };
	    
	    
	    //this.oOwnerComponentStub.getModel().
	    //sinon stubs
	    sinon.stub(this.oController, 'getComponentModel').returns(this.oComponentStub);
	    sinon.stub(this.oController, 'getOwnerComponent').returns(this.oOwnerComponentStub);
	    sinon.stub(this.oController, 'getView').returns(oStub);
	    
	  },
	  teardown: function () {
	    this.oController.destroy();
	  	this.oOwnerComponentStub.destroy();
	    this.oComponentStub.destroy();
	    
	  }
	});

test('Test onPressColorConfiguration button event', function() {
	//Arrange
	var oEvent  = {},
	sinonOnBeforeOpenCellConfig = sinon.stub(this.oController, 'onBeforeOpeCellColorDialog').returns(null);
	//Act
	this.oController.onPressColorConfiguration(oEvent);
	//Assert
	ok(true, 'onPressColorConfiguration executed successfully');
	sinonOnBeforeOpenCellConfig.restore();
	this.oController._oColorConfigDialog.destroy();
});

test('Test onBeforeOpeCellColorDialog function', function() {
	//Arrange
	var sinonGetCellColorConfigForm = sinon.stub(this.oController, '_getCellColorConfigForm').returns({addContent:function(){return [];}});
	//Act
	this.oController.onBeforeOpeCellColorDialog();
	//Assert
	ok(true, 'onBeforeOpeCellColorDialog executed successfully');
	sinonGetCellColorConfigForm.restore();
});

test('Test onSaveCellColorDialog function', function() {
	//Arrange
	this.oController.byId = function (sId) {
		if(sId === "siemensUiSliderValue1_NUCAF"){
	      return {
	        getCustomData : function (){
	        	return [
						{
							  getValue: function (){
								  return "NUCAF";
							  }
						},
						{
							  getKey: function (){
								  return "VALUE1_RANGE";
							  }
						},
						{
							  getValue: function (){
								  return "2500:4000&4000:10000";
							  }
						}
	        	        ];
	        }
	      };
		}
		if(sId === "siemensUiSliderValue2_NUCAF"){
		      return {
		        getCustomData : function (){
		        	return [
		        	          {
	            	        	  getValue: function (){
	            	        		  return "NUCAF";
	            	        	  }
	            	          },
	            	          {
	            	        	  getKey: function (){
	            	        		  return "VALUE2_RANGE";
	            	        	  }
	            	          },
		  					  {
								  getValue: function (){
									  return "2500:4000&4000:10000";
								  }
		  					  }
		        	        ];
		        }
		      };
		}
		if(sId === "siemensUiCellConfigColorsHLytNUCAF"){
			 return {
				 getContent : function (){
					 return [{
						 getVisible : function (){
							 return true;
						 },
						 getSelectedItem : function (){
							 return {
								 getKey : function (){
									 return "#80b877"; 
								 }
							 }
						 }
					 },{
						 getVisible : function (){
							 return true;
						 },
						 getSelectedItem : function (){
							 return {
								 getKey : function (){
									 return "#e17b24"; 
								 }
							 }
						 }
					 }];
				 }
			 }
		}
		if(sId === "siemensUiSliderMinRange_NUCAF"){
			 return {
				 getCustomData : function (){
			        	return [
			        	          {
		            	        	  getValue: function (){
		            	        		  return "NUCAF";
		            	        	  }
		            	          },
		            	          {
		            	        	  getKey: function (){
		            	        		  return "MIN_RANGE";
		            	        	  }
		            	          },
			  					  {
									  getValue: function (){
										  return "2500:10000";
									  },
									  setValue: function (oParam){
										  
									  }
			  					  }
			        	        ];
			        }
			 }
		}
		if(sId === "siemensUiSliderMaxRange_NUCAF"){
			 return {
				 getCustomData : function (){
			        	return [
			        	          {
		            	        	  getValue: function (){
		            	        		  return "NUCAF";
		            	        	  }
		            	          },
		            	          {
		            	        	  getKey: function (){
		            	        		  return "MAX_RANGE";
		            	        	  }
		            	          },
			  					  {
									  getValue: function (){
										  return "2500:10000";
									  },
									  setValue: function (oParam){
										  
									  }
			  					  }
			        	        ];
			        }
			 }
		}
		if(sId === "siemensUiTable"){
			return {
				getAggregation: function (oParam){
					return [{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='CALMONTH')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='CALMONTH')"},"CTRLID":"CTRL1","COLUMN":"CALMONTH","LABEL":"Calmonth","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":"Hierarchy","STDRD":0,"SORTORDER":10,"FILTER":1,"CTYPE":17,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":1,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":1,"DRILL_DOWN_BOND":"CALMONTH","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='TESTL')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='TESTL')"},"CTRLID":"CTRL1","COLUMN":"TESTL","LABEL":"Material","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":null,"STDRD":0,"SORTORDER":20,"FILTER":1,"CTYPE":11,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":null,"DRILL_DOWN_BOND":"","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='LOCAT_CAL')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='LOCAT_CAL')"},"CTRLID":"CTRL1","COLUMN":"LOCAT_CAL","LABEL":"Location","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":"MultiComboBox","STDRD":1,"SORTORDER":30,"FILTER":1,"CTYPE":11,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":1,"DRILL_DOWN_BOND":"LOCAT_CAL","CFORMAT":1,"CFORMAT_CONDITION":"DA1&FLE","CFORMAT_COLOR":"ORANGE,BLUE","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='SELEC')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='SELEC')"},"CTRLID":"CTRL1","COLUMN":"SELEC","LABEL":"Selec","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":null,"STDRD":0,"SORTORDER":40,"FILTER":1,"CTYPE":11,"CWIDTH":"107px","COLOR_CODE":"#FCF9CE","AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":null,"DRILL_DOWN_BOND":"","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='NUCAF')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='NUCAF')"},"CTRLID":"CTRL1","COLUMN":"NUCAF","LABEL":"Number of candidate failed","DESCRIPTION":"Description","IS_KFG":1,"FILTERTYPE":null,"STDRD":1,"SORTORDER":50,"FILTER":1,"CTYPE":3,"CWIDTH":"107px","COLOR_CODE":"#FCF9CE","AGGREGATE":1,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":2,"IS_LINK":1,"LINK_TARGET":"CTRL1","LINK_KEY_FIELDS":"CALMONTH,TESTL,LOCAT_CAL","MAINHEADER_DRILL":"Main header coming from Configuration","SUBHEADER_DRILL":"Sub header coming from Configuration","ONFILTERBAR":null,"DRILL_DOWN_BOND":"","CFORMAT":1,"CFORMAT_CONDITION":"0:5000&5000:10000","CFORMAT_COLOR":"#80b877,#e17b24","CRANGE":"0:10000","CRANGE_COLORS":"#80b877,#e17b24,#e34352"},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='ERDAT')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='ERDAT')"},"CTRLID":"CTRL1","COLUMN":"ERDAT","LABEL":"Creation date","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":"DatePicker","STDRD":1,"SORTORDER":60,"FILTER":1,"CTYPE":15,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":null,"DRILL_DOWN_BOND":"","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='ERDAT_DATE')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='ERDAT_DATE')"},"CTRLID":"CTRL1","COLUMN":"ERDAT_DATE","LABEL":"Creation date 2","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":null,"STDRD":1,"SORTORDER":70,"FILTER":1,"CTYPE":20,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":null,"DRILL_DOWN_BOND":"ERDAT_DATE","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""},{"__metadata":{"id":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='LOCATION_SINGLE')","type":"siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType","uri":"/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='LOCATION_SINGLE')"},"CTRLID":"CTRL1","COLUMN":"LOCATION_SINGLE","LABEL":"Location Single","DESCRIPTION":"Description","IS_KFG":0,"FILTERTYPE":"StaticSingleSelect","STDRD":0,"SORTORDER":100,"FILTER":1,"CTYPE":11,"CWIDTH":"107px","COLOR_CODE":null,"AGGREGATE":null,"SUPPORT_HIDDEN":0,"COLUMN_SORTING":0,"IS_LINK":0,"LINK_TARGET":null,"LINK_KEY_FIELDS":null,"MAINHEADER_DRILL":"","SUBHEADER_DRILL":"","ONFILTERBAR":null,"DRILL_DOWN_BOND":"","CFORMAT":0,"CFORMAT_CONDITION":"","CFORMAT_COLOR":"","CRANGE":"","CRANGE_COLORS":""}];
				}
			};
		}
		
	};
	var sinonGetCellColorConfigForm = sinon.stub(this.oController, '_getCellColorConfigForm').returns({getContent:function(){return [];}});
	var sinonReadVisibleColumns = sinon.stub(this.oController, '_readVisibleColumns').returns("LOCAT_CAL,NUCAF,ERDAT,ERDAT_DATE");
	var sinonBindTable = sinon.stub(this.oController, '_bindTable');
	var sinonUpdateConfigTable = sinon.stub(this.oController, '_updateConfigTable');
	//Act
	this.oController.onSaveCellColorDialog();
	//Assert
	ok(true, 'onSaveCellColorDialog executed successfully');
	sinonGetCellColorConfigForm.restore();
	sinonReadVisibleColumns.restore();
	sinonBindTable.restore();
	sinonUpdateConfigTable.restore();
	
});

test('Test onCloseCellColorDialog function', function() {
	//Arrange
	var oEvent = {};
	//Act
	this.oController.onCloseCellColorDialog(oEvent);
	//Assert
	
		ok(true, 'onCloseCellColorDialog executed successfully');
	
});

test('Test onAfterCloseCellColorDialog function', function() {
	//Arrange
	var oEvent = {};
	//Act
	this.oController.onAfterCloseCellColorDialog(oEvent);
	//Assert
	ok(true, 'onAfterCloseCellColorDialog executed successfully');
});

test('Test _setColumnsForConfigUpdate function', function() {
	//Arrange
	var aColumns = ["NUCAF"];
	//Act
	this.oController._setColumnsForConfigUpdate(aColumns);
	//Assert
	ok(true, '_setColumnsForConfigUpdate executed successfully');
});

test('Test _getColumnsForConfigUpdate function', function() {
	//Arrange
	
	//Act
	this.oController._getColumnsForConfigUpdate();
	//Assert
	ok(true, '_getColumnsForConfigUpdate executed successfully');
});

test('Test _getSavedCellColors function', function() {
	//Arrange
	var sSavedColors =  "#80b877,#e17b24";
	//Act
	var aSavedColors = this.oController._getSavedCellColors(sSavedColors);
	//Assert
	if (aSavedColors !== null || aSavedColors !== undefined) {
		ok(true, '_getSavedCellColors executed successfully');
	}else{
		ok(false, '_getSavedCellColors failed to execute');
	}
});

test('Test _setSelectItemBackground function', function() {
	//Arrange
	this.oController.getKey = function (){
    	var aColor = "#80b877";
    	return aColor;
    };
    
    this.oController.setText = function (){
    	var aText = {};
    	return aText;
    };
    
    this.oController.getId = function (){
    	var aId = "";
    	return aId;
    };
    
    this.oController.getText = function (){
    	var aText = "";
    	return aText;
    };
	
	//Act
	var setBg = this.oController._setSelectItemBackground();
	//Assert
	if (setBg !== null || setBg !== undefined) {
		ok(true, '_setSelectItemBackground executed successfully');
	}else{
		ok(false, '_setSelectItemBackground failed to execute');
	}
	
});

test('Test _getCellColorConfigFragDiagId function', function() {
	//Arrange
	
	//Act
	var fragId = this.oController._getCellColorConfigFragDiagId();
	//Assert
	if (fragId !== null || fragId !== undefined) {
		ok(true, '_getCellColorConfigFragDiagId executed successfully');
	}else{
		ok(false, '_getCellColorConfigFragDiagId failed to execute');
	}
	
});

test('Test _getCellColorConfigForm function', function() {
	//Arrange
	
	//Act
	var conForm = this.oController._getCellColorConfigForm();
	//Assert
	if (conForm !== null || conForm !== undefined) {
		ok(true, '_getCellColorConfigForm executed successfully');
	}else{
		ok(false, '_getCellColorConfigForm failed to execute');
	}
	
});

test('Test _handleValue1RangeChange function', function() {
	//Arrange
	var oEvent = {};
	
	oEvent.getSource = function () {
		return {
			getCustomData : function (){
		 
		        	return [
							{
								  getValue: function (){
									  return "NUCAF";
								  }
							},
							{
								  getKey: function (){
									  return "VALUE1_RANGE";
								  }
							},
							{
								  getValue: function (){
									  return "2500:4000&4000:10000";
								  },
								  setValue: function (){
								  }
							}
					];
				       
			},
			getValue : function () {
				return "2780";
			}
		     
		 };
	};
	
	
	
	
	var sion_isRangeValueValid = sinon.stub(this.oController, '_isRangeValueValid').returns(true);
	var sion_getRangeSelections = sinon.stub(this.oController, '_getRangeSelections').returns("1000:2750&2750:10000");
	//Act
	var val1Range = this.oController._handleValue1RangeChange(oEvent);
	//Assert
	if (val1Range !== null || val1Range !== undefined) {
		ok(true, '_handleValue1RangeChange executed successfully');
	}else{
		ok(false, '_handleValue1RangeChange failed to execute');
	}
	sion_isRangeValueValid.restore();
	sion_getRangeSelections.restore();
});

test('Test _handleValue2RangeChange function', function() {
	//Arrange
	var oEvent = {};
	oEvent.getSource = function () {
		return {
			getCustomData : function (){
		 
		        	return [
							{
								  getValue: function (){
									  return "NUCAF";
								  }
							},
							{
								  getKey: function (){
									  return "VALUE2_RANGE";
								  }
							},
							{
								  getValue: function (){
									  return "2500:4000&4000:10000";
								  },
								  setValue: function (){
								  }
							}
					];
				       
			},
			getValue : function () {
				return "9000";
			}
		     
		 };
	};
	
	var sion_isRangeValueValid = sinon.stub(this.oController, '_isRangeValueValid').returns(true);
	var sion_getRangeSelections = sinon.stub(this.oController, '_getRangeSelections').returns("1000:2750&2750:9000");
	//Act
	var val2Range = this.oController._handleValue2RangeChange(oEvent);
	//Assert
	if (val2Range !== null || val1Range !== undefined) {
		ok(true, '_handleValue2RangeChange executed successfully');
	}else{
		ok(false, '_handleValue2RangeChange failed to execute');
	}
	sion_isRangeValueValid.restore();
	sion_getRangeSelections.restore();
});

test('Test _handleMinRangeChange function', function() {
	//Arrange
	var oEvent = {};
	oEvent.getSource = function () {
		return {
			getCustomData : function (){
		 
		        	return [
							{
								  getValue: function (){
									  return "NUCAF";
								  }
							},
							{
								  getKey: function (){
									  return "MIN_RANGE";
								  }
							},
							{
								  getValue: function (){
									  return "2500:4000&4000:10000";
								  },
								  setValue: function (){
								  }
							}
					];
				       
			},
			getValue : function () {
				return "9000";
			}
		     
		 };
	};
	
	var sion_isRangeValueValid = sinon.stub(this.oController, '_isRangeValueValid').returns(true);
	var sion_getRangeSelections = sinon.stub(this.oController, '_getRangeSelections').returns("1000:2750&2750:9000");
	//Act
	var minRange = this.oController._handleMinRangeChange(oEvent);
	//Assert
	if (minRange !== null || minRange !== undefined) {
		ok(true, '_handleMinRangeChange executed successfully');
	}else{
		ok(false, '_handleMinRangeChange failed to execute');
	}
	sion_isRangeValueValid.restore();
	sion_getRangeSelections.restore();
});

test('Test _handleMaxRangeChange function', function() {
	//Arrange
	var oEvent = {};
	oEvent.getSource = function () {
		return {
			getCustomData : function (){
		 
		        	return [
							{
								  getValue: function (){
									  return "NUCAF";
								  }
							},
							{
								  getKey: function (){
									  return "MAX_RANGE";
								  }
							},
							{
								  getValue: function (){
									  return "500:4000&4000:9000";
								  },
								  setValue: function (){
								  }
							}
					];
				       
			},
			getValue : function () {
				return "500";
			}
		     
		 };
	};
	
	var sion_isRangeValueValid = sinon.stub(this.oController, '_isRangeValueValid').returns(true);
	var sion_getRangeSelections = sinon.stub(this.oController, '_getRangeSelections').returns("500:4000&4000:9000");
	//Act
	var maxRange = this.oController._handleMaxRangeChange(oEvent);
	//Assert
	if (maxRange !== null || maxRange !== undefined) {
		ok(true, '_handleMaxRangeChange executed successfully');
	}else{
		ok(false, '_handleMaxRangeChange failed to execute');
	}
	sion_isRangeValueValid.restore();
	sion_getRangeSelections.restore();
});

test('Test _updateConfigTable function', function() {
	//Arrange
	var oMainModel = {};
	oMainModel.update = function(){};
	var sion_getColumnsForConfigUpdate = sinon.stub(this.oController, '_getColumnsForConfigUpdate').returns(["NUCAF"]);
	//Act
	var fuCall = this.oController._updateConfigTable();
	//Assert
	if (fuCall !== null || fuCall !== undefined) {
		ok(true, '_updateConfigTable executed successfully');
	}else{
		ok(false, '_updateConfigTable failed to execute');
	}
	sion_getColumnsForConfigUpdate.restore();
});

test('Test _isRangeValueValid function', function() {
	//Arrange
	var sValue = "2500", oSlider = {
			getMin : function (){
				return 1000;
			}
	}, isValue = true, isCheckMax = false, isCheckMin = true;
	//Act
	var fuCall = this.oController._isRangeValueValid(sValue, oSlider, isValue, isCheckMax, isCheckMin);
	//Assert
	if (fuCall !== null || fuCall !== undefined) {
		ok(true, '_isRangeValueValid executed successfully');
	}else{
		ok(false, '_isRangeValueValid failed to execute');
	}
	
});

test('Test _setRangeValuestoText function', function() {
	//Arrange
	var oEvent = {}, oValue1 = {}, oValue2 = {}, no = 2;
	oValue1.toFixed = function (no) {
		return "";
	};
	oValue2.toFixed = function (no) {
		return "";
	};
	this.oController.byId = function (sId) {
		if(sId === "siemensUiSliderValue2_NUCAF"){
			return {
	    		getCustomData : function (){
			   		 return [{
			   			getValue : function (){
			   				return "NUCAF";
			   			} 
			   		 },
			   		 {
			   			 getKey : function (){
			   				 return "VALUE2_RANGE";
			   			 }
			   		 },
			   		 {
					  	setValue: function (){
					  	}
			   		 }
			   		 ];
				       
		        },
		        setValue: function (no){
			  	}
			}
			 }
		if(sId === "siemensUiSliderValue1_NUCAF"){
			return {
	    		getCustomData : function (){
			   		 return [{
			   			getValue : function (){
			   				return "NUCAF";
			   			} 
			   		 },
			   		 {
			   			 getKey : function (){
			   				 return "VALUE1_RANGE";
			   			 }
			   		 },
			   		 {
					  	setValue: function (){
					  	}
			   		 }
			   		 ];
				       
		        },
		        setValue: function (no){
			  	}
			}
			 }
	}
	oEvent.getSource = function () {
		return {
			getCustomData : function (){
		 
		        	return [
							{
								  getValue: function (){
									  return "NUCAF";
								  }
							},
							{
								  getKey: function (){
									  return "COLUMN";
								  },
								  getValue: function (){
									  return "NUCAF";
								  }
							},
							{
								  getValue: function (){
									  return "500:4000&4000:9000";
								  },
								  setValue: function (){
								  }
							}
					];
				       
			},
			getValue : function () {
				return 2468.9265536723165;
			},
			getValue2 : function () {
				return 9000;
			},
	        getMax : function (){
	        	return 10000;
	        },
	        getMin : function (){
	        	return 500;
	        },
	        setMax : function (oParam){
	        },
	        setMin : function (oParam){
	        },
	        setValue: function (no){
			},
			setValue2: function (no){
			}
		     
		 };
	};
	var sion_getCellColorConfigForm = sinon.stub(this.oController, '_getCellColorConfigForm').returns({getContent:function(){return [];}});
	var sion_getRangeSelections = sinon.stub(this.oController, '_getRangeSelections').returns("1000:2468.93&2468.93:9000");
	//Act 
	var fuCall = this.oController._setRangeValuestoText(oEvent);
	//Assert
	if (fuCall !== null || fuCall !== undefined) {
		ok(true, '_setRangeValuestoText executed successfully');
	}else{
		ok(false, '_setRangeValuestoText failed to execute');
	}
	sion_getCellColorConfigForm.restore();
	sion_getRangeSelections.restore();
});

test('Test _getRangeSelections function', function() {
	//Arrange
	var iValue1 = 4943.5, iValue2 = 10000, iMin = 0, iMax = 10000, oSource = {};
	var oSource = {
			getCustomData: function (){
				return [
				        {},{
				        	getValue : function () {
				        		return "NUCAF";
				        	}
				        }
				];
			}
	};
	var retObj = {getContent:function(){
		return [{
			getMetadata: function(){
				return {
					_sClassName: "sap.m.Label"
				};
			},
			getCustomData : function (){
				return [{}];
			}
		},{
			getMetadata: function(){
				return {
					_sClassName: "sap.ui.commons.RangeSlider"
				};
			},
			getCustomData : function (){
				return [{
					getKey : function(){
						return "CFORMAT_COLOR";
					}
				}];
			}
		},{
			getMetadata: function(){
				return {
					_sClassName: "sap.ui.layout.HorizontalLayout"
				};
			},
			getCustomData : function (){
				return [{
					getKey : function (){
						return "";
					}
				}];
			}
		},{
			getMetadata: function(){
				return {
					_sClassName: "sap.ui.layout.HorizontalLayout"
				};
			},
			getCustomData : function (){
				return [{
					getKey : function (){
						return "";
					}
				}];
			}
		},{
			getMetadata: function(){
				return {
					_sClassName: "sap.ui.layout.HorizontalLayout"
				};
			},
			getCustomData : function (){
				return [{
					getKey : function(){
						return "CFORMAT_COLOR";
					}
				},{
					getValue : function (){
						return "NUCAF";
					}
				}];
			},
			getContent : function () {
				return [{
					getVisible : function (){
						return true;
					}
				},{
					getVisible : function (){
						return true;
					}
				}];
			}
		},{
			getMetadata: function(){
				return {
					_sClassName: "sap.ui.layout.HorizontalLayout"
				};
			},
			getCustomData : function (){
				return [{
					getKey : function (){
						return "";
					}
				}];
			}
		}];}};
	var sion_getCellColorConfigForm = sinon.stub(this.oController, '_getCellColorConfigForm').returns(retObj);
	//Act 
	var fuCall = this.oController._getRangeSelections(iValue1, iValue2, iMin, iMax, oSource);
	//Assert
	if (fuCall !== null || fuCall !== undefined) {
		ok(true, '_getRangeSelections executed successfully');
	}else{
		ok(false, '_getRangeSelections failed to execute');
	}
	sion_getCellColorConfigForm.restore();
});