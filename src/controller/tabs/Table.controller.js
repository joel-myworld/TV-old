sap.ui.define([
	"com/siemens/tableViewer/controller/BaseController",
	"com/siemens/tableViewer/model/formatter",
	"com/siemens/tableViewer/control/CustomColumn",
	"com/siemens/tableViewer/model/models",
	"sap/m/Label",
	"sap/m/Text",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/table/SortOrder",
	"sap/ui/table/TablePersoController",
	"sap/m/Link",
	"sap/ui/model/odata/ODataUtils",
	"sap/m/MessageBox",
	"sap/ui/core/Fragment",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/odata/CountMode",
	"sap/ui/table/Column",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/commons/RangeSlider",
	"sap/ui/model/type/Time"
], function(BaseController, formatter, Column, models, Label, Text, JSONModel, Filter, Sorter, SortOrder, TablePersoController, Link, ODataUtils, MessageBox, Fragment, FilterOperator, CountMode, TableColumn, ODataModel, RangeSlider, Time) {
	"use strict";
	/* global $ */
	return BaseController.extend("com.siemens.tableViewer.controller.tabs.Table", {
		config: {
			elements: {
				table: "siemensUiTable",
				detailTable: "siemensUiDetailTable",
				additionalTable: "siemensUiAdditionalTable"
			},
			models: {
				tableView: "tableView"
			},
			paths: {
				mainConfigColumns: "mainConfig>/ServiceColumns/results",
				columns: "/ServiceColumns/results",
				exportService: "odxl/odxl.xsjs",
				mainConfig: "mainConfig",
				tableExportFormats: "tableExportFormats",
				variantService: "variants.xsodata",
				variantData: "variantData",
				variantEntity: "/VariantsSet"
			},
			formatter: {
				date: "dd.MM.yyyy"
			},
			limitations: {
				exportLimitationRows: 5000
			}
		},

		formatter: formatter,
		/**
		 * Called when the table controller is instantiated.
		 * @public
		 */
		onInit: function() {
			var oViewModel = new JSONModel({
					rowCount: 0,
					busy: true,
					delay: 0,
					enableShowDetailsButton: false
				}),
				oRouter = this.getRouter(),
				oColumnModel = this.getComponentModel("mainConfig"),
				aColumnModelRead = this._retrieveVisibleColumns(oColumnModel),
				sVisibleColumns = aColumnModelRead.visibleColumns,
				oTable = this.byId(this.config.elements.table),
				oEventBus = this.getEventBus(),
				bDependant = this.getOwnerComponent()._getUriParams("dependent");
			this._aAggregatedColumns = aColumnModelRead.aggregatedColumns;
			
			this._setTableViewModel(oViewModel);
			oEventBus.subscribe("TableViewer", "ReturnFilterData", this._storeFilterData, this);

			var fnSetAppNotBusy;

			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				if (bDependant === "true"){
					this.getModel("view").setProperty("/aMainFilters",aInitFilters);
				}
				this._bindTable(oTable, sVisibleColumns, aInitFilters);
				oRouter.attachRoutePatternMatched(this._onRouteMatched, this);
			};

			this.getOwnerComponent().oWhenMetadataIsLoaded.then(fnSetAppNotBusy.bind(this), fnSetAppNotBusy);

			var oModel = this.getComponentModel();

			oModel.attachEventOnce("requestSent", function() {
				oViewModel.setProperty("/busy", true);
			});

			oModel.attachEventOnce("requestCompleted", function() {
				oViewModel.setProperty("/busy", false);
			});

			this._setTableDataModel(oTable, this.getComponentModel());

			this.setModel(models.createTableExportFormatsModel(), this.config.paths.tableExportFormats);

			this._removeStaticColumns();

			if (bDependant) {
				var bInitial = bDependant !== "true";
				var aInitFilters = this._createInitialFilters(bInitial);
				aInitFilters = aInitFilters.length > 0 || aInitFilters instanceof sap.ui.model.Filter ? aInitFilters : undefined;
			}

			this._initializeTablePerso();

			oEventBus.subscribe("TableController", "SetVariantSelect", this._setVariantSelect, this)
				.subscribe("TableController", "RemoveFilters", this._setupFilters, this)
				.subscribe("TableController", "SetupFilters", this._setupFilters, this)
				.subscribe("TableController", "InputParameters", this._setupFilters, this)
				.subscribe("TableController", "resetColumnColorConfig", this._resetColumnColors, this);
		},

		_storeFilterData: function(sChannel, sEvent, oData) {
			this._filterObject = oData;
		},

		onRowSelectionChange: function(oEvent) {
			var iDrillDown = this.getModel("mainConfig").getProperty("/DRILL_DOWN");

			if (iDrillDown === 1) {
				this._showHideDetailsButton(oEvent);
			} else if (iDrillDown === 2) {
				this._createDetailsTable(oEvent);
			}
		},

		_showHideDetailsButton: function(oEvent) {
			var oTable = oEvent.getSource(),
				oViewModel = this.getModel(this.config.models.tableView);

			if (oTable.getSelectionMode() === "MultiToggle" && oTable.getSelectedIndices().length > 0) {
				oViewModel.setProperty("/enableShowDetailsButton", true);
			} else {
				oViewModel.setProperty("/enableShowDetailsButton", false);
			}
		},

		_createDetailsTable: function(oEvent) {
			var oTable = oEvent.getSource(),
				iIndex = oEvent.getParameter("rowIndex"),
				oLayout = this.byId("siemensUiDetailTableLayout");

			if (oTable.isIndexSelected(iIndex)) {
				var oDetailTable = this.byId(this.config.elements.additionalTable);
				var oSelectedRowContext = oEvent.getParameter("rowContext");
				var oSelectedRowData = oSelectedRowContext.getObject();
				var oDetailConfigModel;
				var oModel;
				var oInputParametersModel;

				// check if table already exist
				if (!oDetailTable) {
					oDetailTable = sap.ui.xmlfragment(this.getView().getId(), "com.siemens.tableViewer/view/tabs/fragments/AdditionalTable");
					oLayout.addContent(oDetailTable);

					// prepare service url for oData requests for config
					var sODataUrl = this.getOwnerComponent().getMetadata().getConfig().serviceUrl;
					var sMainODataUrl = [sODataUrl, "main.xsodata"].join("");
					oDetailConfigModel = models.createConfigurationModel(sMainODataUrl, this._getTargetCalcID()).oConfigModel;
					this.setModel(oDetailConfigModel, "detConfig");

					// prepare service url for oData requests for data
					var sServiceUrl = [sODataUrl, oDetailConfigModel.getProperty("/SERVICE_NAME")].join("");

					// check to see if ODATA_SRV is 1
					var bIsODataServer = oDetailConfigModel.getProperty("/ODATA_SRV") === 1;
					if (bIsODataServer) {
						oModel = models.createODataModelWithParams(sServiceUrl);
						// set and enable busy indicator to detail table
						this.attachRequestsForControlBusyIndicator(oModel, oDetailTable);
						oDetailTable.setModel(oModel, "detSRV");
					} else {
						jQuery.sap.log.error("Please configure your Detail service properly");
						return;
					}

					// bind table column with config data
					oDetailTable.bindAggregation("columns", "detConfig>/ServiceColumns/results", this._prepareRows.bind("detSRV>"));

					// bind table Title 
					var oTitle = this.byId("siemensUiAdditionalTableTitle");
					oTitle.bindProperty("text", "detConfig>/TABLE_TITLE");

					// bind table Treshhold
					oDetailTable.bindProperty("threshold", {
						path: "detConfig>/THRESHOLD",
						formatter: formatter.getThreshold
					});

					if (oDetailConfigModel.getProperty("/INPUT_PARAMETERS")) {
						// create Input Parameters model
						oInputParametersModel = models.createInputParametersModel();
						oDetailTable.setModel(oInputParametersModel, "detInputParams");
					}

				}
				oDetailConfigModel = this.getModel("detConfig");
				var oVisibleAggregatedColumns = this._retrieveVisibleColumns(oDetailConfigModel);
				var sVisibleColumns = oVisibleAggregatedColumns.visibleColumns;
				var aAggregatedColumns = oVisibleAggregatedColumns.aggregatedColumns;

				// get row data from the selected row and return the filter			
				var aFilters = this._getSelDetailsFilterDrillDwn(oSelectedRowData, this._readVisibleColumns(oTable.getColumns()));
				if (aFilters.length === 0) {
					jQuery.sap.log.error("Please set configured columns to be visible for Master-Detail functionality, to be able to pass filters");
					return;
				}

				oModel = oDetailTable.getModel("detSRV");
				oInputParametersModel = oDetailTable.getModel("detInputParams");
				var fBindTable = function() {
					this._bindAggregatedColumns(sVisibleColumns, new Filter(aFilters, true), oDetailTable, oModel, "/" + oDetailConfigModel.getProperty("/ENTITY_NAME"), aAggregatedColumns);

					//bind rows of table with drill data and select parameter with visible columns
					oDetailTable.bindRows({
						path: "detSRV>/" + oDetailConfigModel.getProperty("/ENTITY_NAME"),
						filters: aFilters,
						parameters: {
							select: sVisibleColumns
						}
					});
				}.bind(this);

				if (!oModel.getServiceMetadata()) {
					oModel.attachMetadataLoaded(function() {
						if (oDetailConfigModel.getProperty("/INPUT_PARAMETERS")) {
							this._getMetadataDefaultValues(oModel, oInputParametersModel);
							var aSplitedEntity = oDetailConfigModel.getProperty("/ENTITY_NAME").split("/");
							if (aSplitedEntity.length > 1) {
								this._getDefaultEntityValues(aSplitedEntity[0], oInputParametersModel);
							}
							if (this.getModel("mainConfig").getProperty("/INPUT_PARAMETERS")) {
								this._getDefaultEntityValues(this.getModel("mainConfig").getProperty("/ENTITY_NAME"), oInputParametersModel);
							}

							this._setEntityNameWithInputParams(oInputParametersModel, oDetailConfigModel);
						}
						fBindTable();
					}.bind(this));
				} else {
					if (oDetailConfigModel.getProperty("/INPUT_PARAMETERS") && this.getModel("mainConfig").getProperty("/INPUT_PARAMETERS")) {
						this._getDefaultEntityValues(this.getModel("mainConfig").getProperty("/ENTITY_NAME"), oInputParametersModel);
						this._setEntityNameWithInputParams(oInputParametersModel, oDetailConfigModel);
					}

					fBindTable();
				}

				oLayout.setVisible(true);
			} else {
				oLayout.setVisible(false);
			}
		},

		onDrillDown: function() {
			var oTable = this.getView().byId(this.config.elements.table),
				aSelectedIndices = oTable.getSelectedIndices(),
				aBondItems = [],
				oItemContext,
				oValuesForFilter = {},
				aVisibleColumns = [],
				oEventBus = this.getEventBus();

			oEventBus.publish("TableViewer", "SaveInitialReport");

			oTable.getColumns().map(function(oColumn) {
				if (oColumn.getVisible()) {
					aVisibleColumns.push(oColumn.getSortProperty());
				}
			});

			this.getModel("mainConfig").getProperty(this.config.paths.columns).map(function(oColumn) {
				if (oColumn.DRILL_DOWN_BOND && aVisibleColumns.indexOf(oColumn.COLUMN) !== -1) {
					aBondItems.push({
						from: oColumn.COLUMN,
						to: oColumn.DRILL_DOWN_BOND
					});
					oValuesForFilter[oColumn.DRILL_DOWN_BOND] = [];
				}
			});

			var setValuesForFilter = function(oBondItem) {
				if (oItemContext.getProperty(oBondItem.from) instanceof Date) {
					if (oValuesForFilter[oBondItem.to].map(Number).indexOf(+oItemContext.getProperty(oBondItem.from)) === -1) {
						oValuesForFilter[oBondItem.to].push(oItemContext.getProperty(oBondItem.from));
					}
				} else {
					if (oValuesForFilter[oBondItem.to].indexOf(oItemContext.getProperty(oBondItem.from)) === -1) {
						oValuesForFilter[oBondItem.to].push(oItemContext.getProperty(oBondItem.from));
					}
				}
			};

			for (var iSelectedIndex = 0; iSelectedIndex < aSelectedIndices.length; iSelectedIndex++) {
				oItemContext = oTable.getContextByIndex(aSelectedIndices[iSelectedIndex]);
				if (oItemContext) {
					$.grep(aBondItems, setValuesForFilter);
				}
			}

			var sMainConfigModel = this.getModel(this.config.paths.mainConfig),
				sDrillDownTarget = sMainConfigModel.getProperty("/DRILL_DOWN_TARGET"),
				oFilterObject = {};

			oFilterObject["oFilters"] = oValuesForFilter;

			if (sMainConfigModel.getProperty("/INPUT_PARAMETERS")) {
				var sEntity = sMainConfigModel.getProperty("/ENTITY_NAME");

				oFilterObject["IP"] = sEntity.slice(sEntity.indexOf("(") + 1, sEntity.indexOf(")"));
			}

			var oVariantModel = this.getModel(this.config.paths.variantData);

			if (!oVariantModel) {
				// set variant model
				oVariantModel = new ODataModel([this.getOwnerComponent().getMetadata().getConfig().serviceUrl, this.config.paths.variantService].join(""), true);

				oVariantModel.setDefaultCountMode(CountMode.Inline);
				this.setModel(oVariantModel, this.config.paths.variantData);
			}

			var oPayLoad = {
				CTRLID: sDrillDownTarget,
				VariantId: "DependentReport",
				UserId: "",
				VariantName: "DependentReport",
				isDefault: 0,
				isGlobal: 0,
				isHidden: 1,
				filterObject: encodeURI(JSON.stringify(oFilterObject)),
				forUsers: "",
				tableColumns: "",
				filterFields: ""
			};

			oVariantModel.create("/VariantsUpsert", oPayLoad, {
				success: function() {
					if (this.getModel("view").getProperty("/moveToNewReport")) {
						this.getModel("view").setProperty("/moveToNewReport", false);
						this.handleCrossAppNavigation(sDrillDownTarget, true);
					} else {
						this.getModel("view").setProperty("/moveToNewReport", true);
					}
				}.bind(this),
				error: function(oError) {
					jQuery.sap.log.error(oError);
				}
			});
		},

		/**
		 * Event handler for press event of Cell configuration button. To open config Dialog
		 * @param {sap.ui.base.Event} oEvent - cell config button press event
		 * @public
		 */
		onPressColorConfiguration: function(oEvent) {
			// create fragment instance
			this._oColorConfigDialog = sap.ui.xmlfragment(this._getCellColorConfigFragDiagId(), "com.siemens.tableViewer/view/tabs/fragments/CellConfigDialog", this);
			//get the service columns from main config model and set it to the JSON model
			var aColumns, oCellColorsColumnModel;
			aColumns = this.getModel("mainConfig").getData().ServiceColumns;

			oCellColorsColumnModel = new JSONModel();
			oCellColorsColumnModel.setData(aColumns);

			this.setModel(oCellColorsColumnModel, "cellColorsColumnModel");
			//set the fragment as the dependent to the view
			this.getView().addDependent(this._oColorConfigDialog);

			// add compact styles
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oColorConfigDialog);
			//open cell config dialog
			this._oColorConfigDialog.open();
		},

		/**
		 * Event handler for on before open of cell config dialog
		 * @param {sap.ui.base.Event} oEvent - on before open event handler for dialog
		 * @public
		 */
		onBeforeOpeCellColorDialog: function() {
			var oCellColorsColumnModel = this.getModel("cellColorsColumnModel"),
				aColumns = oCellColorsColumnModel.oData.results,
				oForm = this._getCellColorConfigForm(),
				oControl, oSelect, iValue1, iValue2,
				aColumnsConfigUpdate = [],
				oResources = this.getResourceBundle();

			//Check for CFORMAT = 1 columns
			//Check for columns with CTYPE 3 and 7 only
			//Generate Range Slider and input controls for these columns

			for (var i = 0; i < aColumns.length; i++) {
				//check for cell format flag
				if (aColumns[i].CFORMAT === 1) {
					//check for column type 3 and 7
					if (aColumns[i].CTYPE === 3 || aColumns[i].CTYPE === 7) {
						//push the column name, later to update columns which are only enabled for cell config
						aColumnsConfigUpdate.push(aColumns[i].COLUMN);
						//Add Label
						oForm.addContent(new sap.m.Label({
							text: aColumns[i].LABEL,
							tooltip: aColumns[i].LABEL
						}));
						//get the ranges defined in configuration table
						var iMin = parseFloat(aColumns[i].CRANGE.split(":")[0]);
						var iMax = parseFloat(aColumns[i].CRANGE.split(":")[1]);
						//get saved cell format conditions
						var sConditions = aColumns[i].CFORMAT_CONDITION;
						var aConditions = [];
						if (sConditions.match(/([&*])/g) !== null) {
							//multiple conditions
							aConditions = sConditions.split("&");
						} else {
							//single condition
							aConditions.push(sConditions);
						}
						//get saved cell format colors for the saved conditions
						var aSavedColors = this._getSavedCellColors(aColumns[i].CFORMAT_COLOR);
						//length defined no. of conditions
						var iNoRanges = aConditions.length;
						//set value1 and value2 values and then use it to set to range slider
						if (iNoRanges === 3) {
							iValue1 = aConditions[1].split(":")[0];
							iValue2 = aConditions[1].split(":")[1];
						} else {
							if (iNoRanges === 1) {
								iValue1 = aConditions[0].split(":")[0];
								iValue2 = aConditions[0].split(":")[1];
							}

							if (iNoRanges === 2) {
								iValue1 = aConditions[0].split(":")[1];
								iValue2 = aConditions[1].split(":")[1];
							}
						}
						//set range selector
						oControl = new RangeSlider(this.createId("siemensUiCellConfigSlider_" + aColumns[i].COLUMN));
						oControl.addStyleClass("sapUiSmallMarginEnd");
						oControl.setValue(parseFloat(iValue1));
						oControl.setValue2(parseFloat(iValue2));
						oControl.setMin(iMin);
						oControl.setMax(iMax);
						oControl.setTotalUnits(4);
						//oControl.setSmallStepWidth(5);
						oControl.setLabels(this._getRangeSliderLabels(iMin, iMax));
						oControl.setStepLabels(true);
						oControl.attachChange(jQuery.proxy(this._setRangeValuestoText, this));
						oControl.attachLiveChange(jQuery.proxy(this._setRangeValuestoText, this));

						oForm.addContent(oControl.addCustomData(
								new sap.ui.core.CustomData({
									key: "CFORMAT_CONDITION",
									value: aColumns[i].CFORMAT_CONDITION
								}))
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "COLUMN",
									value: aColumns[i].COLUMN
								}))
						);
						//layout for holding value and value2 of range slider in input field
						var oHValues = new sap.ui.layout.HorizontalLayout()
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "COLUMN",
									value: aColumns[i].COLUMN
								}))
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "VALUE_RANGES",
									value: parseFloat(iValue1) + ":" + parseFloat(iValue2)
								}));
						oHValues.removeAllContent();
						//for value1 of range slider
						oHValues.addContent(new sap.m.Input(this.createId("siemensUiSliderValue1_" + aColumns[i].COLUMN), {
								width: "100px",
								value: iValue1,
								placeholder: oResources.getText("cellConfig.value1.xtol"),
								tooltip: oResources.getText("cellConfig.value1.xtol"),
								change: jQuery.proxy(this._handleValue1RangeChange, this)
							})
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "COLUMN",
									value: aColumns[i].COLUMN
								}))
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "VALUE1_RANGE",
									value: parseFloat(iValue1)
								}))
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "CFORMAT_CONDITION",
									value: aColumns[i].CFORMAT_CONDITION
								})).addStyleClass("sapUiTinyMarginEnd")
						);
						//for value2 of range slider
						oHValues.addContent(new sap.m.Input(this.createId("siemensUiSliderValue2_" + aColumns[i].COLUMN), {
								width: "100px",
								value: iValue2,
								placeholder: oResources.getText("cellConfig.value2.xtol"),
								tooltip: oResources.getText("cellConfig.value2.xtol"),
								change: jQuery.proxy(this._handleValue2RangeChange, this)
							})
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "COLUMN",
									value: aColumns[i].COLUMN
								}))
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "VALUE2_RANGE",
									value: parseFloat(iValue2)
								}))
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "CFORMAT_CONDITION",
									value: aColumns[i].CFORMAT_CONDITION
								}))
						);

						oForm.addContent(oHValues);

						//layout for setting minimum and maximum range for range slider
						var oHRange = new sap.ui.layout.HorizontalLayout()
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "COLUMN",
									value: aColumns[i].COLUMN
								}))
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "SLIDER_RANGE",
									value: iMin + ":" + iMax
								}))
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "CRANGE",
									value: aColumns[i].CRANGE
								}));
						oHRange.removeAllContent();
						oHRange.addStyleClass("sapUiTinyMarginEnd");
						//set range label
						oHRange.addContent(new sap.m.Text({
							text: oResources.getText("cellConfig.Range.xlbl")
						}).addStyleClass("sapUiTinyMarginEnd"));
						//for min
						oHRange.addContent(new sap.m.Input(this.createId("siemensUiSliderMinRange_" + aColumns[i].COLUMN), {
								width: "100px",
								value: parseFloat(iMin),
								placeholder: oResources.getText("cellConfig.min.xtol"),
								tooltip: oResources.getText("cellConfig.min.xtol"),
								change: jQuery.proxy(this._handleMinRangeChange, this)
							})
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "COLUMN",
									value: aColumns[i].COLUMN
								}))
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "MIN_RANGE",
									value: iMin
								}))
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "CRANGE",
									value: aColumns[i].CRANGE
								})).addStyleClass("sapUiTinyMarginEnd")
						);
						//for max
						oHRange.addContent(new sap.m.Input(this.createId("siemensUiSliderMaxRange_" + aColumns[i].COLUMN), {
								width: "100px",
								value: parseFloat(iMax),
								placeholder: oResources.getText("cellConfig.max.xtol"),
								tooltip: oResources.getText("cellConfig.max.xtol"),
								change: jQuery.proxy(this._handleMaxRangeChange, this)
							})
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "COLUMN",
									value: aColumns[i].COLUMN
								}))
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "MAX_RANGE",
									value: iMax
								}))
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "CRANGE",
									value: aColumns[i].CRANGE
								}))
						);
						oForm.addContent(oHRange);

						//next label for the same column for select list
						oForm.addContent(new sap.m.Label({
							text: ""
						}));

						var oHColors = new sap.ui.layout.HorizontalLayout(this.createId("siemensUiCellConfigColorsHLyt" + aColumns[i].COLUMN)).addCustomData(
								new sap.ui.core.CustomData({
									key: "CFORMAT_COLOR",
									value: aColumns[i].CFORMAT_COLOR
								}))
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "COLUMN",
									value: aColumns[i].COLUMN
								}))
							.addCustomData(
								new sap.ui.core.CustomData({
									key: "COLOR_RANGES",
									value: aColumns[i].CRANGE_COLORS
								}));
						oHColors.removeAllContent();
						//generate no. of dropdowns based on number of conditions
						for (var s = 0; s < iNoRanges; s++) {
							oSelect = new sap.m.Select({
								width: "100px"
							}).addStyleClass("sapUiTinyMarginEnd");

							var sColors = aColumns[i].CRANGE_COLORS;
							var aColors = [];
							if (sColors.match(/([,*])/g) !== null) {
								//multiple conditions
								aColors = sColors.split(",");
							} else {
								//single condition
								aColors.push(sColors);
							}

							for (var c = 0; c < aColors.length; c++) {
								oSelect.addItem(new sap.ui.core.Item({
									key: aColors[c],
									text: {
										parts: [{
											path: aColors[c]
										}],
										formatter: jQuery.proxy(this._setSelectItemBackground)
									}
								}));
							}

							//set default colors in the select list.
							if (aSavedColors.length === iNoRanges) {
								oSelect.setSelectedKey(aSavedColors[s]);
							} else {
								oSelect.setSelectedKey(aColors[s]);
							}

							oSelect.addCustomData(
									new sap.ui.core.CustomData({
										key: "CFORMAT_COLOR",
										value: aColumns[i].CFORMAT_COLOR
									}))
								.addCustomData(
									new sap.ui.core.CustomData({
										key: "COLUMN",
										value: aColumns[i].COLUMN
									}));

							oHColors.addContent(oSelect);
						}
						oHColors.addStyleClass("sapUiMediumMarginBottom");
						oForm.addContent(oHColors);
					}
				}
			}
			//set the columns marked for cell config feature
			this._setColumnsForConfigUpdate(aColumnsConfigUpdate);
		},
		/**
		 * Method to prepare labels for range slider by taking minimum and maximum values from the slider
		 * @param {Number} iMin - Minimum number of the slider
		 * @param {Number} iMax - Maximum number of the slider
		 * @returns {Array} aLabel - array containing labels
		 * @private
		 */
		_getRangeSliderLabels: function(iMin, iMax) {
			var iDifference = 0,
				iRemainder = 0,
				aLabel = [],
				iLeast, iLargest;
			if (iMax > iMin) {
				iLeast = iMin;
				iLargest = iMax;
				iDifference = iMax - iMin;
			} else {
				iLeast = iMax;
				iLargest = iMin;
				iDifference = iMin - iMax;
			}
			iRemainder = iDifference / 4;

			for (var i = 0; i <= 4; i++) {
				if (i === 0) {
					aLabel.push(formatter.formatRangeSliderLabel(iLeast).toString());
				} else {
					iLeast = iLeast + iRemainder
					aLabel.push(formatter.formatRangeSliderLabel(iLeast).toString());
				}

			}

			return aLabel;
		},

		/**
		 * Event handler for on press of save button in cell config dialog. Cell config to be applied to TV on this event
		 * @param {sap.ui.base.Event} oEvent - event handler for on save of cell config button
		 * @public
		 */
		onSaveCellColorDialog: function() {
			//var oCellColorsColumnModel = this.getModel("cellColorsColumnModel");
			var aColumns = this.getModel("mainConfig").getData().ServiceColumns;
			//var oForm = this._getCellColorConfigForm();

			//prepare payload
			//var aFormContents = oForm.getContent();

			for (var k = 0; k < aColumns.results.length; k++) {
				//update for CFORMAT_CONDITION
				var oRangeValue1 = this.byId("siemensUiSliderValue1_" + aColumns.results[k].COLUMN);
				var oRangeValue2 = this.byId("siemensUiSliderValue2_" + aColumns.results[k].COLUMN);
				if (typeof oRangeValue1 === "object" && typeof oRangeValue2 === "object") {
					if (oRangeValue1.getCustomData()[0].getValue() === aColumns.results[k].COLUMN &&
						oRangeValue2.getCustomData()[0].getValue() === aColumns.results[k].COLUMN &&
						oRangeValue1.getCustomData()[1].getKey() === "VALUE1_RANGE" &&
						oRangeValue2.getCustomData()[1].getKey() === "VALUE2_RANGE") {
						if (oRangeValue1.getCustomData()[2].getValue() === oRangeValue2.getCustomData()[2].getValue()) {
							aColumns.results[k].CFORMAT_CONDITION = oRangeValue1.getCustomData()[2].getValue();
						}
					}
				}
				//update for CFORMAT_COLOR
				var oColorLyt = this.byId("siemensUiCellConfigColorsHLyt" + aColumns.results[k].COLUMN);
				if (typeof oColorLyt === "object") {
					var aColorsSelects = oColorLyt.getContent();
					var aColors = [];
					var aColorItems = [];
					for (var v = 0; v < aColorsSelects.length; v++) {
						if (aColorsSelects[v].getVisible()) {
							aColorItems.push(aColorsSelects[v]);
						}
					}

					for (var c = 0; c < aColorItems.length; c++) {
						aColors.push(aColorItems[c].getSelectedItem().getKey());
					}
					aColumns.results[k].CFORMAT_COLOR = aColors.toString();
				}
				//update for CRANGE
				var oMin = this.byId("siemensUiSliderMinRange_" + aColumns.results[k].COLUMN);
				var oMax = this.byId("siemensUiSliderMaxRange_" + aColumns.results[k].COLUMN);

				if (typeof oMin === "object" && typeof oMax === "object") {
					if (oMin.getCustomData()[0].getValue() === aColumns.results[k].COLUMN &&
						oMax.getCustomData()[0].getValue() === aColumns.results[k].COLUMN &&
						oMin.getCustomData()[1].getKey() === "MIN_RANGE" &&
						oMax.getCustomData()[1].getKey() === "MAX_RANGE") {
						if (oMin.getCustomData()[2].getValue() === oMax.getCustomData()[2].getValue()) {
							aColumns.results[k].CRANGE = oMin.getCustomData()[2].getValue();
						}
					}
				}
			}
			//bind table with updated cell config
			var oTable = this.byId(this.config.elements.table);
			var aColumns = oTable.getAggregation("columns");
			var sVisibleColumns = this._readVisibleColumns(aColumns);
			this._resetColumnColorConfig(sVisibleColumns);
//			this._resetColumnColors();
			this._bindTable(oTable, sVisibleColumns);

			//prepare payload for batch update
			this._updateConfigTable();
			//close cell config dialog
			this._oColorConfigDialog.destroy();
		},
		
		_resetColumnColors: function(){
			var oTable = this.byId(this.config.elements.table);
			var aColumns = oTable.getAggregation("columns");
			var sVisibleColumns = this._readVisibleColumns(aColumns);
			this._resetColumnColorConfig(sVisibleColumns);
		},
		
		/**
		 * Utility method to reset the color of columns according to preference
		 * @private
		 * @params {string} contains list of visible columns
		 * @returns {object} returns the controller object to enable method chaining
		 */
		_resetColumnColorConfig: function(sVisibleColumns){
			
		var allColumns = this.getModel("mainConfig").getData().ServiceColumns.results;
			for(var i in allColumns){
					if(sVisibleColumns.search(allColumns[i].COLUMN) >= 0){
						allColumns[i].STDRD = 1;
					}else {
						allColumns[i].STDRD = 0;
				}
			}
			return this;
		},
		
		/**
		 * Event handler for on close of cell config dialog
		 * @param {sap.ui.base.Event} oEvent - on close event handler for dialog
		 * @public
		 */
		onCloseCellColorDialog: function(oEvent) {
			//close cell config dialog
			this._oColorConfigDialog.destroy();
		},
		/**
		 * Event handler for on after close of cell config dialog
		 * @param {sap.ui.base.Event} oEvent - on after close event handler for dialog
		 * @public
		 */
		onAfterCloseCellColorDialog: function(oEvent) {
			//close cell config dialog
			this._oColorConfigDialog.destroy();
		},

		_setColumnsForConfigUpdate: function(aColumns) {
			this._aColumnsConfigUpdate = aColumns;
		},

		/**
		 * utility method to get the columns that has cell config enabled
		 * @private
		 * @returns {object} aColumnsConfigUpdate - array of columns that has cell config enabled
		 */
		_getColumnsForConfigUpdate: function() {
			return this._aColumnsConfigUpdate;
		},

		/**
		 * Method to return the colors that are saved in config table for the conditions that are defined
		 * @param {String} sSavedColors - colors with comma separated
		 * @returns {object} aSavedColors - colors that are split and pushed in array
		 * @private
		 */
		_getSavedCellColors: function(sSavedColors) {
			var aSavedColors = [];
			if (sSavedColors.match(/([,*])/g) !== null) {
				//multiple conditions
				aSavedColors = sSavedColors.split(",");
			} else {
				//single condition
				aSavedColors.push(sSavedColors);
			}
			return aSavedColors;
		},

		/**
		 * Formatter method to set the item background color and text
		 * @private
		 * @returns {String} sText - formatted text
		 */
		_setSelectItemBackground: function() {
			//get the item key and set the item background color with the selected key
			//return the color name
			var sColor = this.getKey();
			//TODO remove the hardcoded check and set the item background with the color
			if (sColor === "#d7eaa2" || sColor === "#c6e17d" || sColor === "#9dc62d" || sColor === "#759422" || sColor === "#5b731a" || sColor === "#80b877" || sColor === "#61a656" || sColor === "b6d957") {
				this.setText("Green");
			} else if (sColor === "#e17b24" || sColor === "#e79651" || sColor === "#b96319" || sColor === "#dd8e07" || sColor === "#fac364") {
				this.setText("Orange");
			} else if (sColor === "#f2d249" || sColor === "#fbd491") {
				this.setText("Yellow");
			} else if (sColor === "#e34352" || sColor === "#d32030" || sColor === "#a71926" || sColor === "#911621") {
				this.setText("Red");
			} else {
				this.setText(sColor);
			}
			//set background color
			$("#" + this.getId()).css("background-color", sColor);
			return this.getText();
		},

		/**
		 * Helper method to return the instance of cell config dialog control
		 * @returns {String} Id of cell config dialog control
		 * @private
		 */
		_getCellColorConfigFragDiagId: function() {
			return this.createId("tvFragCellConfigDialog");
		},

		/**
		 * Helper method to return the instance of simple form control in cell config dialog
		 * @returns {Object} Instance of Simple form control
		 * @private
		 */
		_getCellColorConfigForm: function() {
			return this._getFragmentControl(this._getCellColorConfigFragDiagId(), "siemensUiCellColorForm");
		},

		/**
		 * Event handler for change/livechange of value1 input field that has the value 1 value from the range slider
		 * @param {sap.ui.base.Event} oEvent
		 * @private
		 */
		_handleValue1RangeChange: function(oEvent) {
			var oCellColorsColumnModel = this.getModel("cellColorsColumnModel");
			var aColumns = oCellColorsColumnModel.oData.results;

			for (var k = 0; k < aColumns.length; k++) {
				//check for column for which the cell has to be formatted.
				if (oEvent.getSource().getCustomData()[0].getValue() === aColumns[k]["COLUMN"] &&
					oEvent.getSource().getCustomData()[1].getKey() === "VALUE1_RANGE") {
					var oRangeSlider = this.byId("siemensUiCellConfigSlider_" + aColumns[k].COLUMN);
					var oValue2 = this.byId("siemensUiSliderValue2_" + aColumns[k].COLUMN);
					if (oEvent.getSource().getValue() === "") {
						oEvent.getSource().setValue("0");
					}
					//check the value entered is valid or not
					var isValid = this._isRangeValueValid(oEvent.getSource().getValue(), oRangeSlider, true, false, true);

					if (!isValid) {
						//if not valid, set the value1 value to range slider minimum value
						oEvent.getSource().setValue(oRangeSlider.getMin());
					}

					oRangeSlider.setValue(parseFloat(oEvent.getSource().getValue()));
					//get the formatted range text and set the custom data
					var sText = this._getRangeSelections(parseFloat(oEvent.getSource().getValue()), parseFloat(oValue2.getValue()), oRangeSlider.getMin(), oRangeSlider.getMax(), oRangeSlider);
					oEvent.getSource().getCustomData()[2].setValue(sText);
					oValue2.getCustomData()[2].setValue(sText);
					break;
				}
			}
		},
		/**
		 * Event handler for change/livechange of value2 input field that has the value 2 value from the range slider
		 * @param {sap.ui.base.Event} oEvent
		 * @private
		 */
		_handleValue2RangeChange: function(oEvent) {
			var oCellColorsColumnModel = this.getModel("cellColorsColumnModel");
			var aColumns = oCellColorsColumnModel.oData.results;

			for (var k = 0; k < aColumns.length; k++) {
				//check for column for which the cell has to be formatted.
				if (oEvent.getSource().getCustomData()[0].getValue() === aColumns[k]["COLUMN"] &&
					oEvent.getSource().getCustomData()[1].getKey() === "VALUE2_RANGE") {
					var oRangeSlider = this.byId("siemensUiCellConfigSlider_" + aColumns[k].COLUMN);
					var oValue1 = this.byId("siemensUiSliderValue1_" + aColumns[k].COLUMN);
					if (oEvent.getSource().getValue() === "") {
						oEvent.getSource().setValue("0");
					}
					//check the value entered is valid or not
					var isValid = this._isRangeValueValid(oEvent.getSource().getValue(), oRangeSlider, true, true, false);

					if (!isValid) {
						//if not valid, set the value2 value to range slider maximum value
						oEvent.getSource().setValue(oRangeSlider.getMax());
					}

					oRangeSlider.setValue2(parseFloat(oEvent.getSource().getValue()));
					//get the formatted text of the range
					var sText = this._getRangeSelections(parseFloat(oValue1.getValue()), parseFloat(oEvent.getSource().getValue()), oRangeSlider.getMin(), oRangeSlider.getMax(), oRangeSlider);
					oEvent.getSource().getCustomData()[2].setValue(sText);
					oValue1.getCustomData()[2].setValue(sText);
					break;
				}
			}
		},
		/**
		 * Event handler for change/livechange of minimum range input field that has the minimum value from the range slider
		 * @param {sap.ui.base.Event} oEvent
		 * @private
		 */
		_handleMinRangeChange: function(oEvent) {
			var oCellColorsColumnModel = this.getModel("cellColorsColumnModel");
			var aColumns = oCellColorsColumnModel.oData.results;
			//check for the value entered is null or blank
			if (oEvent.getSource().getValue() === "") {
				return;
			}
			//check for value entered is valid or not.
			var isValid = this._isRangeValueValid(oEvent.getSource().getValue(), "", false, false, false);

			if (!isValid && isValid !== undefined) {
				return;
			}

			for (var k = 0; k < aColumns.length; k++) {
				//check for the minimum and maximum value range for the current column
				if (oEvent.getSource().getCustomData()[0].getValue() === aColumns[k]["COLUMN"] &&
					oEvent.getSource().getCustomData()[1].getKey() === "MIN_RANGE") {
					//get the range slider for the current column
					var oRangeSlider = this.byId("siemensUiCellConfigSlider_" + aColumns[k].COLUMN);
					var oMax = this.byId("siemensUiSliderMaxRange_" + aColumns[k].COLUMN);
					oRangeSlider.setMin(parseFloat(oEvent.getSource().getValue()));
					oRangeSlider.setLabels(this._getRangeSliderLabels(oRangeSlider.getMin(), oRangeSlider.getMax()));
					oEvent.getSource().getCustomData()[2].setValue(oRangeSlider.getMin() + ":" + oRangeSlider.getMax());
					oMax.getCustomData()[2].setValue(oRangeSlider.getMin() + ":" + oRangeSlider.getMax());
					var oValue1 = this.byId("siemensUiSliderValue1_" + aColumns[k].COLUMN);
					var oValue2 = this.byId("siemensUiSliderValue2_" + aColumns[k].COLUMN);
					//check if the minimum range value of the slider is greater than the value1 of the range slider
					if (parseFloat(oValue1.getValue()) < parseFloat(oEvent.getSource().getValue())) {
						oValue1.setValue(oEvent.getSource().getValue());
					}
					//get the formatted text range selection
					var sText = this._getRangeSelections(parseFloat(oValue1.getValue()), parseFloat(oValue2.getValue()), oRangeSlider.getMin(), oRangeSlider.getMax(), oRangeSlider);
					oValue1.getCustomData()[2].setValue(sText);
					oValue2.getCustomData()[2].setValue(sText);
					break;
				}
			}
		},
		/**
		 * Event handler for change/livechange of maximum range input field that has the maximum value from the range slider
		 * @param {sap.ui.base.Event} oEvent
		 * @private
		 */
		_handleMaxRangeChange: function(oEvent) {
			var oCellColorsColumnModel = this.getModel("cellColorsColumnModel");
			var aColumns = oCellColorsColumnModel.oData.results;
			//check for the value entered is null or blank
			if (oEvent.getSource().getValue() === "") {
				return;
			}
			//check for value entered is valid or not.
			var isValid = this._isRangeValueValid(oEvent.getSource().getValue(), "", false, false, false);

			if (!isValid && isValid !== undefined) {
				return;
			}

			for (var k = 0; k < aColumns.length; k++) {
				//check for the minimum and maximum value range for the current column
				if (oEvent.getSource().getCustomData()[0].getValue() === aColumns[k]["COLUMN"] &&
					oEvent.getSource().getCustomData()[1].getKey() === "MAX_RANGE") {
					//get the range slider for the current column
					var oRangeSlider = this.byId("siemensUiCellConfigSlider_" + aColumns[k].COLUMN);
					var oMin = this.byId("siemensUiSliderMinRange_" + aColumns[k].COLUMN);
					oRangeSlider.setMax(parseFloat(oEvent.getSource().getValue()));
					oRangeSlider.setLabels(this._getRangeSliderLabels(oRangeSlider.getMin(), oRangeSlider.getMax()));
					oEvent.getSource().getCustomData()[2].setValue(oRangeSlider.getMin() + ":" + oRangeSlider.getMax());
					oMin.getCustomData()[2].setValue(oRangeSlider.getMin() + ":" + oRangeSlider.getMax());
					var oValue1 = this.byId("siemensUiSliderValue1_" + aColumns[k].COLUMN);
					var oValue2 = this.byId("siemensUiSliderValue2_" + aColumns[k].COLUMN);
					//check if the maximum range value of the slider is greater than the value2 of the range slider
					if (parseFloat(oValue2.getValue()) > parseFloat(oEvent.getSource().getValue())) {
						oValue2.setValue(oEvent.getSource().getValue());
					}
					//get the formatted text range selection
					var sText = this._getRangeSelections(parseFloat(oValue1.getValue()), parseFloat(oValue2.getValue()), oRangeSlider.getMin(), oRangeSlider.getMax(), oRangeSlider);
					oValue1.getCustomData()[2].setValue(sText);
					oValue2.getCustomData()[2].setValue(sText);
					break;
				}
			}
		},
		/**
		 * Method to update the cell config set by the admin privileged user.
		 *
		 * @private
		 */
		_updateConfigTable: function() {
			//var oCellColorsColumnModel = this.getModel("cellColorsColumnModel");
			var aColumns = this.getModel("mainConfig").getData().ServiceColumns;
			var aColumnsMarkedForUpdate = this._getColumnsForConfigUpdate();
			var oMainConfigModel = this.getComponentModel(this.config.paths.mainConfig);
			var sCTRLID = oMainConfigModel.getProperty("/CTRLID");
			var oData = [];
			//get the data for the columns that are enabled for cell config
			for (var index1 = 0; index1 < aColumnsMarkedForUpdate.length; index1++) {
				for (var index2 = 0; index2 < aColumns.results.length; index2++) {
					if (aColumns.results[index2].COLUMN === aColumnsMarkedForUpdate[index1]) {
						oData.push(aColumns.results[index2]);
					}
				}
			}

			var fSuccess = jQuery.proxy(function() {
				//alert("success");
			}, this);
			var fError = jQuery.proxy(function(oResponse) {
				jQuery.sap.log.error(JSON.stringify(oResponse));
			}, this);

			//create a  model for update of cell config to column config table
			var oMainModel = this.getOwnerComponent().getModel("main");
			//update all the columns that are enabled for cell config
			for (var i = 0; i < aColumnsMarkedForUpdate.length; i++) {
				if (oData[i].COLUMN === aColumnsMarkedForUpdate[i]) {
					oMainModel.update("/Column(CTRLID='" + sCTRLID + "', COLUMN='" + aColumnsMarkedForUpdate[i] + "')", oData[i], {
						success: fSuccess(),
						error: fError()
					});
				}
			}
		},
		/**
		 * Helper method to valid the values entered in Value1, value2, minimum and maximum input field in cell config dialog
		 * @param {String} sValue - value from the source input field
		 * @param {object} oSlider - Range slider in cell config dialog
		 * @param {boolean} isValue - flag to check only for value1 and value2 input field (if true)
		 * @param {boolean} isChechkMax - flag to check for maximum value from the slider
		 * @param {boolean} isCheckMin - flag to check minimum minimum value from the slider
		 * @returns {boolean} true/false - if the values are valid or not
		 * @private
		 */
		_isRangeValueValid: function(sValue, oSlider, isValue, isCheckMax, isCheckMin) {
			//check for alphabet is present or not - applicable for both values and range
			if (sValue.match(/^[-+]?[0-9]\d*(\.\d+)?$/) === null) {
				return false;
			}
			//check for value is less than or greater than ranges
			if (isValue) {
				if (isCheckMax) {
					if (parseFloat(sValue) > oSlider.getMax()) {
						return false;
					} else {
						return true;
					}
				}

				if (isCheckMin) {
					if (parseFloat(sValue) < oSlider.getMin()) {
						return false;
					} else {
						return true;
					}
				}

			}

		},

		/**
		 * Event handler for on change/onlive change event of RangeSlider. To set the range values to the Text control
		 * @param {sap.ui.base.Event} oEvent - change/live change event handler of the RangeSlider
		 * @private
		 */
		_setRangeValuestoText: function(oEvent) {
			//var oForm = this._getCellColorConfigForm();
			//var aFormContents = oForm.getContent();
			var oRangeSlider = oEvent.getSource();
			var oValue1 = oRangeSlider.getValue();
			var oValue2 = oRangeSlider.getValue2();
			//var sColumn = oRangeSlider.getCustomData()[1].getValue();
			var oCellColorsColumnModel = this.getModel("cellColorsColumnModel");
			var aColumns = oCellColorsColumnModel.oData.results;
			var iMin = oEvent.getSource().getMin();
			var iMax = oEvent.getSource().getMax();

			for (var k = 0; k < aColumns.length; k++) {
				if (oEvent.getSource().getCustomData()[1].getValue() === aColumns[k].COLUMN) {
					var oValue1Input = this.byId("siemensUiSliderValue1_" + aColumns[k].COLUMN);
					var oValue2Input = this.byId("siemensUiSliderValue2_" + aColumns[k].COLUMN);

					if (oValue1Input && oValue2Input) {
						if (oValue1Input.getCustomData()[0].getValue() === aColumns[k].COLUMN &&
							oValue2Input.getCustomData()[0].getValue() === aColumns[k].COLUMN &&
							oValue1Input.getCustomData()[1].getKey() === "VALUE1_RANGE" &&
							oValue2Input.getCustomData()[1].getKey() === "VALUE2_RANGE") {
							var sText = this._getRangeSelections(parseFloat(oValue1.toFixed(2)), parseFloat(oValue2.toFixed(2)), iMin, iMax, oEvent.getSource());
							oValue1Input.getCustomData()[2].setValue(sText);
							oValue2Input.getCustomData()[2].setValue(sText);
							oValue1Input.setValue(parseFloat(oValue1.toFixed(2)));
							oValue2Input.setValue(parseFloat(oValue2.toFixed(2)));
							oRangeSlider.setValue(parseFloat(oValue1.toFixed(2)));
							oRangeSlider.setValue2(parseFloat(oValue2.toFixed(2)));
							break;
						}
					}
				}
			}

		},
		/**
		 * Method to return the range text after selection of range values(value1 and value2), min and max values.
		 * Method to set the dropdown fields based on the available condition range in slider
		 * @param {Number} iValue1 - value from value1 input field
		 * @param {Number} iValue2 -  value from value2 input field
		 * @param {Number} iMin - value from minimum input field
		 * @param {Number} iMax - value from maximum input field
		 * @param {object} oSource - Range Slider in cell config dialog
		 * @returns {String} sText - formatted text required for processing cell coloring
		 * @private
		 */
		_getRangeSelections: function(iValue1, iValue2, iMin, iMax, oSource) {
			var sText;
			//conditions that are possible based on the slider positions accordingly frame the conditions
			if (iValue1 === iValue2 && iValue1 === parseFloat(iMin) && iValue2 < parseFloat(iMax)) { //ivalue=ivalue2=imin
				sText = iValue1 + ":" + iMax;
			} else if (iValue1 === iValue2 && iValue1 > parseFloat(iMin) && iValue2 === parseFloat(iMax)) { //ivalue=ivalue2=imax
				sText = iMin + ":" + iMax;
			} else if (iValue1 === iValue2 && iValue1 > parseFloat(iMin) && iValue2 < parseFloat(iMax)) { //ivalue=ivalue2
				sText = iMin + ":" + iValue1 + "&" + iValue1 + ":" + iMax;
			} else if (iValue1 > parseFloat(iMin)) {
				//then atleast two ranges or more
				sText = iMin + ":" + iValue1;
				if (iValue2 < parseFloat(iMax)) {
					sText = iMin + ":" + iValue1 + "&" + iValue1 + ":" + iValue2 + "&" + iValue2 + ":" + iMax;
				} else {
					if (iValue2 === parseFloat(iMax)) {
						sText = iMin + ":" + iValue1 + "&" + iValue1 + ":" + iMax;
					}
				}
			} else {
				//then only one or two ranges
				if (iValue1 === parseFloat(iMin)) {
					sText = iMin + ":" + iValue2;

					if (iValue2 < parseFloat(iMax)) {
						sText = iMin + ":" + iValue2 + "&" + iValue2 + ":" + iMax;
					} else {
						if (iValue2 === parseFloat(iMax)) {
							sText = iMin + ":" + iMax;
						}
					}

				}
			}

			var aConditions = [];
			if (sText.match(/([&*])/g) !== null) {
				//multiple conditions
				aConditions = sText.split("&");
			} else {
				//single condition
				aConditions.push(sText);
			}
			var iNoRanges = aConditions.length;

			var oForm = this._getCellColorConfigForm();

			//prepare payload
			var aFormContents = oForm.getContent();

			for (var j = 0; j < aFormContents.length; j++) {
				var sClassName = aFormContents[j].getMetadata()._sClassName;
				//get the control from simple form with horizontal layout class name and with custom data as CFORMAT_COLOR
				if (sClassName === "sap.ui.layout.HorizontalLayout" && aFormContents[j].getCustomData()[0].getKey() === "CFORMAT_COLOR") {
					//check if column namefrom the slider and the column name from the horizontal layout is same.
					//Set the dropdown values for relevant columns only as per the ranges.
					if (oSource.getCustomData()[1].getValue() === aFormContents[j].getCustomData()[1].getValue()) {
						//check for delta
						var iSelects = 0;
						var aContents = oForm.getContent()[j].getContent();
						for (var m = 0; m < aContents.length; m++) {
							if (aContents[m].getVisible()) {
								iSelects++;
							}
						}
						//check if the number of conditions and no. of dropwdowns are same
						if (iSelects !== iNoRanges) {
							var iDelta = 0;
							//if no. of conditions are more than the no. of dropdowns then make the available dropdowns visible to true
							if (iNoRanges > iSelects) {
								//iDelta = number of selects to be made visible
								var iCount = 0;
								iDelta = iNoRanges - iSelects;
								for (var n = 0; n < aContents.length; n++) {
									//var iCount = 0;
									if (!aContents[n].getVisible()) {
										aContents[n].setVisible(true);
										iCount++;
										if (iCount === iDelta) {
											break;
										}
									}
								}
								//check if the dropdowns are to be added
								if (iCount === 0) {
									for (var id = 0; id < iDelta; id++) {
										//	Prepare the dropdowns to be added to the horizontal layout for colors
										var oSelect = new sap.m.Select({
											width: "100px"
										});
										var sColors = oForm.getContent()[j].getCustomData()[2].getValue();
										var aColors = [];
										if (sColors.match(/([,*])/g) !== null) {
											//multiple conditions
											aColors = sColors.split(",");
										} else {
											//single condition
											aColors.push(sColors);
										}
										for (var ic = 0; ic < aColors.length; ic++) {
											oSelect.addItem(new sap.ui.core.Item({
												key: aColors[ic],
												text: {
													parts: [{
														path: aColors[ic]
													}],
													formatter: jQuery.proxy(this._setSelectItemBackground)
												}
											}));
										}

										oSelect.addCustomData(
												new sap.ui.core.CustomData({
													key: "CFORMAT_COLOR",
													value: oForm.getContent()[j].getCustomData()[0].getValue()
												}))
											.addCustomData(
												new sap.ui.core.CustomData({
													key: "COLUMN",
													value: oForm.getContent()[j].getCustomData()[1].getValue()
												}));
										//add the dropdowns to the horizontal layout.
										oForm.getContent()[j].addContent(oSelect);
									}
								}
							} else {
								//if the no. of dropdowns are more than the no. of conditions then make the available dropdowns visible to false.
								//iDelta = number of selects to be made invisible
								iDelta = iSelects - iNoRanges;
								var iCount = 0;
								for (var n = 0; n < aContents.length; n++) {
									//var iCount = 0;
									if (aContents[n].getVisible()) {
										aContents[n].setVisible(false);
										iCount++;
										if (iCount === iDelta) {
											break;
										}
									}
								}
							}

						}

						break;
					}
				}
			}
			//return the formatted text
			return sText;
		},

		_createInitialFilters: function(bInitial) {
			// set variant model
			var oModel = new ODataModel([this.getOwnerComponent().getMetadata().getConfig().serviceUrl, this.config.paths.variantService].join(""), true);

			oModel.setDefaultCountMode(CountMode.Inline);
			this.getView().setModel(oModel, this.config.paths.variantData);

			var oValuesForFilter,
				oEventBus = this.getEventBus(),
				oMainConfig = this.getComponentModel("mainConfig"),
				mainFilter = [],
				aFilters = [
					new Filter("VariantId", FilterOperator.EQ, bInitial ? "InitialReport" : "DependentReport"),
					new Filter("CTRLID", FilterOperator.EQ, oMainConfig.getProperty("/CTRLID"))
				];

			oModel.read("/VariantsGet", {
				filters: [new Filter(aFilters, true)],
				success: jQuery.proxy(function(oData) {
					var oReceivedFilterObject = JSON.parse(decodeURI(oData.results[0].filterObject));
					oValuesForFilter = oReceivedFilterObject.oFilters;


					if (oMainConfig.getProperty("/INPUT_PARAMETERS")) {
						oMainConfig.setProperty("/ENTITY_NAME", oReceivedFilterObject.IP);
					}

					oEventBus.publish("TableViewer", "FillFilterBar", {
						initial: bInitial,
						values: oValuesForFilter
					});

					var aFilters,
						fPushFilterValues = function(sValue) {
							aFilters.push(new Filter(oValue, FilterOperator.EQ, sValue));
						};

					if (oValuesForFilter instanceof Array) {
						oEventBus.publish("TableViewer", "GetFilterData");
						mainFilter = this._filterObject;
					} else {
						for (var oValue in oValuesForFilter) {
							aFilters = [];

							oValuesForFilter[oValue].map(fPushFilterValues);
							mainFilter.push(new Filter(aFilters, false));
						}

						mainFilter = mainFilter.length > 0 ? new Filter(mainFilter, true) : mainFilter;
					}
				}, this),
				async: false,
				error: function(oError) {
					jQuery.sap.log.error(oError);
				}
			});

			return mainFilter;
		},

		/**
		 * Table personalization dialog action
		 * @public
		 */
		onTablePersonalization: function() {
			this._oTPC.openDialog();
			//changes for undo personalization
			var oUndoButton = this._oTPC._oDialog._oDialog.getContent()[0].getContent()[1]; //get undo button
			//implement undo press event
			oUndoButton.attachPress(jQuery.proxy(function() {
			 this._resetTablePersonalization();
			}, this));
			
			this._oTpcEvent = "X";
			if (this._oTPC._oDialog.mEventRegistry.confirm.length < 2) {
				this._oTPC._oDialog.attachEventOnce("confirm", function() {
					this._requestNewData();
				}.bind(this));
			}
		},
		
		/**
		 * Method to reset the column selection in the table personalization to previous state
		 * @private
		 */
		_resetTablePersonalization : function () {
			this._oTPC._oInitialPersoData = this._oTPC._getCurrentTablePersoData(true);
			if (this._oTPC._oInitialPersoData) {
					var i = jQuery.extend(true, [], this._oTPC._oInitialPersoData);
					var l = this._oTPC._oDialog._oList.getSelectedItem();
					this._oTPC._oDialog._sLastSelectedItemId = l && l.getBindingContext('Personalization') && l.getBindingContext('Personalization').getProperty('id');
					if (!!this._oTPC._oDialog._mColumnCaptions) {
						i.forEach(function(c) {
							c.text = this._oTPC._oDialog._mColumnCaptions[c.id];
						});
					}
					this._oTPC._oDialog._oP13nModel.getData().aColumns = i.aColumns;
					this._oTPC._oDialog._oP13nModel.getData().aHeader.visible = !this._oTPC._oInitialPersoData.aColumns.some(function(c) {
						return !c.visible;
					});
					//this._oTPC._oDialog._oP13nModel.refresh();
					this._oTPC._oDialog._oP13nModel.updateBindings();
					this._oTPC._oDialog.setModel(this._oTPC._oDialog._oP13nModel, 'Personalization');
					this._oTPC._oDialog._oColumnItemTemplate = new sap.m.InputListItem({
						label: '{Personalization>text}',
						content: new sap.m.CheckBox({
							selected: '{Personalization>visible}'
						})
					}).addStyleClass('sapMPersoDialogLI');
						this._oTPC._oDialog._oList.bindAggregation('items', {
						path: 'Personalization>/aColumns',
						template: this._oTPC._oDialog._oColumnItemTemplate
					});
				}
		},

		/**
		 * Initialize table personalization
		 * @private
		 */
		_initializeTablePerso: function() {
			this._oTpcEvent = "";
			this._oTPC = new TablePersoController({
				table: this.getView().byId(this.config.elements.table),
				componentName: "com.siemens.tableViewer"
			});
		},

		/**
		 * Requests new data based on changed columns from database
		 * @private
		 */
		_requestNewData: function() {
			var oTable = this.getView().byId(this.config.elements.table),
				aColumns = oTable.getAggregation("columns"),
				sVisibleColumns = this._readVisibleColumns(aColumns),
				bDependant = this.getOwnerComponent()._getUriParams("dependent"), 
				aReportFilters;

			//this.attachRequestsForControlBusyIndicator(this.getComponentModel(), oTable);
			//in case of dependent/report-to-report functionality on table personalization send the initial filters again to table.
			if (bDependant === "true") {
				aReportFilters = oTable.getBinding("rows").aFilters.length > 0 ? oTable.getBinding("rows").aFilters : oTable.getBinding("rows").aApplicationFilters;
				//aReportFilters = this.getModel("view").getProperty("/aMainFilters");
			}
			this._bindRows(oTable, sVisibleColumns, aReportFilters);

		},


		/**
		 * Retrieve the visibility of columns from table
		 * @private
		 * @param {array} aColumns - all columns that currently are in table
		 * @returns {string} string of visible column concatenation
		 */
		_readVisibleColumns: function(aColumns) {
			var sVisibleColumns = "";

			for (var iColumn = 0; iColumn < aColumns.length; iColumn++) {
				if (aColumns[iColumn].getProperty("visible")) {
					sVisibleColumns += sVisibleColumns === "" ? aColumns[iColumn].getSortProperty() : "," + aColumns[iColumn].getSortProperty();
				}
			}

			return sVisibleColumns;
		},

		/**
		 * Sets a specific model to the whole table view
		 * @private
		 * @param {object} oViewModel - Table view specific model
		 */
		_setTableViewModel: function(oViewModel) {
			this.setModel(oViewModel, this.config.models.tableView);
		},

		/**
		 * Set Table model
		 * @private
		 * @param {object} oTable - Table instance from the view
		 * @param {object} oModel - Data model from the service
		 */
		_setTableDataModel: function(oTable, oModel) {

			this.attachRequestsForControlBusyIndicator(oModel, oTable);
			oTable.setModel(oModel);

		},

		/**
		 * Returns currently all visible columns in table
		 * @private
		 * @param {object} oColumnModel - Model with all available columns
		 * @returns {string} currently visible columns in table
		 */
		_retrieveVisibleColumns: function(oColumnModel) {
			var aColumns = oColumnModel.getProperty(this.config.paths.columns),
				sVisibleColumns = null,
				aAggregateColumns = [];

			$.grep(aColumns, function(oItem, iItemIndex) {
				if (oItem.STDRD === 1) {
					if (sVisibleColumns === null) {
						sVisibleColumns = oItem.COLUMN;
					} else {
						sVisibleColumns = sVisibleColumns + "," + oItem.COLUMN;
					}
					if (!!oItem.AGGREGATE) {
						aAggregateColumns.push({
							column: oItem.COLUMN,
							index: iItemIndex,
							label: oItem.LABEL
						});
					}
					return sVisibleColumns;
				}
			});


			return {
				visibleColumns: sVisibleColumns,
				aggregatedColumns: aAggregateColumns
			};
		},

		/**
		 * Bind table aggregations - rows and columns
		 * @private
		 * @param {object} oTable - Table view object
		 * @param {string} sVisibleColumns - Visible columns for which data should be retrieved
		 */
		_bindTable: function(oTable, sVisibleColumns, aInitFilters) {
			oTable.bindAggregation("columns", this.config.paths.mainConfigColumns, this._rowsFactory.bind(this));
			var oEventBus , aColumns , bVselEvent ;
			if (this._oTpcEvent === "") {
				this._oTpcEvent = "";
				oEventBus = this.getEventBus();
				oEventBus.publish("TableViewer", "SetVisibleColumn");
			} else {
				this._oTpcEvent = "";
			}

			var oVariantModel = this.getModel("variantData");
            if (!(oVariantModel && oVariantModel.aPendingRequestHandles.length > 0 && !oVariantModel.bDefault)) {
            	  bVselEvent = this.getGlobalVariableModel().getProperty("/vSelEvent");            
            } 
        	if (bVselEvent === "X") {
				this.getGlobalVariableModel().setProperty("/vSelEvent","");
				oEventBus = this.getEventBus();
				oEventBus.publish("TableViewer", "SetVisibleFilter");
	    		aColumns = oTable.getAggregation("columns");
				sVisibleColumns = this._readVisibleColumns(aColumns);
			}
            
			this._bindRows(oTable, sVisibleColumns, aInitFilters);
		},
		
		/**
		 * Bind table rows aggregation
		 * @private
		 * @param {object} oTable - Table view object
		 * @param {string} sVisibleColumns - Visible columns for which data should be retrieved
		 */
		_bindRows: function(oTable, sVisibleColumns, aInitFilters) {
			var aSorter = [],
				aFilters = [];

			if (oTable.getBinding("rows")) {
				//aSorter = oTable.getBinding("rows").aSorters ? oTable.getBinding("rows").aSorters : aSorter;
				aSorter = oTable.getBinding("rows").aSorters ? this._getSortersForVisibleColumns(oTable, sVisibleColumns) : aSorter;
				//aFilters = oTable.getBinding("rows").aApplicationFilters ? aInitFilters : aFilters;
				aFilters = oTable.getBinding("rows").aApplicationFilters &&  oTable.getBinding("rows").aApplicationFilters[0] !== null ? aInitFilters : aFilters;
			} else {
				aFilters = aInitFilters ? [aInitFilters] : [];
				for (var iColumn = 0; iColumn < this.getComponentModel("mainConfig").getData().ServiceColumns.results.length; iColumn++) {
					if (this.getComponentModel("mainConfig").getData().ServiceColumns.results[iColumn].COLUMN_SORTING === 2 || this.getComponentModel("mainConfig").getData().ServiceColumns.results[iColumn].COLUMN_SORTING === 1) {
						aSorter.push(
							new sap.ui.model.Sorter(
								this.getComponentModel("mainConfig").getData().ServiceColumns.results[iColumn].COLUMN,
								this.getComponentModel("mainConfig").getData().ServiceColumns.results[iColumn].COLUMN_SORTING === 2 ? true : false,
								false)
						);
					}
				}
			}
			// For InputParameters Functionality & Master-Detail
			oTable.clearSelection();
			//oTable.setBusy(true);
			oTable.bindRows({
				path: this.getEntityName(),
				parameters: {
					select: sVisibleColumns
				},
				filters: aFilters,
				sorter: aSorter,

				events: {
					dataRequested: jQuery.proxy(function() {
						this.getBusyDialog().open();
					}, this),
					change: function() {
						oTable.getModel("tableView").setProperty("/rowCount", this.iLength);
						oTable.setShowNoData(this.iLength <= 0);

					},
					//dataReceived event handler to handle filters to be applied when the TV is loaded with charts tab with default variant
					//when the tab selects to table, the variants filters doesnt gets applied since the table dom ref is not available
					//when the table receive the data, we are checking with the MainFilters have filters but the binding of table does not have filters, then apply the filter
					dataReceived: jQuery.proxy(function(oEvent) {
						var oData = {
							ID: this.config.elements.table,
							mainFilters: this.getModel("view").getProperty("/aMainFilters"),
							mainSorters: this.getModel("view").getProperty("/aMainSorters"),
							hash: "Table"
						};
						//setup filter only when the aMainFilters has filter but not table.
						if (oData.mainFilters && oData.mainFilters !== undefined && oEvent.getSource().aApplicationFilters.length === 0) {
							this._setupFilters("", "SetupFilters", oData);
						}
						oTable.rerender();
						//oTable.setBusy(true); //do not set table as busy here. When data is received in the table it should be false.
						this.getBusyDialog().close();
					}, this)
				}
			});

			this._bindAggregatedColumns(sVisibleColumns, aFilters, oTable, this.getComponentModel(), this.getEntityName(), this._aAggregatedColumns);

		},

		/**
		 * To return the final sort to be applied to the table after checking the sort exist only for columns that are visible in the table
		 * also to reset the sorting property of the column, so that the column can be added again.
		 * @param {Object} oTable - instance of the table
		 * @param {String} sVisibleColumns - visible columns in table
		 * @private
		 */
		_getSortersForVisibleColumns: function(oTable, sVisibleColumns) {
			var aSorter = [],
				aTempSortPaths = [],
				aVisibleColumns = [];
			aVisibleColumns = sVisibleColumns.split(",");
			//this._oMultiSortDialog = sap.ui.xmlfragment("com.siemens.tableViewer/view/tabs/fragments/MultiSortDialog", this);

			if (oTable.getBinding("rows")) {
				aSorter = oTable.getBinding("rows").aSorters ? oTable.getBinding("rows").aSorters : aSorter;
				//get all sort paths
				$.each(aSorter, function(j, s) {
					aTempSortPaths.push(s.sPath);
				});

				//compare two arrays to get the columns that are not visible and has sort
				var aMarkedforDeleteSorts = $(aTempSortPaths).not(aVisibleColumns).get();
				//remove the sort of the hidden column
				for (var i = 0; i < aMarkedforDeleteSorts.length; i++) {
					for (var j = 0; j < aSorter.length; j++) {
						if (aMarkedforDeleteSorts[i] === aSorter[j].sPath) {
							aSorter.splice(j, 1);
						}
					}
				}
				//reset the sort for the columns that were hidden
				for (var m = 0; m < aMarkedforDeleteSorts.length; m++) {
					for (var iColumn = 0; iColumn < oTable.getAggregation("columns").length; iColumn++) {
						if (oTable.getAggregation("columns")[iColumn].getSortProperty() === aMarkedforDeleteSorts[m]) {
							oTable.getAggregation("columns")[iColumn].setSorted(false);
							oTable.getAggregation("columns")[iColumn].setSortOrder(undefined);
						}
					}
				}

			}

			return aSorter;
		},

		/**
		 * Generates a column for a table with all settings
		 * @private
		 * @param {string} sId - ID for the column
		 * @param {object} oContext - Column information from model
		 * @returns {object} Newly generated column
		 */
		_rowsFactory: function(sId, oContext) {
			var oUIControl,
				sColumnLabel = oContext.getProperty("LABEL"),
				bColumnVisibility = oContext.getProperty("STDRD") === 1,
				sColumnId = oContext.getProperty("COLUMN"),
				sAlign = formatter.alignColumn(oContext.getProperty("IS_KFG")),
				sColumnWidth = oContext.getProperty("CWIDTH"),
				sColumnDesc = oContext.getProperty("DESCRIPTION"),
				sColumnHeaderDesign = formatter.columnLabelDesign(oContext.getProperty("IS_KFG")),
				sTextAlign = formatter.rowAlign(oContext.getProperty("IS_KFG")),
				bIsLink = oContext.getProperty("IS_LINK") === 1,
				bIsCellFormat = oContext.getProperty("CFORMAT") === 1,
				sConditions = oContext.getProperty("CFORMAT_CONDITION") ? oContext.getProperty("CFORMAT_CONDITION") : "",
				sColors = oContext.getProperty("CFORMAT_COLOR") ? oContext.getProperty("CFORMAT_COLOR") : "",
				aConditions = this._getCellConditions(sConditions),
				oTemplate = this._getRowTemplate(oContext.getProperty("CTYPE"), sColumnId, sTextAlign, bIsLink, bIsCellFormat, aConditions, sColors),
				sColorCode = oContext.getProperty("COLOR_CODE"),
				iColumnSorting = oContext.getProperty("COLUMN_SORTING"),
				sBoldTextClass = sColumnHeaderDesign === "Bold" ? "siemensTextBold" : "";

			var oLabel = new Text({
				text: sColumnLabel,
				textAlign: sTextAlign
			}).addStyleClass(sBoldTextClass);
			if (iColumnSorting === 1) {
				var sSortOrder = SortOrder.Ascending;
			} else if (iColumnSorting === 2) {
				sSortOrder = SortOrder.Descending;
			} else {
				sSortOrder = undefined;
			}
			//(iColumnSorting === 1) ? SortOrder.Ascending : iColumnSorting === 2 ? SortOrder.Descending : undefined,
			oUIControl = new Column(sId, {
				visible: bColumnVisibility,
				label: oLabel,
				template: oTemplate,
				sortProperty: sColumnId,
				sorted: (iColumnSorting === 1 || iColumnSorting === 2) ? true : false,
				sortOrder: sSortOrder, //(iColumnSorting === 1) ? SortOrder.Ascending : iColumnSorting === 2 ? SortOrder.Descending : undefined,
				autoResizable: true,
				hAlign: sAlign,
				width: sColumnWidth,
				tooltip: sColumnDesc,
				coloredStyleClass: sColorCode,
				isCellFormat: bIsCellFormat
			}).data("COLUMN", sColumnId);

			return oUIControl;
		},

		/**
		 * function to return the conditions after split
		 * @param {string} sConditions - value ranges/conditions for cell formatting with & delimiter
		 * @returns {object} aConditions - array of conditions after split by &
		 * @private
		 */
		_getCellConditions: function(sConditions) {
			var aConditions = [];
			if (sConditions.match(/([&*])/g) !== null) {
				//multiple conditions
				aConditions = sConditions.split("&");
			} else {
				//single condition
				aConditions.push(sConditions);
			}
			return aConditions;
		},

		/**
		 * Format column content data
		 * @private
		 * @param {string} sColumnType - Column type, based on which formatter will be applied
		 * @param {string} sPath - Path to the row in model
		 * @param {string} sTextAlign - Alignment for the text
		 * @param {boolean} bIsLink - Boolean value that indicates if column will have links
		 * @param {boolean} bIsCellFormat - Boolean value to indicate if the column require cell formatting
		 * @param {object} aConditions - Array conditions after split by &
		 * @param {string} sColors - String of colors that are mapped to the conditions
		 * @returns {object} Column template with information how column should be formatted
		 */
		_getRowTemplate: function(sColumnType, sPath, sTextAlign, bIsLink, bIsCellFormat, aConditions, sColors) {
			var oTemplate = null;

			oTemplate = this._retreiveRowTemplate(sPath, formatter.getDataTypeInstance(sColumnType), bIsLink, bIsCellFormat, aConditions, sColors);

			oTemplate.setTextAlign(sTextAlign);

			return oTemplate;
		},

		/**
		 * Return formatted text for rows
		 * @private
		 * @param {string} sPath - Path to the row in model
		 * @param {object} oType - column type
		 * @param {boolean} bIsLink - Boolean value that indicates if column will have links
		 * @param {boolean} bIsCellFormat - Boolean value to indicate if the column require cell formatting
		 * @param {object} aConditions - Array conditions after split by &
		 * @param {string} sColors - String of colors that are mapped to the conditions
		 */
		_retreiveRowTemplate: function(sPath, oType, bIsLink, bIsCellFormat, aConditions, sColors) {
			//split by , to get all the colors and map it to respective conditions
			var aCustomDatas = this._getCellFormatter(aConditions, sColors);

			if (bIsLink) {
				if (bIsCellFormat) {
					var oLink = new Link({
						text: {
							path: sPath,
							type: oType,
							formatter: jQuery.proxy(this._setBackgroundCellColor)
						},
						press: jQuery.proxy(this.onLinkPressTableCell, this)
					});

					for (var j = 0; j < aCustomDatas.length; j++) {
						oLink.addCustomData(aCustomDatas[j]);
					}
					return oLink;
				} else {
					return new Link({
						text: {
							path: sPath,
							type: oType
						},
						press: jQuery.proxy(this.onLinkPressTableCell, this)
					});
				}
			} else {
				if (bIsCellFormat) {
					var oText = new Text({
						text: {
							path: sPath,
							type: oType,
							formatter: jQuery.proxy(this._setBackgroundCellColor)
						}
					});

					for (var k = 0; k < aCustomDatas.length; k++) {
						oText.addCustomData(aCustomDatas[k]);
					}
					return oText;
				} else {
					return new Text({
						text: {
							path: sPath,
							type: oType
						}
					});
				}
			}
		},

		/**
		 * Returns custom data mapped with Conditions and colors required for cell
		 * @param {object} aConditions - Array of conditions
		 * @param {string} sColors - string of colors
		 * @returns {object} aControls - array of custom data with colors and conditions mapped
		 */
		_getCellFormatter: function(aConditions, sColors) {
			var aColors = [],
				aControls = [];
			//split colors string by comma
			if (sColors.match(/([,*])/g) !== null) {
				aColors = sColors.split(",");
			} else {
				aColors.push(sColors);
			}
			//if no. of conditions not equal to no. of colors fill empty slots of the array for colors with empty string
			if (aColors !== null && aColors !== undefined && aColors.length !== aConditions.length) {
				var iDelta = 0;
				if (aConditions.length > aColors.length) {
					iDelta = aConditions.length - aColors.length;
				} else {
					iDelta = aColors.length - aConditions.length;
				}

				for (var j = 0; j < iDelta; j++) {
					aColors.push("");
				}
			}
			//prepare custom data with colors as key and conditions as value
			for (var i = 0; i < aConditions.length; i++) {
				aControls.push(new sap.ui.core.CustomData({
					key: aColors[i],
					value: aConditions[i]
				}));
			}

			return aControls;
		},

		/**
		 * Formatter function to read the cell value and set the cell color based on the conditions read from custom data
		 * @param {string} sValue - cell value
		 * @private
		 */
		_setBackgroundCellColor: function(oValue) {
			if (oValue !== null && oValue !== undefined && oValue !== "") {
				var aData = this.getCustomData(),
					iStart, iLast, iParseStart, iParseLast, iParseValue;
				var sValue = this.getBinding("text").oValue;
				for (var i = 0; i < aData.length; i++) {
					if (typeof aData[i].getValue() === "string") {
						if ((aData[i].getValue()).match(/([:*])/g) !== null) {
							//value with range
							//check for type
							iStart = (aData[i].getValue()).split(":")[0];
							iLast = (aData[i].getValue()).split(":")[1];

							//check if sValue is numeric or not
							if (typeof sValue === "string") {
								if (!isNaN(Number(sValue.split(",").join("")))) {
									sValue = sValue.split(",").join("");
								}
							} else {
								sValue = sValue.toString();
								if (!isNaN(Number(sValue.split(",").join("")))) {
									sValue = sValue.split(",").join("");
								}
							}

							if (Number(iStart) % 1 === 0) {
								iParseStart = parseFloat(iStart);
								iParseValue = parseFloat(sValue);
							} else {
								if (Number(iStart) % 1 !== 0) {
									iParseStart = parseFloat(iStart);
									iParseValue = parseFloat(sValue);
								}
							}

							if (Number(iLast) % 1 === 0) {
								iParseLast = parseFloat(iLast);
								iParseValue = parseFloat(sValue);
							} else {
								if (Number(iLast) % 1 !== 0) {
									iParseLast = parseFloat(iLast);
									iParseValue = parseFloat(sValue);
								}
							}
							if (!isNaN(iParseStart && iParseLast)) {
								//check if iParseStart and iParseLast is greater or lesser
								if (iParseStart > iParseLast) {
									var iTemp = iParseStart;
									iParseStart = iParseLast;
									iParseLast = iTemp;
								}

								if (iParseValue >= iParseStart && iParseValue <= iParseLast) {
									$("#" + this.getId()).parent().parent().css("background-color", aData[i].getKey());
									break;
								} else {
									$("#" + this.getId()).parent().parent().css("background-color", ""); //none
								}
							} else if (isNaN(parseFloat(iStart) && parseFloat(iLast))) {
								//for string
								if (sValue >= iStart && sValue <= iLast) {
									$("#" + this.getId()).parent().parent().css("background-color", aData[i].getKey());
									break;
								} else {
									$("#" + this.getId()).parent().parent().css("background-color", ""); //none
								}
							} else {
								$("#" + this.getId()).parent().parent().css("background-color", "");
								break;
							}

						} else {
							//single value
							var iLast = aData[i].getValue(),
								iParseLast, iParseValue;

							if (!isNaN(Number(sValue.split(",").join("")))) {
								sValue = sValue.split(",").join("");
							}

							if (Number(iLast) % 1 === 0) {
								iParseLast = parseFloat(iLast);
								iParseValue = parseFloat(sValue);
							} else {
								if (Number(iLast) % 1 !== 0) {
									iParseLast = parseFloat(iLast);
									iParseValue = parseFloat(sValue);
								}
							}

							if (!isNaN(iParseLast)) {
								//for numeric
								if (iParseValue === iParseLast) {
									$("#" + this.getId()).parent().parent().css("background-color", aData[i].getKey());
									break;
								} else {
									$("#" + this.getId()).parent().parent().css("background-color", ""); //none
								}
							}

							if (isNaN(parseFloat(iLast))) {
								//for string
								if (sValue === iLast) {
									$("#" + this.getId()).parent().parent().css("background-color", aData[i].getKey());
									break;
								} else {
									$("#" + this.getId()).parent().parent().css("background-color", ""); //none
								}
							}
						}
					}
				}
			} else {
				$("#" + this.getId()).parent().parent().css("background-color", ""); //none
			}

			return oValue;
		},

		/**
		 * Link press event handler
		 * @param {sap.ui.base.Event} oEvent - Link press event
		 * @public
		 */
		onLinkPressTableCell: function(oEvent) {
			//associate controller with the fragment
			this._oTableCellPopup = sap.ui.xmlfragment(this._getTablePopupFragDiagId(), "com.siemens.tableViewer/view/tabs/fragments/tableCellPopup", this);
			this.getView().addDependent(this._oTableCellPopup);

			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oTableCellPopup);

			//declare variables
			var sDataSource,
				oTable = oEvent.getSource().getParent().getParent(), //source table
				aColumns = oTable.getAggregation("columns"),
				sVisibleColumns = this._readVisibleColumns(aColumns),
				oActiveKeyTargetCols,
				oTablePopup = this._getTablePopupFrag(),
				oContext = oEvent.getSource().getBindingContext(),
				sPath = oContext.getPath().substr(1),
				oRowData = oContext.oModel.oData["" + sPath + ""],
				aFilters = [],
				aTableFilters = [],
				sCalculationId,
				sMainOData,
				sServiceUrl,
				bIsODataServer,
				oModel_SRV,
				oDrillConfigModel,
				oDrillVisibleCols,
				aCustomData = oEvent.getSource().getCustomData(),
				iColumnIndex, sSourceColumnName;

			//get column index and get column name
			for (var d = 0; d < aCustomData.length; d++) {
				if (aCustomData[d].getKey() === "sap-ui-colindex") {
					iColumnIndex = parseFloat(aCustomData[d].getValue());
					break;
				}
			}
			//get column by using sort property of the column
			sSourceColumnName = oTable.getColumns()[iColumnIndex].getSortProperty();

			oActiveKeyTargetCols = this._getActiveTargetColumn(sVisibleColumns, sSourceColumnName);
			//get row data from the selected row for the link key fields and return the filter
			aFilters = this._getLinkKeysDetailsFilter(oRowData, oActiveKeyTargetCols);
			//get filters applied from the table
			aTableFilters = oTable.getBinding("rows").aApplicationFilters[0];
			if (aTableFilters !== undefined && aTableFilters !== null) {
				aFilters.push(aTableFilters);
			}
			//set the target data source
			sDataSource = oActiveKeyTargetCols.dataSrc;
			sCalculationId = sDataSource;
			//set dialog title and table header
			this._getPopupDialog().setTitle(oActiveKeyTargetCols.headerTitle);
			this._getTablePopupTitle().setText(oActiveKeyTargetCols.subheaderTitle);

			//prepare service url for oData requests for config
			sMainOData = [this.getOwnerComponent().getMetadata().getConfig().serviceUrl, "main.xsodata"].join("");
			this.setModel(this._readServiceColumns(sMainOData, sCalculationId), "drillConfig");
			//prepare service url for oData requests for data
			sServiceUrl = [this.getOwnerComponent().getMetadata().getConfig().serviceUrl,
				this.getModel("drillConfig").getProperty("/SERVICE_NAME")
			].join("");
			//check to see if ODATA_SRV is 1
			bIsODataServer = this.getModel("drillConfig").getProperty("/ODATA_SRV") === 1 ? true : false;

			if (bIsODataServer) {
				// create and set the ODataModel
				oModel_SRV = models.createODataModel({
					urlParametersForEveryRequest: [
						"sap-server",
						"sap-client",
						"sap-language"
					],
					url: sServiceUrl,
					config: {
						metadataUrlParams: {
							"sap-documentation": "heading"
						}
					}
				});
				oModel_SRV.setDefaultCountMode(CountMode.Inline);
				oModel_SRV.setUseBatch(false);
				//set and enable busy indicator to popup table
				oModel_SRV.attachEventOnce("requestSent", function() {
					oTablePopup.setEnableBusyIndicator(true);
					oTablePopup.setBusy(true);
				});

				oModel_SRV.attachEventOnce("requestCompleted", function() {
					oTablePopup.setBusy(false);
				});
				this.setModel(oModel_SRV, "drillSRV");
				this.getOwnerComponent()._createMetadataPromise(oModel_SRV);
				//retrieve visible columns from config model of target source
				oDrillConfigModel = this.getModel("drillConfig");
				oDrillVisibleCols = this._retrieveVisibleColumns(oDrillConfigModel);
				//read the data for drill data with filters and $select for columns that are Visible
				this.setModel(this._readODataSrv(oDrillVisibleCols.visibleColumns, aFilters, false), "drillData");
			}

			//open the fragment dialog
			this._oTableCellPopup.open();
		},

		/**
		 * Function to read the config details of the Calculation view
		 * @private
		 * @param {string} sUrl - service url for config
		 * @param {string} sCalcId - target source
		 * @returns {object} oConfigModel - Drilldown config model for columns aggregation
		 */
		_readServiceColumns: function(sUrl, sCalcId) {
			var oModel = new ODataModel(sUrl, true),
				oConfigModel = new JSONModel(),
				sErrorText = this.getResourceBundle().getText("configerror", ["\"" + sCalcId + "\""]);
			// async call is required here
			oModel.read("/Service('" + sCalcId + "')", {
				urlParameters: "$expand=ServiceColumns",
				success: function(oData, oResponse) {
					if (oData) {
						oData.ServiceColumns.results.sort(function(oObject1, oObject2) {
							return oObject1.SORTORDER - oObject2.SORTORDER;
						});
						oConfigModel.setData(oData);
					} else {
						jQuery.sap.log.fatal(sErrorText);
						MessageBox.alert(sErrorText);
					}
				},
				error: function(oError) {
					jQuery.sap.log.fatal(sErrorText);
					MessageBox.alert(sErrorText);
				},
				async: false
			});

			return oConfigModel;
		},

		/**
		 * Function to read the drill down data
		 * @private
		 * @param {string} sSelect - visible columns to be set for select parameters
		 * @param {object} aFilters - Filter array with table filter and link key field filters
		 * @param {Boolean} bOrder - orderby flag
		 * @returns {object} oDrillDataModel - Drilldown data model for the table row aggregation
		 */
		_readODataSrv: function(sSelect, aFilters, bOrder) {
			var oModel = this.getModel("drillSRV"),
				oDrillDataModel = oModel,
				sPath = "/" + this.getModel("drillConfig").getProperty("/ENTITY_NAME"),
				//sErrorText = "Error while reading from "+sPath,
				oUriParams = {
					"$select": sSelect
				};
			oDrillDataModel.filters = aFilters;
			if (bOrder) {
				oUriParams["$orderby"] = sSelect;
			}
			oModel.read(sPath, {
				urlParameters: oUriParams,
				success: jQuery.proxy(this._handleSuccessDrillDownData, this),
				error: jQuery.proxy(this._handleErrorDrillDownData, this),
				async: false,
				filters: aFilters
			});

			return oDrillDataModel;
		},
		_readODataSrvDet: function(sSelect, aFilters, bOrder) {
			var oDetailDataModel = new JSONModel(),
				oModel = this.getModel("detSRV"),
				sPath = "/" + this.getModel("detConfig").getProperty("/ENTITY_NAME"),
				//sErrorText = "Error while reading from "+sPath,
				oUriParams = {
					"$select": sSelect
				};

			if (bOrder) {
				oUriParams["$orderby"] = sSelect;
			}
			oModel.read(sPath, {
				urlParameters: oUriParams,
				success: jQuery.proxy(this._handleSuccessDetData, this),
				error: jQuery.proxy(this._handleErrorDrillDownData, this),
				async: false,
				filters: aFilters
			});

			return oDetailDataModel;
		},

		/**
		 * Success handler for read of drill down data. Sets the drill down data on success
		 * @private
		 * @param {object} oData - oData for success
		 * @param {object} oResponse - response after the success
		 */
		_handleSuccessDrillDownData: function(oData, oResponse) {
			var oDrillConfigModel = this.getModel("drillConfig"),
				oColumns = this._retrieveVisibleColumns(oDrillConfigModel),
				aAggregatedColumns = oColumns.aggregatedColumns,
				aColumns = this._getTablePopupFrag().getAggregation("columns"),
				iTempSum = parseFloat(0);
			if (oData) {

				$.grep(aAggregatedColumns, function(oAggregatedItem) {
					var oLabel = aColumns[oAggregatedItem["index"]].getAggregation("label");
					var sText = oAggregatedItem["label"];
					for (var index = 0; index < oData.results.length; index++) {
						if (oData.results[index][oAggregatedItem["column"]]) {
							var iSum = oData.results[index][oAggregatedItem["column"]];
							var oFloatFormat = sap.ui.core.format.NumberFormat.getFloatInstance(formatter.formatOptions("Float"));
							iTempSum += parseFloat(iSum);
						}
					}
					sText += "\n [" + oFloatFormat.format(iTempSum) + "]";
					oLabel.setText(sText);
				});

			} else {
				jQuery.sap.log.fatal(oResponse.responseText);
				MessageBox.alert(oResponse.responseText);
				this._oTableCellPopup.destroy();
			}
		},
		_handleSuccessDetData: function(oData, oResponse) {
			var oDetailDataModel = this.getModel("detData"),
				oDetailConfigModel = this.getModel("detConfig"),
				oColumns = this._retrieveVisibleColumns(oDetailConfigModel),
				aAggregatedColumns = oColumns.aggregatedColumns,
				oDetailTable = this.byId("siemensUiDetailTable"),
				aColumns = oDetailTable.getAggregation("columns"),
				iTempSum = parseFloat(0);
			if (oData) {
				oDetailDataModel.setData(oData);

				$.grep(aAggregatedColumns, function(oAggregatedItem) {
					var oLabel = aColumns[oAggregatedItem["index"]].getAggregation("label");
					var sText = oAggregatedItem["label"];
					for (var index = 0; index < oData.results.length; index++) {
						if (oData.results[index][oAggregatedItem["column"]]) {
							var iSum = oData.results[index][oAggregatedItem["column"]];
							var oFloatFormat = sap.ui.core.format.NumberFormat.getFloatInstance(formatter.formatOptions("Float"));
							iTempSum += parseFloat(iSum);
						}
					}
					sText += "\n [" + oFloatFormat.format(iTempSum) + "]";
					oLabel.setText(sText);
				});

			} else {
				jQuery.sap.log.fatal(oResponse.responseText);
				MessageBox.alert(oResponse.responseText);
				this._oTableCellPopup.destroy();
			}
		},

		/**
		 * Error handler for read of drill down data.
		 * @private
		 * @param {object} oError - Error details
		 */
		_handleErrorDrillDownData: function(oError) {
			jQuery.sap.log.fatal(JSON.stringify(oError));
			MessageBox.alert(JSON.stringify(oError));
			this._oTableCellPopup.destroy();
		},

		/**
		 * Function to return the filter for the link keys
		 * @private
		 * @param {object} oRowData - Current row data
		 * @param {object} aActiveKeyTargetCols - Link keys details
		 * @returns {object} aFilters - Filter of arrays for link keys
		 */
		_getLinkKeysDetailsFilter: function(oRowData, oItem) {
			var aFilters = [];

			var sKeys = oItem.linkKeys,
				aKeys;
			if (sKeys.match(",") !== null) {
				aKeys = sKeys.split(",");
			} else {
				aKeys = sKeys;
			}
			if (typeof aKeys !== "string") {
				for (var k = 0; k < aKeys.length; k++) {
					if (oRowData[aKeys[k]] !== undefined) {
						aFilters.push(new Filter(aKeys[k], FilterOperator.EQ, oRowData[aKeys[k]]));
					}
				}
			} else {
				if (oRowData[aKeys] !== undefined) {
					aFilters.push(new Filter(aKeys, FilterOperator.EQ, oRowData[aKeys]));
				}
			}

			return aFilters;
		},

		_getSelDetailsFilterDrillDwn: function(oRowData, sVisibleColumns) {
			var oModel = this.getModel("mainConfig"),
				aColumns = oModel.getProperty(this.config.paths.columns);

			var aFilters = aColumns.reduce(function(aTransitionalFilters, oColumn) {
				if (oColumn.DRILL_DOWN_BOND && sVisibleColumns.indexOf(oColumn.COLUMN) > -1) {
					aTransitionalFilters.push(new Filter(oColumn.DRILL_DOWN_BOND, FilterOperator.EQ, oRowData[oColumn.COLUMN]));
				}
				return aTransitionalFilters;
			}, []);

			return aFilters;
		},

		/*
		 * to get active columns which is key for target source
		 * @param {String} sVisibleColumns - all visible columns in the table
		 * @returns {Object} aActiveTargetCols - columns which are active key for target
		 * @private
		 */
		_getActiveTargetColumn: function(sVisibleColumns, sSourceColumnName) {
			var oModel = this.getComponentModel("mainConfig"),
				aActiveTargetCols,
				aColumns = oModel.getProperty(this.config.paths.columns);
			//aVisibleCols = sVisibleColumns.split(",");

			$.grep(aColumns, function(oItem, iItemIndex) {
				if (oItem.COLUMN === sSourceColumnName) {
					if (oItem.LINK_KEY_FIELDS !== "" && oItem.LINK_KEY_FIELDS !== null) {
						aActiveTargetCols = {
							column: oItem.COLUMN,
							index: iItemIndex,
							label: oItem.LABEL,
							linkKeys: oItem.LINK_KEY_FIELDS,
							dataSrc: oItem.LINK_TARGET,
							headerTitle: oItem.MAINHEADER_DRILL,
							subheaderTitle: oItem.SUBHEADER_DRILL
						};
					}
				}
			});

			return aActiveTargetCols;
		},

		_getTargetCalcID: function() {
			var oModel = this.getModel("mainConfig");
			var sTargetCalcID = oModel.getProperty("/DRILL_DOWN_TARGET");

			return sTargetCalcID;
		},

		/*
		 * on before open of dialog for drill down
		 * @param {sap.ui.base.Event}
		 * @public
		 */
		onBeforeOpenDrillDown: function(oEvent) {
			var oTablePopup = this._getTablePopupFrag(),
				oDrillDataModel = this.getModel("drillData"),
				oColModel = this.getModel("drillConfig"),
				oColModelRead = this._retrieveVisibleColumns(oColModel),
				sVisibleColumns = oColModelRead.visibleColumns,
				sEntitryName = this.getModel("drillConfig").getProperty("/ENTITY_NAME");
			//bind table column with config data
			oTablePopup.bindAggregation("columns", "drillConfig>/ServiceColumns/results", this._prepareRows.bind(""));
			//set table with drill data
			oTablePopup.setModel(oDrillDataModel);
			//bind rows of table with drill data and select parameter with visible columns
			oTablePopup.bindRows({
				path: "/" + sEntitryName,
				parameters: {
					select: sVisibleColumns
				},
				filters: oDrillDataModel.filters
			});
		},

		/**
		 * Prepare row template and columns for Table Popup
		 * @private
		 * @param {string} sId - Current id of the control aggregation
		 * @param {object} oContext - Model context of the control
		 * @returns {object} oUIControl - Column control for table
		 */
		_prepareRows: function(sId, oContext) {
			var oUIControl,
				sColumnLabel = oContext.getProperty("LABEL"),
				bColumnVisibility = oContext.getProperty("STDRD") === 1,
				sColumnId = oContext.getProperty("COLUMN"),
				sColumnWidth = oContext.getProperty("CWIDTH"),
				sAlign = formatter.alignColumn(oContext.getProperty("IS_KFG")),
				sColumnDesc = oContext.getProperty("DESCRIPTION"),
				sColumnHeaderDesign = formatter.columnLabelDesign(oContext.getProperty("IS_KFG")),
				sColumnType = oContext.getProperty("CTYPE"),
				oType = formatter.getDataTypeInstance(sColumnType),
				sBoldTextClass = sColumnHeaderDesign === "Bold" ? "siemensTextBold" : "",
				oTemplate = new Text({
					text: {
						path: this + sColumnId,
						type: oType
					}
				});

			var oLabel = new Text({
				text: sColumnLabel,
				textAlign: formatter.rowAlign(oContext.getProperty("IS_KFG"))
			}).addStyleClass(sBoldTextClass);

			oUIControl = new TableColumn(sId, {
				visible: bColumnVisibility,
				label: oLabel,
				template: oTemplate,
				hAlign: sAlign,
				sortProperty: sColumnId,
				autoResizable: true,
				width: sColumnWidth,
				tooltip: sColumnDesc
			});

			return oUIControl;
		},

		/*
		 * to return the instance of table popup fragment
		 * @private
		 */
		_getTablePopupFragDiagId: function() {
			return this.createId("tvFragTablePopup");
		},

		/*
		 *Returns a control from fragment with provided fragment id
		 * @param   {string}              sFragId    fragment id
		 * @param   {string}              sControlId control if to get
		 * @returns {sap.ui.core.Control} Control inside fragment
		 * @private
		 */

		_getFragmentControl: function(sFragId, sControlId) {
			return Fragment.byId(sFragId, sControlId);
		},

		/*
		 * to return the instance of table in dialog fragment
		 * @private
		 */
		_getTablePopupFrag: function() {
			return this._getFragmentControl(this._getTablePopupFragDiagId(), "siemensUiPopupTable");
		},

		/*
		 * to return the instance of table in dialog fragment
		 * @private
		 */
		_getTablePopupTitle: function() {
			return this._getFragmentControl(this._getTablePopupFragDiagId(), "siemensUiTablePopupTitle");
		},

		/*
		 * to return the instance of table in dialog fragment
		 * @private
		 */
		_getPopupDialog: function() {
			return this._getFragmentControl(this._getTablePopupFragDiagId(), "siemensUiPopupDialog");
		},

		/**
		 * Closes table cell popup dialog
		 * @private
		 */
		onTableCellPopupClose: function() {
			this._oTableCellPopup.destroy();
		},

		/**
		 * on After close event of table cell popup dialog. Destroys the instance of dialog
		 * @param {sap.ui.base.Event} oEvent - event handler for on after close of dialog
		 * @public
		 */
		onAfterCloseDrillDown: function(oEvent) {
			this._oTableCellPopup.destroy();
		},

		/**
		 * Create requests for each visible aggregated column
		 * @private
		 * @param {string} sVisibleColumns - Visible Columns
		 * @param {array} aFilters - Filters for requests
		 */
		_bindAggregatedColumns: function(sVisibleColumns, aFilters, oTable, oModel, sPath, aAggregatedColumns) {
			if (aAggregatedColumns) {
				$.grep(aAggregatedColumns, function(oAggregatedItem) {

				sVisibleColumns = !!sVisibleColumns ? sVisibleColumns : this._readVisibleColumns(oTable.getAggregation("columns"));
				// Check if aggregated column visible
				if (sVisibleColumns.search(oAggregatedItem["column"]) !== -1) {
					models.requestData(
						oModel,
						sPath,
						oAggregatedItem["column"],
						this._handleRequestSuccess.bind.apply(this._handleRequestSuccess, [this].concat([oAggregatedItem["column"], oTable, aAggregatedColumns])),
						this._handleRequestError.bind(this),
						false,
						aFilters && aFilters.aFilters ? [aFilters] : undefined);
				}

			}.bind(this));
			}		
		},


		_handleRequestSuccess: function(sColumn, oTable, aAggregatedColumns, oData) {
			var aColumns = oTable.getAggregation("columns");
			$.grep(aAggregatedColumns, function(oAggregatedItem) {
				// additional condition added to fix bug CO-675, mismatch of column name
				if ((oAggregatedItem.column === sColumn) && (aColumns[oAggregatedItem["index"]].getProperty("sortProperty") === sColumn)) {
					var oLabel = aColumns[oAggregatedItem["index"]].getAggregation("label");
					var sText = oAggregatedItem["label"];
					if (oData.results[0][oAggregatedItem["column"]]) {
						var iSum = oData.results[0][oAggregatedItem["column"]];
						var oFloatFormat = sap.ui.core.format.NumberFormat.getFloatInstance(formatter.formatOptions("Float"));
						sText += "\n [" + oFloatFormat.format(iSum) + "]";
					}
					oLabel.setText(sText);
				}
			});
			oTable.rerender();
		},

		_handleRequestError: function(oError) {
			jQuery.sap.log.error(oError);
		},

		_setVariantSelect: function() {
			this.getGlobalVariableModel().setProperty("/vSelEvent", "X");
		},

		/**
		 * Setup filters
		 * @param sChannel
		 * @param sEvent
		 * @param oData
		 * @private
		 */
		_setupFilters: function(sChannel, sEvent, oData) {
			if (oData.hash === "Table" || oData.hash === "Mix") {
				if (sEvent === "InputParameters") {
					this._requestNewData();
				} else {
					var oTable = this.getView().byId(oData.ID),
						oTableBinding = oTable.getBinding("rows"),
						aFilters = [];
					// Set Filter if it is corresponding event
					if (sEvent === "SetupFilters") {
						if (oData.mainFilters.aFilters.length > 0) {
							aFilters = oData.mainFilters;
						}
					}
					var bVselEvent = this.getGlobalVariableModel().getProperty("/vSelEvent");

					if (this._oTpcEvent === "" && bVselEvent === "X") {
						var oEventBus = this.getEventBus();
						this.getGlobalVariableModel().setProperty("/vSelEvent","");
						oEventBus.publish("TableViewer", "SetVisibleColumn");
						oEventBus.publish("TableViewer", "SetVisibleFilter");
					} else {
						this._oTpcEvent = "";
						this.getGlobalVariableModel().setProperty("/vSelEvent","");
					}
					if (oTableBinding) {
						if (oTableBinding.hasOwnProperty("aApplicationFilters") === true) {
							if (oTableBinding.aApplicationFilters) {
								// Check if filters already applied
								if (JSON.stringify(aFilters) !== JSON.stringify(oTableBinding.aApplicationFilters[0]) && oTable.getDomRef()) {
										var oTable = this.getView().byId(this.config.elements.table),
											aColumns = oTable.getAggregation("columns"),
											sVisibleColumns = this._readVisibleColumns(aColumns);
										this.attachRequestsForControlBusyIndicator(this.getComponentModel(), oTable);
										this._bindRows(oTable, sVisibleColumns, aFilters, aFilters);

									//}
								} else if (aFilters.length === 0 && oTableBinding.aApplicationFilters.length == 0) {
									var oTable = this.getView().byId(this.config.elements.table),
										aColumns = oTable.getAggregation("columns"),
										sVisibleColumns = this._readVisibleColumns(aColumns);
									this.attachRequestsForControlBusyIndicator(this.getComponentModel(), oTable);
									this._bindRows(oTable, sVisibleColumns, aFilters, aFilters);
								}
							}
						}
					}
				}
			}
		},

		_onRouteMatched: function(oEvent) {
			if (oEvent.getParameters("arguments").arguments.tab === "Table") {
				var aFilter = this.getModel("view").getProperty("/aMainFilters");
				var aSorters = this.getModel("view").getProperty("/aMainSorters");
				var oData = {
					ID: this.config.elements.table,
					mainFilters: aFilter,
					mainSorters: aSorters,
					hash: oEvent.getParameters("arguments").arguments.tab
				};
				if (aFilter && aFilter !== undefined) {
					this._setupFilters("", "SetupFilters", oData);
				} else if (aFilter === undefined) {
					this._setupFilters("", "RemoveFilters", oData);
				}
			}
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Called when the table controller is destroyed.
		 * @public
		 */
		onExit: function() {
			var oEventBus = this.getEventBus();
			oEventBus.unsubscribe("TableController", "RemoveFilters", this._setupFilters, this);
			oEventBus.unsubscribe("TableController", "SetupFilters", this._setupFilters, this);
			oEventBus.unsubscribe("TableController", "InputParameters", this._setupFilters, this);
			oEventBus.unsubscribe("TableViewer", "ReturnFilterData", this._storeFilterData, this);
			oEventBus.unsubscribe("TableController", "SetVariantSelect", this._setVariantSelect, this);
		},

		/**
		 * Open/Create+Open dialog for multi sorter
		 * @public
		 */
		onMultiSorterDialog: function() {
			// Create dialog if it doesn't exist
			if (!this._oMultiSortDialog) {
				// Create and set dialog model
				this.setModel(new JSONModel({
					sortItems: [],
					items: [],
					maxConditions: 0
				}), "sortDialogModel");

				// associate controller with the fragment
				this._oMultiSortDialog = sap.ui.xmlfragment("com.siemens.tableViewer/view/tabs/fragments/MultiSortDialog", this);
				this.getView().addDependent(this._oMultiSortDialog);

				// toggle compact style
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oMultiSortDialog);
			}

			var oTable = this.byId(this.config.elements.table),
				aItems = [],
				oJsonModel = this.getModel("sortDialogModel"),
				oRowBinding = oTable.getBinding("rows"),
				aSortItems = [];

			// Get visible columns and set items
			oTable.getColumns().map(function(oColumn) {
				if (oColumn.getVisible()) {
					aItems.push({
						columnKey: oColumn.getSortProperty(),
						text: oColumn.getLabel().getProperty("text")
					});
				}
			});

			// Bind maximum possible variants of conditions
			var oInnerSortPanel = this._oMultiSortDialog.getPanels()[0]._oSortPanel;
			oInnerSortPanel.bindProperty("maxConditions", {
				path: "sortDialogModel>/maxConditions"
			});
			oJsonModel.setProperty("/maxConditions", aItems.length);

			// Insert empty element into beginning
			aItems.unshift({
				key: null,
				text: this.getResourceBundle().getText("sortDialog.none")
			});
			oJsonModel.setProperty("/items", aItems);

			// Get already sorted columns
			aSortItems = oRowBinding.aSorters.map(function(oSorter) {
				return {
					columnKey: oSorter.sPath,
					operation: oSorter.bDescending ? SortOrder.Descending : SortOrder.Ascending
				};
			});
			this.getModel("sortDialogModel").setProperty("/sortItems", aSortItems);

			this.getModel("sortDialogModel").refresh(true);

			this._oMultiSortDialog.open();
		},

		/**
		 * Handle Multi Sorter dialog OK button
		 * @public
		 * @param {object} oEvent - Event handler for Dialog OK button
		 */
		handleMultiSortOk: function(oEvent) {
			var oSortPanel = oEvent.getSource().getPanels()[0],
				aSelectedConditions = oSortPanel._getConditions(),
				aSorter = [],
				oTable = this.byId(this.config.elements.table),
				oBindingRows = oTable.getBinding("rows"),
				aColumns = oTable.getColumns();

			// Remove sorted parameter
			aColumns.forEach(function(oColumn) {
				oColumn.setSorted(false);
			});

			$.grep(aSelectedConditions, function(oSelectedCondition) {
				if (oSelectedCondition.keyField !== "0") {
					for (var iColumn = 0; iColumn < aColumns.length; iColumn++) {
						if (aColumns[iColumn].getSortProperty() === oSelectedCondition.keyField) {
							aColumns[iColumn].setSortOrder(oSelectedCondition.operation);
							aColumns[iColumn].setSorted(true);
							break;
						}
					}
					aSorter.push(
						new Sorter(oSelectedCondition.keyField, oSelectedCondition.operation === SortOrder.Descending)
					);
				}
			});

			oBindingRows.sort(aSorter);

			this._oMultiSortDialog.close();
		},

		/**
		 * Handle Multi Sorter dialog Cancel button
		 * @public
		 */
		handleMultiSortCancel: function() {
			this._oMultiSortDialog.close();
		},

		_getUnsortedColumns: function(aColumns) {
			var sUnsortedColumns = "";

			for (var iColumn = 0; iColumn < aColumns.length; iColumn++) {
				if (aColumns[iColumn].getVisible() && !aColumns[iColumn].getSorted()) {
					sUnsortedColumns += sUnsortedColumns === "" ? aColumns[iColumn].getSortProperty() : "," + aColumns[iColumn].getSortProperty();
				}
			}

			return sUnsortedColumns;
		},

		/**
		 * Event handler when an export button is pressed
		 * @public
		 */
		onExportToExcel: function(oEvent) {
			// to a validation
			var iRowCount = this.getModel(this.config.models.tableView).getProperty("/rowCount");

			if (iRowCount > this.config.limitations.exportLimitationRows) {
				var oErrorData = {
					title: this.getResourceBundle().getText("exportToExcelErrorTitle"),
					icon: MessageBox.Icon.ERROR,
					actions: [MessageBox.Action.ABORT],
					message: this.getResourceBundle().getText("exportToExcelErrorMessage", [iRowCount, this.config.limitations.exportLimitationRows])
				};
				MessageBox.show(oErrorData.message, {
					icon: oErrorData.icon,
					title: oErrorData.title,
					actions: oErrorData.actions,
					defaultAction: MessageBox.Action.ABORT,
					styleClass: this.getOwnerComponent().getContentDensityClass(),
					onClose: function(oAction) {
						// this.destroy();
					}
				});

				return;
			}

			// create fragment instance
			if (!this._oExportFormatsPopover) {
				this._oExportFormatsPopover = sap.ui.xmlfragment("com.siemens.tableViewer/view/tabs/fragments/TableExportPopover", this);
				this.getView().addDependent(this._oExportFormatsPopover);
			}

			// add compact styles
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oExportFormatsPopover);

			// open popover with 0 delay
			var oButton = oEvent.getSource();
			jQuery.sap.delayedCall(0, this, function() {
				this._oExportFormatsPopover.openBy(oButton);
			});
		},
		
		_replaceTimeString: function(sFilterParams) {
            var sPattern = "%20time%27";
            var iIndex;
            var bCondition = true;
            var sTime = "";
            var sReplaceTime = "";
            var oTimeFormatter = new sap.ui.model.type.Time({
				source: {
					pattern: "HH:mm:ss"
				},
				pattern: "'PT'HH'H'mm'M'ss'S'"
			});

            while (bCondition) {
                iIndex = sFilterParams.indexOf(sPattern);
                if (iIndex === -1) {
                    bCondition = false;
                } else {
                    sTime = sFilterParams.substr(iIndex + sPattern.length, 11);
                    sReplaceTime = oTimeFormatter.parseValue(sTime, "string");
                    sFilterParams = sFilterParams.replace(sPattern + sTime, "%20%27" + sReplaceTime);
                }
            }
		    
		    return sFilterParams;
		},
		
		_getKFGValues: function(sVisibleColumns) {
		    var oMainConfig = this.getComponentModel("mainConfig");
		    var sResult = oMainConfig.getProperty(this.config.paths.columns).reduce(function(sTransition, oColumn) {
		        if (oColumn.IS_KFG === 1 && sVisibleColumns.search(oColumn.COLUMN) !== -1) {
		            sTransition += sTransition === "" ? oColumn.COLUMN : "," + oColumn.COLUMN;
		        }
		        return sTransition;
		    }, "");
		    
		    return sResult;
		},

		onExport: function(oEvent) {
			var oTable = this.getView().byId(this.config.elements.table),
				aColumns = oTable.getAggregation("columns"),
				sVisibleColumns = this._readVisibleColumns(aColumns),
				sUnsortedColumns = this._getUnsortedColumns(aColumns),
				oRows = oTable.getBinding("rows"),
				sSortedColumns = oRows.sSortParams,
				aFilters = oRows.aApplicationFilters,
				oMainConfig = this.getComponentModel("mainConfig"),
				sExportService = this.getOwnerComponent().getMetadata().getConfig().serviceUrl,
				oMetadata = this.getComponentModel().oMetadata,
				sResolvedPath = oMainConfig.getProperty("/ENTITY_NAME"),
				oEntitySet = oMetadata._getEntityTypeByPath(sResolvedPath),
				sFilterParams = ODataUtils.createFilterParams(aFilters, oMetadata, oEntitySet),
				sDataSource = oMainConfig.getProperty("/DATA_SOURCE"),
				sFormat = oEvent.getSource().getCustomData()[0].getProperty("value"),
				sInputParams = "",
				sSheetName = "data",
				sExportFileName = "export";

			this._oExportFormatsPopover.close();

			if (oMainConfig.getProperty("/INPUT_PARAMETERS")) {
				sInputParams = sResolvedPath.slice(sResolvedPath.indexOf("("), sResolvedPath.indexOf(")") + 1);
				sInputParams = sInputParams.replace(/datetime/g, ""); // Remove datetime property
				sInputParams = sInputParams.replace(/time/g, ""); // Remove time property
			}

			if (sSortedColumns && sUnsortedColumns !== "") {
				sSortedColumns = sSortedColumns + "," + sUnsortedColumns;
			} else if (!sSortedColumns) {
				sSortedColumns = "$orderby=" + sUnsortedColumns;
			}

			sFilterParams = sFilterParams ? "&" + sFilterParams : "";
			//replace datetime to enable export for ctype 20..
			sFilterParams = sFilterParams.replace(/%20datetime%27/g, "%20%27");
			
			//replace time in FilterString
			sFilterParams = this._replaceTimeString(sFilterParams);

			sFilterParams = sFilterParams.replace(/(\d)([M])([)%])/g, "$1$3");

			var sURIExcel = sExportService + this.config.paths.exportService + "/%22_SYS_BIC%22/%22" + sDataSource + "%22" + sInputParams + "?";
			window.open(sURIExcel +
				"$select=" + sVisibleColumns +
				"&" + sSortedColumns +
				sFilterParams +
				"&" + "IS_KFG=" + this._getKFGValues(sVisibleColumns) +
				"&" + "$format=" + sFormat +
				"&" + "fieldsep=;" +
				"&" + "sheetname=" + sSheetName +
				"&" + "download=" + sExportFileName + "." + sFormat +
				"&" + "langu=" + this.getAppLanguage());
		},

		onToggleFullScreen: function(oEvent) {
			this.getEventBus().publish("TableViewer", "FullMode");
			var oTable = this.byId("siemensUiTable"),
				oSource = oEvent.getSource();
			if (oEvent.getParameter("pressed")) {
				oSource.setIcon("sap-icon://exit-full-screen");
				var iHeight = jQuery(document).outerHeight() - 4 - 40 - 32 - oTable.$().find(".sapUiTableColHdr").outerHeight();
				if (sap.ushell) {
					iHeight -= 44;
				}
				var iRowCount = Math.floor(iHeight / oTable.getRowHeight());
				oTable.setVisibleRowCount(iRowCount);
			} else {
				oSource.setIcon("sap-icon://full-screen");
				oTable.setVisibleRowCount(10);
			}
		}
	});

});