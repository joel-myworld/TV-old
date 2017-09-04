sap.ui.define([
	"sap/ui/test/Opa5",
	"com/siemens/tableViewer/test/integration/pages/Common",
	"sap/ui/test/matchers/AggregationFilled",
	"sap/ui/test/matchers/PropertyStrictEquals"
	
], function (Opa5, Common, AggregationFilled, PropertyStrictEquals) {
	"use strict";

	var config = {
		ui: {
			elements: {
				table: "siemens.ui.analyticaltable",
				treetable: "siemens.ui.treetable",
				measures: "siemens.ui.measure.select",
				dimensions: "siemens.ui.dimension.select",
				filterbar: "siemens.ui.filterbar",
				chartSettings: "siemensUiChartSettings",
				rowSlider: "siemensUiRowCountSlider",
				rowInput: "siemensUiRowCountInput",
				toggleSettings: "siemensUiToggleFullScreen"
			},
			defaultChartType: "siemensUiBarChart"
		},
		viewName: "TableViewer"
	};

	this._oChartSettingsPanel = "";


	Opa5.createPageObjects({
		onTheTableViewerPage: {
			baseClass: Common,
			actions: {
				iWaitUntilTheTableIsLoaded: function () {
					return this.waitFor({
						id: "siemensUiTable",
						viewName: "tabs.Table",
						matchers: [new AggregationFilled({name: "rows"})],
						errorMessage: "The Table has not been loaded"
					});
				},

				iFoundButton: function () {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: "tabs.Table",
						success: function (aButtons) {
							var oPersoButton = aButtons[4];
							oPersoButton.$().trigger("tap");
						},
						errorMessage: "Did not find the personalisation Button"
					});
				},

				iClickOnObjectByID: function (sObjectID) {
					return this.waitFor({
						viewName: "TableViewer",
						id: sObjectID,
						success: function (oObject) {
							oObject.$().trigger("tap");
						},
						errorMessage: "Object with an ID " + sObjectID + " wasn't found!"
					});
				},
				
				iSetValueForCalmonth: function () {
					return this.waitFor({
						viewName: "TableViewer",
						id: "siemens.ui.filterbar",
						success: function (oFilterBar) {						
							 var oCalmonthValueHelp = oFilterBar.getAggregation("content")[1].getAggregation("content")[0].getAggregation("content")[1];
							 oCalmonthValueHelp.setValue("06.2016"); // Selecting one value for export 
						}
					});
				},

				iClickExportToExcel: function () {
					return this.waitFor({
						viewName: "tabs.Table",
						controlType: "sap.m.Button",
						success: function (aButtons) {		
							var oExpBtn = aButtons[2].$().trigger("tap");
						}
					});
				},
				
				iClickCellColoringButton: function () {
					return this.waitFor({
						id: "siemensUiTable",
						viewName: "tabs.Table",						
						success: function (oTable) {
							var oCellColorBtn = oTable.getAggregation("toolbar").getAggregation("content")[4];
							oCellColorBtn.$().trigger("tap");
						}
					});
				},
				
				iSetValuesRange: function () {
					return this.waitFor({
						controlType: "sap.m.Input",
						viewName: "tabs.Table",						
						success: function (aInput) {
						    var oMinRange,oMaxRange;
						    oMinRange = aInput[2];
						    oMaxRange = aInput[3];
						    oMinRange.setValue(2000.00);
						    oMaxRange.setValue(25000000.00);
						}
					});
				},						
				
				iMoveSlider: function () {
					return this.waitFor({
						controlType: "sap.ui.commons.RangeSlider",
						viewName: "tabs.Table",						
						success: function (oRangeSlider) {
						    oRangeSlider[0].setValue(parseFloat(12953610.03));
						    oRangeSlider[0].setValue2(parseFloat(17103370.50));
						},
						errorMessage: "could not move the slider"
					});
				},
				
				iMoveSlider1: function () {
					return this.waitFor({
						controlType: "sap.ui.commons.RangeSlider",
						viewName: "tabs.Table",						
						success: function (oRangeSlider) {
						    oRangeSlider[0].setValue(parseFloat(12953610.03));
						    oRangeSlider[0].setValue2(parseFloat(17103370.50));
						    oRangeSlider[0].getCustomData()[0].setValue("0:12953610.03&12953610.03:17103370.50&17103370.50:25000000");
						    oRangeSlider[0].fireLiveChange({value:12953610.03});
						    oRangeSlider[0].fireChange({value:12953610.03});
						},
						errorMessage: "could not move the slider"
					});
				},
				
				iSetDefaultColorForDropDown: function () {
					return this.waitFor({
						controlType: "sap.ui.layout.HorizontalLayout",
						viewName: "tabs.Table",						
						success: function (oHLayout) {
						    var oDropdown1 =  oHLayout[2].getContent()[0].setSelectedKey("#e34352");
						},
						errorMessage: "Default color is set for first dropdown"
					});
				},
				
				iClickOnOKButton: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "tabs.Table",						
						success: function (oDialog) {
						   var oHLayout = oDialog[0].getAggregation("content")[0].getAggregation("form").getAggregation("formContainers")[0].getAggregation("formElements")[1].getAggregation("fields")[0];
						   oHLayout.getContent()[0].getSelectedKey();
						   oHLayout.getContent()[1].getSelectedKey();
						   oHLayout.getContent()[2].getSelectedKey();
						   oDialog[0].getButtons()[0].$().trigger("tap");							
						},
						errorMessage: "could not find the ok button"
					});
				},
								
				iClickDefineSorting: function () {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: "tabs.Table",
						success: function (aButtons) {
							var oSortBtn = aButtons[3].$().trigger("tap");
						}
					});
				},
				
				iClickOnTab: function () {
					return this.waitFor({
						viewName: "TableViewer",
						id: "siemens.ui.chart",
						success: function (oObject) {
							   var oTab = oObject.getParent().getParent(), mArguments = {};
							   oTab.setSelectedKey("Chart");

							   oTab.setExpandable(true);
							   oTab.setExpanded(true);

							   mArguments.item = oTab.getItems()[1];
							   mArguments.key = "Chart";
							   mArguments.selectedItem = oTab.getItems()[1];
							   mArguments.selectedKey = "Chart";
							   oTab.fireSelect(mArguments);

						 },
						errorMessage: "Object with an ID siemensUiChartTab wasn't found!"
					});
				},
				
				iClickChartTypeButton: function () {
					return this.waitFor({
						viewName: "tabs.Chart",
						id: "siemensUiChartsGrid",
						success: function (oGLayout) {
						   var oChartTypeBtn =	oGLayout.getContent()[0].getAggregation("headerToolbar").getContent()[2];
						   oChartTypeBtn.$().trigger("tap");
						 },
						errorMessage: "Couldnt find change chart type button in chart tab"
					});
				},
				

				iOpenFilterByDialog: function () {
					return this.waitFor({
						viewName: "tabs.Chart",
						id: "siemensUiChartsGrid",
						success: function (oGLayout) {
						  var oToggleLegendBtn = oGLayout.getContent()[0].getAggregation("headerToolbar").getContent()[3];
						  oToggleLegendBtn.$().trigger("tap");
						 },
						errorMessage: "Couldnt find Toggle Legend button in chart tab"

					});
				}

			},
			assertions: {
				iShouldSeeResult: function () {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: "tabs.Table",
						success: function (aButtons) {
							if (aButtons[4].getIcon() === "sap-icon://action-settings")
								ok(true, "found the personlisation button");
						}
					});
				},

				iDataLengthMoreThenOne: function () {
					return this.waitFor({
						id: "siemensUiTable",
						viewName: "tabs.Table",
						matchers: function (oTable) {
							return oTable.getBinding("rows").iLength > 0;
						},
						success: function (oTable) {
							ok(true, "Table contains data");
						},
						errorMessage: "No data"
					});
				},
							

				theTitleShouldDisplayTheTotalAmountOfItems: function () {
					return this.waitFor({
						id: "siemensUiTable",
						viewName: "tabs.Table",
						matchers: new AggregationFilled({name: "rows"}),
						success: function (oTable) {
							   var iObjectCount = oTable.getBinding("rows").iLength;
							   var sTitleId = oTable.getAggregation("toolbar").getAggregation("content")[0].sId;
							   this.waitFor({
								   controlType: "sap.m.Title",
								   viewName: "tabs.Table",
								   matchers: function (aTitle) {
									   if (aTitle.length > 1) {
										   for (var iTitle in aTitle) {
											   if (aTitle[iTitle].sId === sTitleId) {
												   var oTitle = aTitle[iTitle];
												   break;
											}
										}
									} else {
										   var oTitle = aTitle;
									}
									   var sExpectedText = oTitle.getModel("mainConfig").getData()["TABLE_TITLE"] + " " + "[" + oTitle.getModel("tableView").getData()["rowCount"] + "]";
									   return new PropertyStrictEquals({
										   name: "text",
										   value: sExpectedText
									}).isMatching(oTitle);
								},
								success: function () {
									//check the count for no threshold condition
									    if (oTable.getThreshold() > iObjectCount) {
										    ok(true, "Row count shown when the no. of records in the table is less than " + oTable.getThreshold());
									}
									//check the count for threshold condition
									    else if (oTable.getThreshold() < iObjectCount) {
										    ok(true, "Row count shown when the no. of records in the table is more than " + oTable.getThreshold());
									}
									//check the count for no data condition
									    else if (oTable.getShowNoData()) {
										   ok(true, "Row count shown when there are no records found in the table");
									}

								},
								errorMessage: "The Title does not contain the number of items " + iObjectCount
							});
						},
						errorMessage: "The table has no items."
					});
				},

				thenExportToExcel: function () {
					return this.waitFor({
						viewName: "tabs.Table",
						controlType: "sap.m.Popover",
						success: function (oPopover) {
							var a = oPopover;
							  if(oPopover[0].isOpen === true){
								  oPopover[0].getContent()[0].getItems()[0].$().trigger("tap");
								  ok(true,"Export to excel is success")
							 }
							  else{
								  ok(true,"Failed to export data to excel")
							  }
						},
						errorMessage: "Couldnt open the popover"
					});
				},
				
			  	iClickShowDetailsButton: function () {
					return this.waitFor({
						id: "siemensUiTable",
						viewName: "tabs.Table",
						visible:true,
						matchers: function (oTable) {
							return oTable.getBinding("rows").iLength > 0;
						},
						success: function (oTable) {
							oTable.setSelectedIndex(1);	
							var sDetailsBtn = oTable.getAggregation("toolbar").getAggregation("content")[2]; 
					        sDetailsBtn.$().trigger("tap");
							ok(true,"Report is generated on click of Show Details Button");
						},
						errorMessage: "Show Details button couldn't be found"
					});
				},
				
				thenCellColoringDialogOpens: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "tabs.Table",
						success: function (oDialog) {
							if(oDialog[0].getAggregation("_header").getAggregation("contentMiddle")[0].getText() === "Cell color configuration"){
								ok(true,"Cell coloring dialog is opened")
							}else {
							    ok(false, "Cell coloring dialog couldn't be opened");
							}
						},
						errorMessage: "Cell coloring dialog couldn't be found"
					});
				},
				
				iSeeSliderEndValuesChange: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "tabs.Table",
						success: function (oDialog) {
						    var oRangeSlider = oDialog[0].getAggregation("content")[0].getAggregation("form").getAggregation("layout").mContainers.__container1[1].getContent()[1];
						    var oMinRange = oDialog[0].getAggregation("content")[0].getAggregation("form").getAggregation("layout").mContainers.__container1[1].getContent()[3].getAggregation("content")[1];
						    var oMaxRange = oDialog[0].getAggregation("content")[0].getAggregation("form").getAggregation("layout").mContainers.__container1[1].getContent()[3].getAggregation("content")[2];
                            if(oRangeSlider.getMin() != oMinRange.getValue() && oRangeSlider.getMax() != oMaxRange.getValue()){
                            	oRangeSlider.setMin(parseFloat(oMinRange.getValue()));
                            	oRangeSlider.setMax(parseFloat(oMaxRange.getValue()));
                            	ok(true,"Can see Slider end values changed");
                            }
                            else{
                            	ok(true,"Can see Slider end values changed")
                            }
						},
					});
				},
				
				iSeeChangeInInputValues: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "tabs.Table",
						success: function (oDialog) {
						    var oRangeSlider = oDialog[0].getAggregation("content")[0].getAggregation("form").getAggregation("layout").mContainers.__container1[1].getContent()[1];
						    var oSliderVal1 = oDialog[0].getAggregation("content")[0].getAggregation("form").getAggregation("layout").mContainers.__container1[1].getContent()[2].getAggregation("content")[0];
						    var oSliderVal2 = oDialog[0].getAggregation("content")[0].getAggregation("form").getAggregation("layout").mContainers.__container1[1].getContent()[2].getAggregation("content")[1];
                               if(oSliderVal1.getValue() != oRangeSlider.getValue() && oSliderVal2.getValue() != oRangeSlider.getValue2()){
                            	  oSliderVal1.setValue(oRangeSlider.getValue());
                            	  oSliderVal2.setValue(oRangeSlider.getValue2());
                            	  ok(true,"Can see change in input values");
                            }
                            else{
                            	  ok(true,"Can see Slider end values changed")
                            }
						},
					});
				},		
				
				iSeeDropdownFields: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "tabs.Table",
						success: function (oDialog) {
						    var sRanges = oDialog[0].getAggregation("content")[0].getAggregation("form").getAggregation("layout").mContainers.__container1[1].getContent()[1].getCustomData()[0].getValue();
						    var oHLayout =  oDialog[0].getAggregation("content")[0].getAggregation("form").getAggregation("formContainers")[0].getAggregation("formElements")[1].getAggregation("fields")[0];
						    var aRanges = sRanges.split("&");
						      if(aRanges.length === oHLayout.getContent().length){
						    	  ok(true,"Dropdowns generated is as per the number of conditions");
						      }
						      else{
						    	  ok(true,"Dropdowns generated is not per the number of conditions")
						      }
						},
						errorMessage: "Required number of dropdowns couldn't be generated"
					});
				},
				
				iSeeDefaultColorForDropDown: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.ui.layout.HorizontalLayout",
						viewName: "tabs.Table",
						success: function (oHLayout) { 
							if(oHLayout[2].getContent()[0].getSelectedKey() === "#e34352"){
								ok(true,"Default red color is set for first dropdown")
							}
							else{
								ok(true,"Default red color couldn't be set for first dropdown")
							}
						},
						errorMessage: "Couldm't set default color for first dropdown"
					});
				},
				
				iCheckColorForTableValues: function () {
					return this.waitFor({
						viewName: "tabs.Table",
						id: "siemensUiTable",
						visible:true,
						matchers: function (oTable) {
							return oTable.getBinding("rows").iLength > 0;
						},
						success: function (oTable) {
							 for(var i=0 ; i<oTable.getAggregation("rows").length ;i++){
								 if (parseFloat(oTable.getAggregation("rows")[i].getCells()[1].getText()) > parseFloat(oTable.getAggregation("rows")[i].getCells()[1].getAggregation("customData")[0].getValue().split(":")[0]) && parseFloat(oTable.getAggregation("rows")[i].getCells()[1].getText()) < parseFloat(oTable.getAggregation("rows")[i].getCells()[1].getAggregation("customData")[0].getValue().split(":")[1]) && ((oTable.getAggregation("rows")[i].getCells()[1].getCustomData()[0].getProperty("key") === "#e34352"))){
									  ok(true,"The Value lies in the range " + oTable.getAggregation("rows")[i].getCells()[1].getAggregation("customData")[0].getValue().split(":") +" and the background color is " + oTable.getAggregation("rows")[i].getCells()[1].getCustomData()[0].getProperty("key"));
								   }
								 else if (parseFloat(oTable.getAggregation("rows")[i].getCells()[1].getText()) > parseFloat(oTable.getAggregation("rows")[i].getCells()[1].getAggregation("customData")[1].getValue().split(":")[0]) && parseFloat(oTable.getAggregation("rows")[i].getCells()[1].getText()) < parseFloat(oTable.getAggregation("rows")[i].getCells()[1].getAggregation("customData")[1].getValue().split(":")[1]) && ((oTable.getAggregation("rows")[i].getCells()[1].getCustomData()[1].getProperty("key") === "#e17b24"))){
									  ok(true,"The Value lies in the range " + oTable.getAggregation("rows")[i].getCells()[1].getAggregation("customData")[1].getValue().split(":") +" and the background color is " + oTable.getAggregation("rows")[i].getCells()[1].getCustomData()[1].getProperty("key"));
							 }
								 else{
									  ok(true,"The Value lies in the range " + oTable.getAggregation("rows")[i].getCells()[1].getAggregation("customData")[2].getValue().split(":") +" and the background color is " + oTable.getAggregation("rows")[i].getCells()[1].getCustomData()[2].getProperty("key"));
								   }
								}
						 },
						errorMessage: "Default background color is not set for particular range of values"
					});
				},
				
				thenISortTheColumns: function () {
					return this.waitFor({
						viewName: "tabs.Table",
						controlType: "sap.m.Dialog",
						success: function (aDialogs) {
							   if (aDialogs[0].getAggregation("_header").getAggregation("contentMiddle")[0].getText() === "Define Sorting"){								
							      var aSelectList = aDialogs[0].getAggregation("panels")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[2].getAggregation("picker").getAggregation("content")[0],mArguments={};
							      var sItem = aSelectList.getAggregation("items")[3];
							      mArguments.selectedItem = sItem;
							      aSelectList.setSelectedItem(sItem);
							      aSelectList.fireSelectionChange(mArguments);
							
							      var aSelectOrder = aDialogs[0].getAggregation("panels")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[4].getAggregation("picker").getAggregation("content")[0],mArguments1={};
							      var sOrder = aSelectOrder.getAggregation("items")[1];
							      mArguments1.selectedItem = sOrder;
							      aSelectOrder.setSelectedItem(sOrder);
							      aSelectOrder.fireSelectionChange(mArguments1);
						
							      var oOKBtn = aDialogs[0].getAggregation("_toolbar").getAggregation("content")[1];
							      oOKBtn.firePress();
							      ok(true, "Sorting columns is successful ");
							}
							else {
								  ok(false, "Could not find Define Sorting dialog");
							}
						},
						errorMessage: "Could not open Define Sorting Dialog"
					});
				},				
								

				iTabBecomesActive: function (sTabID, sKey) {
					return this.waitFor({
						id: sTabID,
						viewName: config.viewName,
						success: function (oTab) {
							if (oTab.getKey() === sKey) {
								ok(true, "Tab with key " + sKey + " was set as an active one successfully!");
							}
						},
						errorMessage: "Tab with key " + sKey + " didn't become active!"
					});
				},


				thePopUpOpens: function () {
					return this.waitFor({
						controlType: "sap.m.Popover",
						viewName: "tabs.Chart",
						success: function (aPopover) {
							var oChartTypePopUp = aPopover[0].isOpen();
							if (oChartTypePopUp === true) {
                               ok(true, "Popup is opening on button click");
							}
						},
						errorMessage: "No popup on button click"
					});
				},

				iSetBarChart: function () {
					return this.waitFor({
						controlType: "sap.m.Popover",
						viewName: "tabs.Chart",
						success: function (aPopover) {
							var oChartTypePopUp = aPopover[0].isOpen();
							if (oChartTypePopUp === true) {
								var oBarChart = aPopover[0].getContent()[0].getAggregation("items")[0].getTitle();
								ok(true, oBarChart + " is set");
							}
						},
						errorMessage: "Bar chart is not set"
					});
				},

				iSetLineChart: function () {
					return this.waitFor({
						controlType: "sap.m.Popover",
						viewName: "tabs.Chart",
						success: function (aPopover) {
							var oChartTypePopUp = aPopover[0].isOpen();
							if (oChartTypePopUp === true) {
								var oLineChart = aPopover[0].getContent()[0].getAggregation("items")[1].getTitle();
								ok(true, oLineChart + " is set");
							}
						},
						errorMessage: "Line chart is not set"
					});
				},
				
				iSetPieChart: function () {
					return this.waitFor({
						controlType: "sap.m.Popover",
						viewName: "tabs.Chart",
						success: function (aPopover) {
							var oChartTypePopUp = aPopover[0].isOpen();
							if (oChartTypePopUp === true) {
								var oPieChart = aPopover[0].getContent()[0].getAggregation("items")[2].getTitle();
								ok(true, oPieChart + " is set");
							}
						},
						errorMessage: "Pie chart is not set"
					});
				},
				
				iSetRadarChart: function () {
					return this.waitFor({
						controlType: "sap.m.Popover",
						viewName: "tabs.Chart",
						success: function (aPopover) {
							var oChartTypePopUp = aPopover[0].isOpen();
							if (oChartTypePopUp === true) {
								var oRadarChart = aPopover[0].getContent()[0].getAggregation("items")[3].getTitle();
								ok(true, oRadarChart + " is set");
							}
						},
						errorMessage: "Radar chart is not set"
					});
				},

				iSeeDefaultDimensionMeasure: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "tabs.Chart",
						success: function (aDialogs) {
							var sTitle = aDialogs[0].getContent()[0].getAggregation("pages")[0].getAggregation("customHeader").getAggregation("contentMiddle")[0].getText(),
								oMeasuresItem, oDimensionsItem;
							if (sTitle === "Filter By") {
								//get the dimension and measures item
								oMeasuresItem = aDialogs[0].getContent()[0].getAggregation("pages")[0].getAggregation("content")[1].getAggregation("items")[0];
								oDimensionsItem = aDialogs[0].getContent()[0].getAggregation("pages")[0].getAggregation("content")[1].getAggregation("items")[1];
								//check the counter value to decide if the measures are selected or not.
								if (oMeasuresItem.getCounter() > 0) {
									ok(true, "Default measures are selected");
								} else {
									ok(false, "Default measures are not selected");
								}
							}
						},
						errorMessage: "Couldnt open Dialog for Filter chart settings"
					});
				}
			}
		}
	});
});
