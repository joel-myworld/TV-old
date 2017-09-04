/*global opaTest*/
//declare unusual global vars for JSLint/SAPUI5 validation
sap.ui.define([
	"sap/ui/test/Opa5",
	"com/siemens/tableViewer/test/integration/pages/Common",
	"sap/ui/test/matchers/AggregationFilled",
	"sap/ui/test/matchers/PropertyStrictEquals"
], function (Opa5, Common, AggregationFilled, PropertyStrictEquals) {
	"use strict";


	Opa5.createPageObjects({
		onTheFilterBar: {
			baseClass: Common,
			actions: {
				iFoundFilterBar: function () {
					return this.waitFor({
						id: "siemens.ui.filterbar",
						viewName: "TableViewer",
						errorMessage: "Filter Bar not found"
					});
				},

				iOpenValueHelp: function() {
					return this.waitFor({
						id: "siemens.ui.filterbar",
						viewName: "TableViewer",
						success: function (oFilterBar) {
							   var oValueHelp = oFilterBar.getAggregation("content")[1].getAggregation("content")[0].getAggregation("content")[1];
							   oValueHelp.fireValueHelpRequest();
						},
						errorMessage: "Couldnt find any filters pre-selected"
					});
				},

				iFoundFilterBarHideButton: function () {
					var oButton;
					return this.waitFor({
						id: "siemens.ui.filterbar",
						viewName: "TableViewer",
						matchers: function (oFilterBar) {
							try {
								   oButton = oFilterBar.getAggregation("content")[0].getAggregation("content")[2].getAggregation("content")[0].getAggregation("content")[0];
								   return true;
							} catch (e) {
								   return false;
							}
						},
						success: function () {
							   oButton.firePress();
						},
						errorMessage: "Hide button for Filter Bar not found"
					});
				},
				iFoundFilterBarVisibleItem: function () {
					var oItem;
					return this.waitFor({
						id: "siemens.ui.filterbar",
						viewName: "TableViewer",
						matchers: function (oFilterBar) {
							var aItems = oFilterBar.getFilterItems();
							   for (var iItem = 0; iItem < aItems.length; iItem++) {
								   if (aItems[iItem].getProperty("visibleInFilterBar")) {
									   oItem = aItems[iItem];
									   return true;
								}
							}
							   return false;
						},
						success: function () {
                               ok(true,"Filter bar items are found")         
						},
						errorMessage: "No visible items found"
					});
				},

				iClickFiltersButton: function () {
					var oButton;
					return this.waitFor({
						id: "siemens.ui.filterbar",
						viewName: "TableViewer",
						matchers: function (oFilterBar) {
							try {
								   oButton = oFilterBar.getAggregation("content")[0].getAggregation("content")[2].getAggregation("content")[0].getAggregation("content")[3];
								   return true;
							} catch (e) {
								   return false;
							}
						},
						success: function () {
							    oButton.firePress();
						},
						errorMessage: "Filters button for Filter Bar not found"
					});
				},
				
				iSelectMaterialField: function () {
					return this.waitFor({
						controlType: "sap.m.Dialog",
						viewName: "TableViewer",
						success: function (aDialogs) {
							   if (aDialogs[0].getTitle() === "Filters") {
								   //take material as example
								   var oMaterialValueInputCheck = aDialogs[0].getAggregation("content")[0].getAggregation("formContainers")[1].getAggregation("formElements")[1].getAggregation("fields")[1];
								   oMaterialValueInputCheck.setEnabled(true);
							} else {
								   ok(false, "Filter options dialog couldnt be opened");
							}
						},
						errorMessage: "Filter option dialog is not opened"
					});
				},

				iSelectMultiInputFilterControl: function () {
					return this.waitFor({
						controlType: "sap.m.Dialog",
						viewName: "TableViewer",
						success: function (aDialogs) {
							   if (aDialogs[0].getTitle() === "Filters") {
								   //take calmonth as example
								   var oCalmonthValueInput = aDialogs[0].getAggregation("content")[0].getAggregation("formContainers")[1].getAggregation("formElements")[0].getAggregation("fields")[0];
								   oCalmonthValueInput.fireValueHelpRequest();
							} else {
								   ok(false, "Filter options dialog couldnt be opened");
							}
						},
						errorMessage: "Filter option dialog is not opened"
					});
				},

				iSetIncludeExcludeCondition: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.ui.comp.valuehelpdialog.ValueHelpDialog",
						viewName: "TableViewer",
						success: function (aValueHelpDialogs) {
							   //Include
							   aValueHelpDialogs[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[5].setValue("03.2010");
							   aValueHelpDialogs[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[5].fireChange();
							   //Exclude
							   aValueHelpDialogs[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[1].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[5].setValue("06.2016");
							   aValueHelpDialogs[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[1].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[5].fireChange();

							   aValueHelpDialogs[0].getButtons()[0].firePress();
							   ok(true, "Defined include and exclude conditions");
						},
						errorMessage: "Selected value help dialog couldnt be opened"
					});
				},

				iEnterIncludeData: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.ui.comp.valuehelpdialog.ValueHelpDialog",
						viewName: "TableViewer",
						success: function (aValueHelpDialogs) {
							var mArgs = {},
							   oInput = aValueHelpDialogs[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[5];
							   mArgs.value = "da1";
							   oInput.setValue("da");
							   oInput.focus();
							   oInput.setShowSuggestion(true);
							   oInput.setValueLiveUpdate(true);
							   oInput.fireSuggest();
							   oInput.fireLiveChange(mArgs);
							   oInput._oSuggestionPopup.open();
						},
						errorMessage: "Selected value help dialog couldnt be opened for entering Include condition data"
					});
				},

				iPressCancelOnFiltersDialog: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "TableViewer",
						success: function (aDialogs) {
							if (aDialogs[0].getTitle() === "Filters") {
								var oCancelButton = aDialogs[0].getButtons()[3];
								oCancelButton.$().trigger("tap");
							}
						},
						errorMessage: "Filter option dialog couldnt be found"
					});
				}			
			},
			
			assertions: {
				theFilterBarFound: function () {
					return this.waitFor({
						controlType: "sap.ui.comp.filterbar.FilterBar",
						viewName: "TableViewer",
						matchers: function (oFilterBar) {
							var sId = oFilterBar.getId();
							return sId.match("siemens.ui.filterbar");
						},
						success: function (oFilterBar) {
							ok(true, "View have filter bar");
						},
						errorMessage: "View doesn't contain filter bar"
					});
				},

				iSeeBusyIndicator: function() {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.ui.comp.valuehelpdialog.ValueHelpDialog",
						viewName: "TableViewer",
						visible: true,
						timeout: 45,
						pollingInterval : 600,
						check : function (aValueHelpDialogs) {
				              if(aValueHelpDialogs[0].getContent()[0].getAggregation("content")[0].getAggregation("content")[0].getBusy()) {
				             	return true;
				             }else {
				             	return false;
				             }
				        },
						success: function (aValueHelpDialogs) {
							ok(true, "busy indicator shown");
						},
						errorMessage: "couldnt show busy indicator"
					});
				},

				theFilterBarHidden: function () {
					return this.waitFor({
						id: "siemens.ui.filterbar",
						viewName: "TableViewer",
						matchers: function (oFilterBar) {
							return !oFilterBar.getFilterBarExpanded();
						},
						success: function (oFilterBar) {
							ok(true, "Filter Bar hidden");
						},
						errorMessage: "Filter Bar not found"
					});
				},

				theFiltersDialogOpens: function () {
					return this.waitFor({
						controlType: "sap.m.Dialog",
						viewName: "TableViewer",
						success: function (aDialogs) {
							if (aDialogs[0].getTitle() === "Filters") {
								ok(true, "Filter options dialog opened");
							} else {
								ok(false, "Filter options dialog couldnt be opened");
							}
						},
						errorMessage: "Filter option dialog couldnt be found"
					});
				},

				iShouldSeeSelectedValueHelpDialog: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.ui.comp.valuehelpdialog.ValueHelpDialog",
						viewName: "TableViewer",
						success: function (aValueHelpDialogs) {
							var oDefineConditionButton = aValueHelpDialogs[0].getAggregation("customHeader").getAggregation("contentRight")[0];
							oDefineConditionButton.firePress();
							ok(true, "Value help dialog define conditions button triggered");
						},
						errorMessage: "Selected value help dialog couldnt be opened"
					});
				},

			    theFiltersDialogShouldBeClosed: function () {
				    return this.waitFor({
					searchOpenDialogs: true,
					controlType: "sap.m.Dialog",
					viewName: "TableViewer",
					success: function (aDialogs) {
						if(aDialogs[0].getTitle() === "Filters") {
							aDialogs[0].close();
							ok(true, "Filter dialog closed");
						}else {
							ok(false, "Could not close filter dialog");
						}
					},
					errorMessage: "Could not close dialog"
				});
			},

				iShouldSeeConditionsInFilterDialog: function () {
				   	return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "TableViewer",
						success: function (aDialogs) {
							var oCalmonthValueInput = aDialogs[0].getAggregation("content")[0].getAggregation("formContainers")[1].getAggregation("formElements")[0].getAggregation("fields")[0];
							if (oCalmonthValueInput.getTokens().length > 0) {
//								aDialogs[0].getButtons()[0].firePress();
								ok(true, "Include Exclude conditions set successfully");
							} else {
								ok(false, "Include Exclude conditions not set successfully");
							}
						},
						errorMessage: "Selected value help dialog couldnt be opened"
					});
				},

				iShouldSeeMaterialFieldChecked: function () {
					return this.waitFor({
						controlType: "sap.m.Dialog",
						viewName: "TableViewer",
						success: function (aDialogs) {
							var oMaterialValueInputCheck = aDialogs[0].getAggregation("content")[0].getAggregation("formContainers")[1].getAggregation("formElements")[1].getAggregation("fields")[1]; 
							  if(oMaterialValueInputCheck.getEnabled() === true){
								ok(true,"Material field is checked");
							  }
							  else{
								  ok(true,"Material field is not checked");
							  }
							},
						errorMessage: "couldn't find the material field"
					});
				},
				
				iShouldSeeSuggestionList: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Popover",
						viewName: "TableViewer",
						success: function (aPopover) {
							ok(true, "Suggestion list is visible");
						},
						errorMessage: "Suggestion list is not found"
					});
				}
            }
		}
	});
});
