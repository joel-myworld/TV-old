sap.ui.define([
	"com/siemens/tableViewer/controller/BaseController",
	"com/siemens/tableViewer/control/CustomValueHelpDialog",
	"sap/ui/model/json/JSONModel",
	"com/siemens/tableViewer/model/formatter",
	"sap/ui/comp/filterbar/FilterItem",
	"sap/m/MultiInput",
	"sap/m/Input",
	"sap/m/DatePicker",
	"sap/m/DateRangeSelection",
	"sap/m/DateTimeInput",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/routing/HashChanger",
	"sap/ui/model/odata/ODataModel",
	"sap/ui/core/Item",
	"sap/m/ComboBox",
	"sap/m/MultiComboBox",
	"com/siemens/tableViewer/model/models",
	"sap/m/MessageBox",
	"sap/m/Token",
	"sap/ui/model/odata/CountMode",
	"sap/m/MessageToast",
	"sap/ui/model/odata/ODataUtils"
], function(BaseController, ValueHelpDialog, JSONModel, formatter, FilterItem, MultiInput, Input, DatePicker, DateRangeSelection, DateTimeInput, Sorter, Filter, FilterOperator, HashChanger, ODataModel, Item, ComboBox, MultiComboBox, models, MessageBox, Token, CountMode, MessageToast, ODataUtils) {
	"use strict";
	/* global $ */
	var _aValidTabKeys = ["Table", "Chart", "Tree", "Mix"];
	return BaseController.extend("com.siemens.tableViewer.controller.TableViewer", {
		/**
		 * Constants for the controller
		 */
		config: {
			ui: {
				elements: {
					table: "siemensUiTable",
					treetable: "siemensUiTree",
					measures: "siemens.ui.measure.select",
					dimensions: "siemens.ui.dimension.select",
					filterbar: "siemens.ui.filterbar",
					chartSettings: "siemensUiChartSettings",
					variant: "siemensUiVariantManagement",
					rowSlider: "siemensUiRowCountSlider",
					rowInput: "siemensUiRowCountInput"
				}
			},
			tableTypes: {
				treeTable: "treeTable",
				table: "table"
			},
			paths: {
				variantView: "variantView",
				variantData: "variantData",
				variantService: "variants.xsodata",
				variantEntity: "/VariantsSet",
				useridEntity: "/UserList",
				mainConfig: "mainConfig",
				toColumns: "mainConfig>/ServiceColumns/results",
				view: "view"
			}
		},

		formatter: formatter,
		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {

			var oRouter = this.getRouter(),
				oFilterBar = this.byId(this.config.ui.elements.filterbar),
				sPathToColumns = this.config.paths.toColumns,
				oMainConfigModel = this.getComponentModel(this.config.paths.mainConfig),
				oEventBus = this.getEventBus();

			this.getView().setModel(new JSONModel(), this.config.paths.view);
			
			if (oMainConfigModel.getProperty("/INPUT_PARAMETERS") === 1) {
				this.getComponentModel().attachMetadataLoaded(this._initInputParameters, this);
			}

			oRouter.getRoute("tableviewer").attachMatched(this._onRouteMatched, this);

			oFilterBar.bindAggregation("filterItems", sPathToColumns, this._filterItemsFactory.bind(this));

			this._retrieveTableType();
			
			if (oMainConfigModel.getProperty("/VARIANT_HIDDEN") === 0) {
				this._initVariantManagement(oMainConfigModel);
			}

			oEventBus.subscribe("TableViewer", "FillFilterBar", this._fillFilterBar, this);

			// subscribe table viewer for full screen mode, function executed when toggle full screen button is pressed;
			oEventBus.subscribe("TableViewer", "FullMode", this._toggleFullMode, this);

			// save app status before opening a dependant report
			oEventBus.subscribe("TableViewer", "SaveInitialReport", this._saveInitialReport, this);

			// get filterValues and pass them to Table controller
			oEventBus.subscribe("TableViewer", "GetFilterData", this._getFilterData, this);

			//Set visible columns to tables
			oEventBus.subscribe("TableViewer", "SetVisibleColumn", this._setVisibleColumns, this);
			
			//Set visible filters to filter bar
			oEventBus.subscribe("TableViewer", "SetVisibleFilter", this._setVisibleFilters, this);

		},

		_getFilterData: function() {
			var oEventBus = this.getEventBus();
			var aMainFilters = this._retrieveFilters(this._retrieveFilterFields());

			aMainFilters = aMainFilters.aFilters.length > 0 ? aMainFilters : undefined;

			this.getModel("view").setProperty("/aMainFilters", aMainFilters);

			oEventBus.publish("TableViewer", "ReturnFilterData", aMainFilters);
		},

		/**
		 * Called when FullMode event raised
		 * @param sChannel
		 * @param sEvent
		 * @param oData
		 * @private
		 */
		_toggleFullMode: function() {
			this.byId("siemensMainFilterLayout").setVisible(!this.byId("siemensMainFilterLayout").getVisible());
			this.byId("iconTabBar").setStretchContentHeight(!this.byId("iconTabBar").getStretchContentHeight());
			this.byId("siemens.ui.table").getParent().setVisible(!this.byId("siemens.ui.table").getParent().getVisible());
		},

		/**
		 * Function for saving current app status before opening
		 * dependant report
		 * @returns {void}
		 */
		_saveInitialReport: function() {
			var sMainConfigModel = this.getModel(this.config.paths.mainConfig),
				sCtrlID = sMainConfigModel.getProperty("/CTRLID"),
				oFilterObject = {};

			oFilterObject["oFilters"] = this._getAppliedFilters();

			if (sMainConfigModel.getProperty("/INPUT_PARAMETERS")) {
				oFilterObject["IP"] = sMainConfigModel.getProperty("/ENTITY_NAME");
			}

			var oVariantModel = this.getModel(this.config.paths.variantData);

			if (!oVariantModel) {
				// set variant model
				oVariantModel = new ODataModel([this.getOwnerComponent().getMetadata().getConfig().serviceUrl, this.config.paths.variantService].join(""), true);

				oVariantModel.setDefaultCountMode(CountMode.Inline);
				this.setModel(oVariantModel, this.config.paths.variantData);
			}

			var oPayLoad = {
				CTRLID: sCtrlID,
				VariantId: "InitialReport",
				UserId: "",
				VariantName: "InitialReport",
				isDefault: 0,
				isGlobal: 0,
				isHidden: 1,
				filterObject: encodeURI(JSON.stringify(oFilterObject)),
				forUsers: "",
				tableColumns: encodeURI(JSON.stringify(this._getTableColumns())),
				filterFields: encodeURI(JSON.stringify(this._readVisibleFilters()))
			};

			oVariantModel.create("/VariantsUpsert", oPayLoad, {
				success: function() {
					if (this.getModel("view").getProperty("/moveToNewReport")) {
						this.getModel("view").setProperty("/moveToNewReport", false);
						this.handleCrossAppNavigation(sCtrlID, true);
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
		 * Called when the table controller is destroyed.
		 * @public
		 */
		onExit: function() {
			var oEventBus = this.getEventBus();
			oEventBus.unsubscribe("TableViewer", "FillFilterBar", this._fillFilterBar, this);
			oEventBus.unsubscribe("TableViewer", "FullMode", this._toggleFullMode, this);
			oEventBus.unsubscribe("TableViewer", "SaveInitialReport", this._saveInitialReport, this);
			oEventBus.unsubscribe("TableViewer", "GetFilterData", this._getFilterData, this);
			oEventBus.unsubscribe("TableViewer", "SetVisibleColumn", this._setVisibleColumns, this);
			oEventBus.unsubscribe("TableViewer", "SetVisibleFilter", this._setVisibleFilters, this);
		},

		/**
		 * Event handler for search button on filterbar
		 * @public
		 * @param {object} oEvent - Event handler for element
		 */
		onSearch: function(oEvent) {
			var sTableID = (this._tableViewerTableType === this.config.tableTypes.treeTable) ? this.config.ui.elements.treetable : this.config.ui.elements.table;

			this._searchTable(oEvent, sTableID);
		},

		/**
		 * Event handler for clear button on filterbar
		 * @public
		 * @param {object} oEvent - Event handler for element
		 */
		onClear: function(oEvent) {
			var sTableID = (this._tableViewerTableType === this.config.tableTypes.treeTable) ? this.config.ui.elements.treetable : this.config.ui.elements.table;

			this._clearFilterBar(oEvent, sTableID);
		},

		/**
		 * Call Input parameter Dialog
		 * @public
		 */
		onInputParameterDialogCall: function() {
			// create fragment instance
			if (!this._oInputParameterDialog) {
				this._createInputParametersDialo();

				this.getView().addDependent(this._oInputParameterDialog);

				// add compact styles
				this._oInputParameterDialog.addStyleClass(this.getOwnerComponent()._sContentDensityClass);

				// Create controls for Input parameters
				this._createControls();
			}

			jQuery.sap.delayedCall(0, this, function() {
				this._oInputParameterDialog.open();
			});
		},

		_createInputParametersDialo: function() {
			this._oInputParameterDialog = sap.ui.xmlfragment("com.siemens.tableViewer/view/tabs/fragments/InputParameterDialog", this);
		},

		/**
		 * Cancel Input parameter dialog
		 * @public
		 */
		onInputParameterCancel: function() {
			this._oInputParameterDialog.close();
		},

		/**
		 * Create entity path and search data for this url
		 * @public
		 */
		onInputParameterSearch: function() {
			var oEventBus = this.getEventBus();
			var oInputParamsModel = this.getModel("inputParameters");
			var oMainConfigModel = this.getComponentModel("mainConfig");

			this._setEntityNameWithInputParams(oInputParamsModel, oMainConfigModel);

			this._clearFilterItems();

			// Request new data for the table
			oEventBus.publish("TableController", "InputParameters", {
				hash: HashChanger.getInstance().getHash()
			});

			// Close dialog if it exists
			if (this._oInputParameterDialog) {
				this._oInputParameterDialog.close();
			}
		},

		/**
		 * Create CheckBox controls for Input parameters and put them on the dialog
		 * @private
		 */
		_createControls: function() {
			var oControls = this.getModel("inputParameters").getProperty("/controls"),
				oSimpleForm = sap.ui.getCore().byId("siemensUiInputParamsForm"),
				oUIControl;

			for (var sTechName in oControls) {
				// Add Label
				oSimpleForm.addContent(new sap.m.Label({
					text: "{inputParameters>/controls/" + sTechName + "/label}"
				}).addStyleClass("sapUiTinyMarginTop"));

				// Create UI Control
				switch (oControls[sTechName].type) {
					case "Edm.Byte":
					case "Edm.Int16":
					case "Edm.Int32":
					case "Edm.Int64":
					case "Edm.Decimal":
					case "Edm.Single":
					case "Edm.Double":
						oUIControl = new Input({
							value: "{inputParameters>/controls/" + sTechName + "/value}",
							type: "Number",
							width: "80%"
						});
						break;
					case "Edm.DateTime":
						oUIControl = new DatePicker({
							value: {
								path: "inputParameters>/controls/" + sTechName + "/value",
								type: "sap.ui.model.type.Date",
								formatOptions: {
									source: {
										pattern: 'yyyy-MM-ddTHH:mm:ss'
									}
								}
							},
							width: "80%"
						});
						break;
					case "Edm.Time":
						oUIControl = new Input({
							value: {
								path: "inputParameters>/controls/" + sTechName + "/value",
								type: "sap.ui.model.type.Time",
								formatOptions: {
									source: {
										pattern: "'PT'HH'H'mm'M'ss'S'"
									},
									pattern: "HH:mm"
								}
							},
							width: "80%"
						});
						break;
					case "Edm.String":
					default:
						oUIControl = new Input({
							value: "{inputParameters>/controls/" + sTechName + "/value}",
							type: "Text",
							width: "80%"
						});
						break;
				}

				// Add Control
				oSimpleForm.addContent(oUIControl);
			}
		},

		/**
		 * Initialize Input parameter model and default values
		 * @private
		 */
		_initInputParameters: function() {
			var oMainConfigModel = this.getComponentModel("mainConfig");
			var sEntityName = oMainConfigModel.getProperty("/ENTITY_NAME");
			var aSplitedEntity = sEntityName.split("/");
			var oInputParamsModel = models.createInputParametersModel();

			this.setModel(oInputParamsModel, "inputParameters");

			this._getMetadataDefaultValues(this.getComponentModel(), oInputParamsModel);

			// Check if ENTITY_NAME has full path like EntitySet(KEYS=''..)/Results
			if (aSplitedEntity.length > 1) {
				this._getDefaultEntityValues(aSplitedEntity[0], oInputParamsModel);
			}

			var bDependent = this.getOwnerComponent()._getUriParams("dependent");

			if (bDependent === "true") {
				this._getDefaultEntityValues(aSplitedEntity[0], oInputParamsModel);
			}

			if (bDependent === "false") {
				return;
			} else if (oMainConfigModel.getProperty("/INPUT_PARAMETERS_DIALOG")) {
				this.onInputParameterDialogCall();
			} else {
				this._setEntityNameWithInputParams(oInputParamsModel, oMainConfigModel);
			}
		},

		_fillFilterBar: function(sChannel, sEvent, oData) {
			if (oData.initial) {
				this._addFilterItemsValuesToFilterBar(oData.values);
				return;
			}

			var oFilterBar = this.byId(this.config.ui.elements.filterbar),
				oFilterControl,
				oColumnModelObject,
				aNewTokens,
				sProperty,
				oNewToken,
				oCustomData = {},
				fCreateTokens = function(sValue) {
					oNewToken = new Token({
						key: oColumnModelObject.CTYPE === 20 || oColumnModelObject.CTYPE === 21 ? new Date(sValue) : sValue,
						text: formatter.formatDataBasedOnColumnType(oColumnModelObject.CTYPE, sValue)
					});
					oCustomData[sProperty] = sValue;
					oNewToken.data("row", oCustomData);
					aNewTokens.push(oNewToken);
				};

			for (sProperty in oData.values) {
				oFilterControl = oFilterBar.determineControlByName(sProperty);
				oColumnModelObject = this._retreiveColumnModelObject(sProperty)[0];

				if (oFilterControl.getMetadata()._sClassName === "sap.m.MultiInput") {
					aNewTokens = [];

					$.grep(oData.values[sProperty], fCreateTokens);
					oFilterControl.setTokens(aNewTokens);
				} else if (oFilterControl.getMetadata()._sClassName === "sap.m.MultiComboBox") {
					oFilterControl.setSelectedKeys(oData.values[sProperty]);
				}
			}
		},

		/**
		 * Initialize VariantManagement model, bind VariantItems and set Default Variant
		 * @private
		 * @param {sap.ui.model.json.JSONModel} oMainConfigModel - Main config model
		 */
		_initVariantManagement: function(oMainConfigModel) {
			this.getView().setModel(models.createVariantManagerModel(), this.config.paths.variantView);

			var oVariantManagement = this.getView().byId(this.config.ui.elements.variant),
				sCTRLID = oMainConfigModel.getProperty("/CTRLID");

			var aFilters = [new Filter("CTRLID", FilterOperator.EQ, sCTRLID), new Filter("isHidden", FilterOperator.EQ, 0)];
			var oVariantItemsTemplate = new sap.ui.comp.variants.VariantItem({
				readOnly: {
					path: "variantData>isGlobal",
					formatter: function(oValue) {
						return oValue === 1;
					}
				},
				text: "{variantData>VariantName}",
				key: "{variantData>VariantId}",
				customData: [{
					key: "filters",
					value: "{variantData>filterObject}"
				}, {
					key: "tableColumns",
					value: "{variantData>tableColumns}"
				},
					{
					key: "filterFields",
					value: "{variantData>filterFields}"
					}	
				],
				global: {
					path: "variantData>isGlobal",
					formatter: formatter.setVariantGlobal
				}
			});

			oVariantManagement.bindAggregation("variantItems", {
				path: "variantData>/VariantsGet",
				template: oVariantItemsTemplate,
				filters: [new Filter(aFilters, true)]
			});

			var fnGetDefaultVariants;

			fnGetDefaultVariants = function() {
				// set variant model
				var oModel = new ODataModel([this.getOwnerComponent().getMetadata().getConfig().serviceUrl, this.config.paths.variantService].join(""), true);

				oModel.setDefaultCountMode(CountMode.Inline);
				this.getView().setModel(oModel, this.config.paths.variantData);

				// Set default variant
				oModel.read("/VariantsGet", {
					async : false,
					urlParameters: "$filter=isDefault%20eq%201%20and%20CTRLID%20eq%20%27" + sCTRLID + "%27",
					success: jQuery.proxy(function(oData) {
						if (oData.results.length > 0) {
							this.getView().byId(this.config.ui.elements.variant).setInitialSelectionKey(oData.results[0].VariantId);
							var sVariantId = oData.results[0].VariantId;
							if (sVariantId === undefined || sVariantId === null || sVariantId === "") {
								this._previousDefaultKey = "*standard*";
							} else {
								this._previousDefaultKey = sVariantId;
							}
							
							this.getView().byId(this.config.ui.elements.variant).setDefaultVariantKey(this._previousDefaultKey);
				// 			this.getView().byId(this.config.ui.elements.variant).fireSelect({
				// 				key: this._previousDefaultKey
				// 			});
						} else {
							//else condition added to fix deletion of variants where this._previousDefaultKey was set undefined
							oModel.bDefault = true;
							this._previousDefaultKey = "*standard*";
						}
					}, this)
				});
			}.bind(this);
			if (oMainConfigModel.getProperty("/ODATA_SRV") === 1 && !oMainConfigModel.getProperty("/IS_HIERARCHY") === 1) {
				//get the default variant and fire select the default variant only when the metadata is loaded. Loads filter of the table only when the metadata is loaded
				this.getOwnerComponent().oWhenMetadataIsLoaded.then(fnGetDefaultVariants, fnGetDefaultVariants);
			} else {
				fnGetDefaultVariants();
			}
		},

		/**
		 * Open userid dialog for sharing variant
		 * @private
		 * @param {string} oEvent - Event parameter of user field
		 */
		_filterUserHelpRequest: function(oEvent) {
			var sEntityName = "USER_NAME",
				sEntitySet = this.config.paths.useridEntity;

			this.oValueHelpDialog = new ValueHelpDialog({
				title: sEntityName,
				supportMultiselect: true,
				supportRanges: false,
				supportRangesOnly: false,
				key: sEntityName,
				descriptionKey: sEntityName,
				fieldID: sEntityName,
				tokenDisplayBehaviour: "DescriptionOnly",
				entitySet: sEntitySet,
				columnType: 11,
				ok: function(oEvent) {
					this.aTokens = oEvent.getParameter("tokens");
					this.sourceField.setTokens(this.aTokens)
					this.close();
				},
				cancel: function(oEvent) {
					this.close();
				},
				afterClose: function() {
					this.destroy();
				},
				beforeOpen: function() {
					var oTokenizer = this._oTokenizerGrid.getAggregation("content")[0].getAggregation("content")[1].getAggregation("content")[0];
					oTokenizer.attachTokenChange(function(oTokenEvent) {
						var sActionType = oTokenEvent.getParameter("type");
						var oValueHelpDialog = this.getParent().getParent().getParent().getParent().getParent();
						var oTable = this.getParent().getParent().getParent().getParent().getParent().getTable();
						var oTableBinding = this.getParent().getParent().getParent().getParent().getParent().getTable().getBinding("rows");

						if (sActionType === "removed") {
							var sSelValue = oTokenEvent.getParameter("token").getText();
							for (var i1 = 0; i1 < oTableBinding.aKeys.length; i1++) {
								if (oTableBinding.oModel.getProperty("/" + oTableBinding.aKeys[i1])[oValueHelpDialog.getKey()]) {
									if (sSelValue.toString() === oTableBinding.oModel.getProperty("/" + oTableBinding.aKeys[i1])[oValueHelpDialog.getKey()].toString()) {
										oTable.removeSelectionInterval(i1, i1);
										break;
									}
								}
							}
						}
					});
				}
			});

			this._setSearchHelpColumns(sEntityName, sEntityName, 11, this.oValueHelpDialog);

			this.oValueHelpDialog.sourceField = oEvent.getSource();

			var aTokens = oEvent.getSource().getTokens();
			this.oValueHelpDialog.setTokens(aTokens);

			// 			var sServiceUrl = [this.getOwnerComponent().getMetadata().getConfig().serviceUrl, this.config.paths.variantService].join("");

			// 			var oModel = new ODataModel(sServiceUrl, true);
			// 				oModel.setDefaultCountMode(CountMode.Inline);

			// 			var oColModel = new JSONModel()
			// 				oColModel.setData({
			// 					cols : [{
			// 						label : sEntityName,
			// 						template : sEntityName
			// 					}]
			// 				});

			// 			var oValueHelpDialogTable = this.oValueHelpDialog.getTable();
			// 				oValueHelpDialogTable.setEnableBusyIndicator(true);
			// 				oValueHelpDialogTable.setModel(oColModel, "columns");
			// 				this.oValueHelpDialog.setModel(oModel);

			// 				oValueHelpDialogTable.bindRows({
			// 	        		path: sEntitySet,
			// 	        		parameters: {
			// 	        			select: sEntityName
			// 	        		},
			// 	        		events: {
			// 	        			change: function(oEvent) {
			// 	        				this.oValueHelpDialog.updateTable();
			// 	        			}.bind(this)
			// 	        		}
			// 	        	});



			// 			this.attachRequestsForControlBusyIndicator(oModel, oValueHelpDialogTable);
			this._setSearchHelpData(this.getModel(this.config.paths.variantData), sEntityName, this.oValueHelpDialog, sEntitySet);
			this.oValueHelpDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this.oValueHelpDialog.open();

		},

		/**
		 * Clear fields on filterbar
		 * @private
		 * @param {object} oEvent - Event handler for element
		 * @param {string} sTableID - ID of the table element
		 */
		_clearFilterBar: function(oEvent, sTableID) {
			var oEventBus = this.getEventBus(),
				sHash = HashChanger.getInstance().getHash(),
				aMainSorters = [];

			this._clearFilterItems(oEvent);

			aMainSorters = this._getTableSorters(oEvent);

			//reset hierarchial filter model
			this._resetHierarchyFilterModel();

			// Remove all filters from table
			oEventBus.publish("TableController", "RemoveFilters", {
				ID: sTableID,
				hash: sHash,
				mainSorters: aMainSorters
			});
		},


		_clearFilterItems: function(oEvent) {
			var aFields = oEvent ? oEvent.getParameter("selectionSet") : this._retrieveFilterFields();

			for (var iField = 0; iField < aFields.length; iField++) {
				var oField = aFields[iField];

				// Clear value for date fields
				if (typeof oField.setDateValue !== "undefined") {
					oField.setDateValue();
					if (typeof oField.setSecondDateValue !== "undefined") {
						oField.setSecondDateValue();
					}
				}
				// Clear for Single Select ComboBox filter
				if (typeof oField.setSelectedKey !== "undefined") {
					oField.setSelectedKey();
				}
				// Clear for Multi Select ComboBox filter
				if (typeof oField.setSelectedKeys !== "undefined") {
					oField.setSelectedKeys();
				}

				// Clear value for other fields
				oField.setValue("");

				// Remove all tokens
				if (typeof oField.removeAllTokens !== "undefined") {
					oField.removeAllTokens();
				}
			}

			this.getModel("view").setProperty("/aMainFilters", undefined);
		},

		/**
		 * Search table based on filter values
		 * @private
		 * @param {object} oEvent - Event handler for element
		 * @param {string} sTableID - ID of the table element
		 */
		_searchTable: function(oEvent, sTableID) {
			var oEventBus = this.getEventBus(),
				aFields = oEvent.getParameter("selectionSet") !== undefined ? oEvent.getParameter("selectionSet") : this._retrieveFilterFields(oEvent),
				aMainFilters = [],
				aMainSorters = [],
				sEvent,
				sHash = HashChanger.getInstance().getHash();

			// Loop through fields and assign filters
			aMainFilters = this._retrieveFilters(aFields);
			// Check if filters exists
			aMainFilters = aMainFilters.aFilters ? aMainFilters : undefined;
			var bValid = this._checkFilterParamsLength(aMainFilters);
			if (!bValid) {
				return;
			}
			//set sorters
			aMainSorters = this._getTableSorters(oEvent);

			sEvent = aMainFilters ? "SetupFilters" : "RemoveFilters";

			this.getModel("view").setProperty("/aMainFilters", aMainFilters);

			// Setup filters, if there are any
			oEventBus.publish("TableController", sEvent, {
				ID: sTableID,
				mainFilters: aMainFilters,
				mainSorters: aMainSorters,
				hash: sHash
			});
		},
		
		/**
		 * Method to validate filters query length for filtering table
		 * @param {Array} aMainFilters - array of filters
		 * @returns {Boolean} true/false - check if valid length in filter query
		 * @private
		 */
		_checkFilterParamsLength : function (aMainFilters) {
			if (!aMainFilters || aMainFilters.length === 0) {
				return true;
			}
			var oMainConfig = this.getComponentModel("mainConfig");
			var oMetadata = this.getComponentModel().oMetadata;
			var sResolvedPath = oMainConfig.getProperty("/ENTITY_NAME");
			var oEntitySet = oMetadata._getEntityTypeByPath(sResolvedPath);
			var sFilterParams = sap.ui.model.odata.ODataUtils.createFilterParams([aMainFilters], oMetadata, oEntitySet);
			
			if (sFilterParams.length > 2000) {
				var sMessage = this.getResourceBundle().getText("message.filterLength");
				var mOptions = {
					actions: [MessageBox.Action.OK],
					icon: MessageBox.Icon.ERROR,
					title: "Error"
				};
				this._showMessage(sMessage, mOptions);
				
				return false;
			}else {
				return true;
			}
		},

		/**
		 * Method to get the columns which are filter type "Hierarchy" and get the data for those columns
		 * @param {String} sColumn - Column name of the current hierarchy dialog opened
		 * @private
		 */
		_readHierarchyTypeColumnsData: function(sColumn) {
			var aFields = this._retrieveFilterFields();
			//remove the field which is currently opened i.e, ignore the filter applied for the opened hierarchy dialog
			jQuery.each(aFields, function(i, oField) {
				if (oField && oField.getName() === sColumn) {
					aFields.splice(i, 1);
				}
			});
			var aFilters = this._retrieveFilters(aFields);

			if (aFilters.aFilters) {
				//read request for the main odata service with the filters applied from filter bar to get the hierarchy enabled columns data
				models.requestData(
					this.getComponentModel(),
					this.getEntityName(),
					sColumn,
					this._handleReadSuccess.bind(this),
					this._handleReadError.bind(this),
					false,
					aFilters && aFilters.aFilters ? [aFilters] : undefined);
			} else {
				if (this.getModel("HierarchyFilterModel" + sColumn)) {
					this.getModel("HierarchyFilterModel" + sColumn).setProperty("/aHierarchyNodes", []);
				}
			}
		},

		/**
		 * success handler for read of main odata service for selected hierarchy enabled columns
		 * on success oData results which are actually the leaf of the hierarchy will be used to compare with the hierarchial data
		 * @param {object} oData - data received on success of odata read request
		 * @param {object} response - response messages on success of odata read request
		 * @private
		 */
		_handleReadSuccess: function(oData, response) {
			var aData = oData.results;
			if (aData.length > 0) {
				this._filterHierarchyValueHelp(aData);
			}
		},

		/**
		 * Error handler for read of main odata service for selected hierarchy enabled columns
		 * @param {object} oError - data received on success of odata read request
		 * @private
		 */
		_handleReadError: function(oError) {
			jQuery.sap.log.error(oError);
		},

		/**
		 * compare values received with the hierarchial data to get the values to prepare the dependent filter
		 * @param {object} aData - array of data received on success of read request
		 * @private
		 */
		_filterHierarchyValueHelp: function(aData) {
			var sColumn = this._sOpenedHierarchyTechName,
				oModel = this.getComponentModel(),
				oFilterModel = new JSONModel(),
				aFilters = [];

			//prepare filters for the hierarchy leaf results received from main odata service.
			jQuery.each(aData, function(iIndex, oObj) {
				aFilters.push(new Filter("RESULT_NODE_NAME", FilterOperator.EQ, oObj[sColumn]));
			});
			//also add a filter to get only the leaf with value 1
			aFilters.push(new Filter("IS_LEAF", FilterOperator.EQ, 1));

			var aHierarchyNodes = [];
			oModel.read(this._sHierarchyFilterDataPath, {
				filters: aFilters,
				success: function(oHierarchyData) {
					var aHierachyData = oHierarchyData.results;
					if (aHierachyData.length > 0) {
						jQuery.each(aHierachyData, function(j, oHierarchy) {
							//use the path to determine the parent and child nodes
							//split by "/" from PATH to get the hierarchy structure
							var sPath = oHierarchy.PATH;
							var aNodes = sPath.split("/");
							var iLevel = oHierarchy.LEVEL; //level at which the leaf is matched
							var sLeaf = oHierarchy.RESULT_NODE; //leaf level result node

							for (var k = 0; k < aNodes.length; k++) {
								var iChildIndex; //prepare the pointer for the child node, where i is the parent node pointer and current level
								if (iLevel > k + 1) {
									iChildIndex = k + 1;
								} else {
									iChildIndex = iLevel; //child node pointer cannot exceed the level of the leaf
								}
								//for level level node take the value from oData1 to be more accurate.
								if (iChildIndex === iLevel) {
									aNodes[iChildIndex] = sLeaf;
								}
								//array containing level, parent node and child node
								aHierarchyNodes.push({
									level: k,
									node: aNodes[k],
									child: aNodes[iChildIndex]
								});
							}
						});
					}

					oFilterModel.setProperty("/aHierarchyNodes", aHierarchyNodes);
					//check if the model already exist else set the model with data.
					if (this.getModel("HierarchyFilterModel" + sColumn)) {
						this.getModel("HierarchyFilterModel" + sColumn).setProperty("/aHierarchyNodes", aHierarchyNodes);
					} else {
						this.setModel(oFilterModel, "HierarchyFilterModel" + sColumn);
					}

				}.bind(this)
			});
			//},this));
		},

		/**
		 * method to get the columns with filter type hierarchy
		 * @returns {object} aHierarchyColumns - array of columns with hierarchy type filter
		 * @private
		 */
		_getHierarchyTypeColumns: function() {
			var aHierarchyColumns = [];
			$.grep(this.getModel("mainConfig").getProperty("/ServiceColumns/results"), function(oObject) {
				if (oObject.FILTERTYPE === "Hierarchy") {
					aHierarchyColumns.push(oObject.COLUMN);
				}
			});
			return aHierarchyColumns;
		},

		/**
		 * method to reset hierarchy filter model properties to reset the properties in the model
		 * @private
		 */
		_resetHierarchyFilterModel: function() {
			var aColumns = this._getHierarchyTypeColumns();

			jQuery.grep(aColumns, jQuery.proxy(function(oObject) {
				if (this.getModel("HierarchyFilterModel" + oObject)) {
					this.getModel("HierarchyFilterModel" + oObject).setProperty("/aHierarchyNodes", []);
				}
			}, this));
		},

		/**
		 * Retrieve sorters from table
		 * @private
		 * @param {object} oEvent - Event handler for filter bar
		 * @returns {object} aMainSorters - array of sorters from table
		 */
		_getTableSorters: function(oEvent) {
			if (oEvent === undefined) {
				return;
			}
			var aMainSorters = [];
			var aPageContents = oEvent.getSource().getParent().getParent().getContent();
			var oIconTabs = [];

			for (var k = 0; k < aPageContents.length; k++) {
				if (aPageContents[k].getMetadata()._sClassName === "sap.m.IconTabBar") {
					oIconTabs = aPageContents[k].getItems();

					for (var t = 0; t < oIconTabs.length; t++) {
						if (oIconTabs[t].getKey() === "Table" && oIconTabs[t].getVisible()) {
							if (oIconTabs[t].getContent().length > 0) {
								var oTableTab = oIconTabs[t].getContent()[0];
								var oTable = oTableTab.getAggregation("content")[0];
								if (oTable.getBinding("rows")) {
									aMainSorters = oTable.getBinding("rows").aSorters;
								}
								break;
							} else {
								var oConfigColumns = this.getComponentModel("mainConfig").getProperty("/ServiceColumns/results");
								//get columns with their sort.
								var aColumns = $.grep(oConfigColumns, jQuery.proxy(this.readDefaultSortedColumns));

								for (var c = 0; c < aColumns.length; c++) {
									var iColumnSorting = aColumns[c].COLUMN_SORTING;
									var bDesc;
									if (iColumnSorting === 1) {
										bDesc = false;
									} else if (iColumnSorting === 2) {
										bDesc = true;
									} else {
										bDesc = undefined;
									}

									aMainSorters.push(
										new sap.ui.model.Sorter(
											aColumns[c].COLUMN,
											bDesc,
											false)
									);
								}
								break;
							}
						}
					}
				}
			}

			return aMainSorters.length === 0 ? undefined : aMainSorters;
		},

		/**
		 *method to read the columns and return the columns that are sort enabled.
		 *@returns {object} oColumn - sort enabled column
		 *@private
		 */
		readDefaultSortedColumns: function(oColumn) {
			var iColumnSorting = oColumn["COLUMN_SORTING"];
			//see COLUMN_SORTING property of the model to check if sorting enabled for that column or not
			//1 or 2 for COLUMN_SORTING is enabled else disabled
			if (iColumnSorting === 1 || iColumnSorting === 2) {
				return oColumn;
			}
		},

		/**
		 * Retrieve input fields array
		 * @private
		 * @param {object} oEvent - Event handler for filter bar
		 * @returns {object} Array of possible input fields
		 */
		_retrieveFilterFields: function(oEvent) {
			var aResult = [],
				oFilterBar = this.byId(this.config.ui.elements.filterbar);
			for (var iFilterFieldCount in oFilterBar.getAggregation("content")[1].getAggregation("content")) {
				aResult.push(oFilterBar.getAggregation("content")[1].getAggregation("content")[iFilterFieldCount].getAggregation("content")[1]);
			}
			return aResult;
		},

		/**
		 * Collect filter parameters from hierarchy filters when Tree table data based on Odata service
		 * @param {sap.m.(Input/MultiInput/DatePicker/DateRangeSelection/ComboBox/MultiComboBox)} oField - Filter control
		 * @param {array} aFilters - array for collecting filter parameters
		 * @returns {void}
		 */
		_getOdataHierarchyTokens: function(oField, aFilters) {
			oField.getTokens().map(function(oToken) {
				aFilters.push(new Filter("LEAF_NAME", FilterOperator.EQ, oToken.getText()));
			});
		},

		/**
		 * Retrieve all filters setup in filterbar
		 * @private
		 * @param {array} aFields - List of all filterbar fields
		 * @returns {array} list of all filters
		 */
		_retrieveFilters: function(aFields) {
			var aFilters = [],
				aMainFilters = [],
				bOperator = false,
				oDateFormat = formatter.getDateTimeInstance("yyyyMMdd"),
				// Additional Emd.DateTime pattern
				oEmdDateFormat = formatter.getDateTimeInstance("yyyy-MM-ddTHH:mm:SS"),
				oObjectType;
			//oEmdDateFormat = formatter.getDateTimeInstance("dd.mm.yyyy");
			for (var iFields = 0; iFields < aFields.length; iFields++) {
				if (aFields[iFields].data("type") === "Hierarchy" && this.getModel("mainConfig").getProperty("/ODATA_SRV") && this.getModel("mainConfig").getProperty("/IS_HIERARCHY")) {
					this._getOdataHierarchyTokens(aFields[iFields], aFilters);
				} else if (typeof aFields[iFields].getDateValue !== "undefined" && aFields[iFields].getDateValue() !== null) { // Apply filters for dates
					var oObject = this._retreiveColumnModelObject(aFields[iFields].getProperty("name"))[0];
					if (!(oObject.CTYPE >= 20 && oObject.CTYPE <= 21)) {
						aFilters.push(new Filter(
							aFields[iFields].getProperty("name"),
							(aFields[iFields].getSecondDateValue &&
								aFields[iFields].getSecondDateValue()) ? FilterOperator.BT : FilterOperator.EQ,
							oDateFormat.format(aFields[iFields].getDateValue()),
							(aFields[iFields].getSecondDateValue &&
								aFields[iFields].getSecondDateValue()) ? oDateFormat.format(aFields[iFields].getSecondDateValue()) : undefined
						));
					}
					// Additional filter for Emd.DateTime format
					aFilters.push(new Filter(
						aFields[iFields].getProperty("name"),
						(aFields[iFields].getSecondDateValue && aFields[iFields].getSecondDateValue()) ? FilterOperator.BT : FilterOperator.EQ,
						oEmdDateFormat.format(aFields[iFields].getDateValue()),
						(aFields[iFields].getSecondDateValue && aFields[iFields].getSecondDateValue()) ? oEmdDateFormat.format(aFields[iFields].getSecondDateValue()) : undefined
					));
					bOperator = false;
				} else if (typeof aFields[iFields].getSelectedKey !== "undefined" && aFields[iFields].getSelectedKey() !== "") { // Apply filters for Single Select ComboBox
					var sTechName = aFields[iFields].getName();
					var oModel = this.getModel(sTechName);
					//var oData = aFields[iFields].getSelectedItem().getBindingContext(sTechName).getObject();
					var oFieldProperties = {
						Column: aFields[iFields].getName(),
						Operator: FilterOperator.EQ,
						Option1: aFields[iFields].getSelectedKey(),
						Option2: ""
					}
					var oData = aFields[iFields].getSelectedItem() ? aFields[iFields].getSelectedItem().getBindingContext(sTechName).getObject() : oFieldProperties;

					var mFilterParams = {
						path: oData.Column,
						operator: oData.Operator,
						value1: oData.Option1,
						value2: oData.Option2
					};

					aFilters.push(new Filter(mFilterParams));
					bOperator = false;
				} else if (typeof aFields[iFields].getSelectedKeys !== "undefined" && aFields[iFields].getSelectedKeys().length > 0) { // Apply filters for Multi Select ComboBox
					var sTechName = aFields[iFields].getName();
					var oModel = this.getModel(sTechName);
					var aSelectedItems = aFields[iFields].getSelectedItems();
					var aSelectedKeys = aFields[iFields].getSelectedKeys();
					if (aSelectedItems.length > 0) {
						for (var i = 0; i < aSelectedItems.length; i++) {
							if (oModel) {
								var oData = aSelectedItems[i].getBindingContext(sTechName).getObject();
								var mFilterParams = {
									path: oData.Column,
									operator: oData.Operator,
									value1: oData.Option1,
									value2: oData.Option2
								};
								aFilters.push(new Filter(mFilterParams));
								bOperator = false;
							} else {
								var mFilterParams = {
									path: aFields[iFields].getProperty("name"),
									operator: (aFields[iFields].getAggregation("customData")[0] &&
										aFields[iFields].getAggregation("customData")[0].getValue() === "number") ? FilterOperator.EQ : FilterOperator.Contains, // Contains for string fields, EQ for numeric
									value1: aSelectedItems[i].getText()
								};
								aFilters.push(new Filter(mFilterParams));
								bOperator = false;
							}
						}
					} else if (aSelectedKeys.length > 0) {
						for (var j = 0; j < aSelectedKeys.length; j++) {
							var mFilterParams = {
								path: aFields[iFields].getProperty("name"),
								operator: FilterOperator.EQ,
								value1: aSelectedKeys[j]
							};
							aFilters.push(new Filter(mFilterParams));
							bOperator = false;
						}
					}

				} else if (aFields[iFields].getValue() !== "") { // Apply filters for other fields
					aFilters.push(new Filter(
						aFields[iFields].getProperty("name"),
						(aFields[iFields].getAggregation("customData")[0] &&
							aFields[iFields].getAggregation("customData")[0].getValue() === "number") ? FilterOperator.EQ : FilterOperator.Contains, // Contains for string fields, EQ for numeric
						aFields[iFields].getValue()
					));
					bOperator = false;
				}
				if (typeof aFields[iFields].getTokens !== "undefined" && aFields[iFields].getTokens().length > 0) { // Apply filter if value comes from tokenizer
					var bHierarchy = aFields[iFields].getCustomData()[0].getValue() === "Hierarchy";
					oObjectType = this._retreiveColumnModelObject(aFields[iFields].getProperty("name"))[0];
					for (var iTokens = 0; iTokens < aFields[iFields].getTokens().length; iTokens++) {
						if (bHierarchy) {
							aFilters.push(new Filter(
								aFields[iFields].getProperty("name"),
								FilterOperator.EQ,
								aFields[iFields].getTokens()[iTokens].getText()
							));
							bOperator = false;
						} else if (typeof aFields[iFields].getTokens()[iTokens].getAggregation("customData")[0].getProperty("value").operation === "undefined") { // Search help used
							aFilters.push(new Filter(
								aFields[iFields].getProperty("name"),
								FilterOperator.EQ,
								aFields[iFields].getTokens()[iTokens].getKey() === "" ? null : aFields[iFields].getTokens()[iTokens].getKey()
							));
							bOperator = false;
						} else { // Exclude/Include used
							if (oObjectType.CTYPE === 11) {
								aFilters.push(new Filter(
									"tolower(" + aFields[iFields].getProperty("name") + ")",
									aFields[iFields].getTokens()[iTokens].getAggregation("customData")[0].getProperty("value").exclude ? FilterOperator.NE : aFields[iFields].getTokens()[iTokens].getAggregation("customData")[0].getProperty("value").operation,
									"tolower('" + aFields[iFields].getTokens()[iTokens].getAggregation("customData")[0].getProperty("value").value1 + "')",
									"tolower('" + aFields[iFields].getTokens()[iTokens].getAggregation("customData")[0].getProperty("value").value2 + "')"
								));
							} else {
								aFilters.push(new Filter(
									aFields[iFields].getProperty("name"),
									aFields[iFields].getTokens()[iTokens].getAggregation("customData")[0].getProperty("value").exclude ? FilterOperator.NE : aFields[iFields].getTokens()[iTokens].getAggregation("customData")[0].getProperty("value").operation,
									aFields[iFields].getTokens()[iTokens].getAggregation("customData")[0].getProperty("value").value1,
									aFields[iFields].getTokens()[iTokens].getAggregation("customData")[0].getProperty("value").value2
								));
							}
							bOperator = false;
							//bOperator = true;
						}
					}
				}

				// Insert filters if any exists
				if (aFilters.length > 0) {
					aMainFilters.push(new Filter(
						aFilters, // Inner Filters
						bOperator // AND/OR condition
					));
				}

				// Clear filters
				aFilters = [];
			}
			// Create filter for search if they exsists
			if (aMainFilters.length > 0) {
				aMainFilters = new Filter(
					aMainFilters, // All filters
					true // AND condition
				);
			}
			return aMainFilters;
		},


		/**
		 * Retreives column object by selected key
		 * @private
		 */
		_retreiveColumnModelObject: function(sKey) {
			return $.grep(this.getModel("mainConfig").getProperty("/ServiceColumns/results"), function(oObject) {
				return oObject.COLUMN === sKey;
			});
		},

		/**
		 * Retrieves and globalizes table type
		 * @private
		 */
		_retrieveTableType: function() {
			var bHierarchy = !!this.getComponentModel("mainConfig").getData().IS_HIERARCHY;
			this._tableViewerTableType = (bHierarchy) ? this.config.tableTypes.treeTable : this.config.tableTypes.table;
		},

		_filterItemsFactory: function(sId, oContext) {
			var oUIControl = null,
				bVisibleInFilterBar = oContext.getProperty("ONFILTERBAR") === 1,
				sFilterLabel = oContext.getProperty("LABEL"),
				sFilterId = oContext.getProperty("COLUMN"),
				bShowInFilters = oContext.getProperty("FILTER") === 1,
				sFilterType = oContext.getProperty("FILTERTYPE");

			oUIControl = new FilterItem(sId, {
				label: sFilterLabel,
				visibleInFilterBar: bVisibleInFilterBar,
				name: sFilterId,
				visible: bShowInFilters,
				control: this._createFieldByType(oContext.getProperty("CTYPE"), sFilterId, oContext, sFilterType)
			});

			return oUIControl;
		},

		_createComboBoxControl: function(sFilterId, sFilterType) {
			var sFilterPath = "staticFilters/" + sFilterId + ".xsodata";
			var sServiceUrl = [this.getOwnerComponent().getMetadata().getConfig().serviceUrl, sFilterPath].join("");

			var oModel = new ODataModel(sServiceUrl, true);
			oModel.setDefaultCountMode(CountMode.Inline);

			this.setModel(oModel, sFilterId);

			var sData = sFilterId + ">/data";
			var sValue = "{" + sFilterId + ">Value}";

			var oItemTemplate = new Item({
				key: sValue,
				text: sValue
			});

			var mControlParams = {
				name: sFilterId,
				items: {
					path: sData,
					sorter: new Sorter("Id"),
					template: oItemTemplate
				}
			};

			switch (sFilterType) {
				case "StaticSingleSelect":
					mControlParams["selectionChange"] = this._pressFilterBarGoButton.bind(this);
					return new ComboBox(mControlParams);

				case "StaticMultiSelect":
					mControlParams["selectionFinish"] = this._pressFilterBarGoButton.bind(this);
					return new MultiComboBox(mControlParams);

				default:
					break;
			}
		},

		_pressFilterBarGoButton: function() {
			var oFilterBar = this.byId(this.config.ui.elements.filterbar);
			oFilterBar.fireSearch();
		},

		_onDateChangeFilter: function(oEvent) {
			if (oEvent.getParameter("valid")) {
				this.byId(this.config.ui.elements.filterbar).fireSearch();
			}
		},

		/**
		 * Create fields by their types
		 * @private
		 * @param {integer} iColumnType - Column Type
		 * @param {string} sFilterId - Filter ID
		 * @returns {object} Element which will be used for filter field content
		 */
		_createFieldByType: function(iColumnType, sFilterId, oContext, sFilterType) {
			var oFilterFieldContent;
			var sCustomDataType = iColumnType === 3 || iColumnType === 7 ? "number" : "string";
			// Create filter field content based on field type
			switch (sFilterType) {
				case "MultiInput":
					oFilterFieldContent = this._createMultiInputControl(sFilterId, oContext, sCustomDataType);
					break;
				case "DateRangeSelection":
					oFilterFieldContent = new DateRangeSelection({
						name: sFilterId,
						delimiter: '-',
						change: this._onDateChangeFilter.bind(this)
					});
					break;
				case "DatePicker":
					oFilterFieldContent = new DatePicker({
						name: sFilterId,
						change: this._onDateChangeFilter.bind(this)
					});
					break;
				case "MultiComboBox":
					oFilterFieldContent = this._createMultiComboBox(sFilterId, sCustomDataType);
					break;
				case "Input":
					oFilterFieldContent = this._createInputControl(sFilterId, sCustomDataType);
					break;
				case "InputInteger":
					oFilterFieldContent = this._createInputIntegerControl(sFilterId, sCustomDataType);
					break;
				case "StaticSingleSelect":
					oFilterFieldContent = this._createComboBoxControl(sFilterId, sFilterType);
					break;
				case "StaticMultiSelect":
					oFilterFieldContent = this._createComboBoxControl(sFilterId, sFilterType);
					break;
					// Static Filter with Value Help Dialog
				case "StaticMultiValueHelp":
					oFilterFieldContent = this._createStaticMultiInputControl(sFilterId, oContext, sCustomDataType);
					break;
				case "Hierarchy":
					oFilterFieldContent = this._createHierarchyFilter(sFilterId, oContext, sCustomDataType);
					break;
				default:
					// Create Multi Input Control
					oFilterFieldContent = this._createMultiInputControl(sFilterId, oContext, sCustomDataType);
					break;
			}

			return oFilterFieldContent;

		},

		_createHierarchyFilter: function(sFilterId, oContext, sTypeValue) {
			return new MultiInput({
				showValueHelp: true,
				name: sFilterId,
				valueHelpRequest: this._openHierarchyDialog.bind.apply(this._openHierarchyDialog, [this].concat([this]))
			}).data("type", "Hierarchy");
		},

		_openHierarchyDialog: function(oController, oEvent) {
			this._sOpenedHierarchyTechName = oEvent.getSource().getName();
			
		    var oMainConfigModel = this.getModel(this.config.paths.mainConfig);
			if (oMainConfigModel.getProperty("/INPUT_PARAMETERS")) {
			    var aPath = this.getEntityName().split("/");
			    aPath[1] = "FilterParams" + aPath[1].substr(aPath[1].indexOf("("));
			    aPath[2] = "HierarchyData_" + this._sOpenedHierarchyTechName;
			    this._sHierarchyFilterDataPath = aPath.join("/");
			} else {
			    this._sHierarchyFilterDataPath = "/HierarchyData_" + this._sOpenedHierarchyTechName;
			}

			var oHierarchyDialog = this.byId(this._sOpenedHierarchyTechName + "--siemensUiHierarchyDialog");

			//Check if fragment already exist
			if (!oHierarchyDialog) {
				// associate controller with the fragment
				oHierarchyDialog = sap.ui.xmlfragment(this.createId(this._sOpenedHierarchyTechName), "com.siemens.tableViewer/view/tabs/fragments/HierarchyDialog", this);
				this.getView().addDependent(oHierarchyDialog);

				// toggle compact style
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oHierarchyDialog);

				var oColumnProperties = this._retreiveColumnModelObject(this._sOpenedHierarchyTechName)[0];

				// set Dialog column label
				var oDialogModel = new JSONModel({
					columnLabel: oColumnProperties.LABEL
				});
				oHierarchyDialog.setModel(oDialogModel, "hierarchyDialog");

			}
			// set additional json data model to store received data
			var oAdditionalJsonDataModel = new JSONModel({});

			// get oData model
			var oModel = this.getModel();

			var oTable = oHierarchyDialog.getContent()[0].getContent()[0];

			this.attachRequestsForControlBusyIndicator(oModel, oTable);

			oModel.read(this._sHierarchyFilterDataPath, {
				filters: [new Filter("LEVEL", FilterOperator.EQ, 0)], // get 0 level of hierarchy
				success: function(oData) {
					for (var i = 0; i < oData.results.length; i++) {
						oData.results[i] = this._handleHierarchyOdataResultObject(oData.results[i], "Unchecked");
					}

					oAdditionalJsonDataModel.setData(oData.results);
					oTable.bindRows("/");
				}.bind(this)
			});

			oTable.setModel(oModel, "hierarchyOData");
			oTable.setModel(oAdditionalJsonDataModel);

			oHierarchyDialog.open();
		},

		_handleHierarchyOdataResultObject: function(oObject, sCheckedStatus) {
			delete oObject.__metadata;
			oObject["checked"] = sCheckedStatus;

			if (oObject.CHILDREN) {

				var aChildrens = oObject.CHILDREN.split("],[");
				oObject["childs"] = [];

				for (var iChildIndex = 0; iChildIndex < aChildrens.length; iChildIndex++) {
					oObject["childs"].push({});
				}
			}

			return oObject;
		},

		onHierarchyDialogToogleState: function(oEvent) {
			var oObject = oEvent.getParameter("rowContext").getObject(),
				oModel = oEvent.getSource().getModel("hierarchyOData"),
				oAdditionalJsonDataModel = oEvent.getSource().getModel(),
				sCkechedStatus = oObject.checked;

			if (Object.keys(oObject.childs[0]).length !== 0) {
				return;
			}
			//Get the Pred nodes and child nodes from hierarchy filter model
			var oDependentFiltersModel = this.getModel("HierarchyFilterModel" + this._sOpenedHierarchyTechName),
				aHierarchyNodes, aFinalFilter = [];
			if (oDependentFiltersModel) {
				aHierarchyNodes = oDependentFiltersModel.getProperty("/aHierarchyNodes");
				//filter for a current level with pred and child nodes as filters
				aFinalFilter = this._preparePredChildFilters(aHierarchyNodes, oObject);
			} else {
				//default filter
				aFinalFilter = [new Filter("PRED_NODE", FilterOperator.EQ, oObject.RESULT_NODE)];
			}

			oModel.read(this._sHierarchyFilterDataPath, {
				filters: aFinalFilter, //apply filter with pred and child nodes as filter
				success: function(oData) {
					for (var i = 0; i < oData.results.length; i++) {
						oData.results[i] = this._handleHierarchyOdataResultObject(oData.results[i], sCkechedStatus);
						oObject.childs[i] = oData.results[i];
					}
					//delete any empty objects to avoid showing blank or empty entry in tree table.
					for (var j = 0; j < oObject.childs.length; j++) {
						if (Object.keys(oObject.childs[j]).length === 0) {
							delete oObject.childs[j];
						}
					}
					oAdditionalJsonDataModel.updateBindings();
				}.bind(this)
			});
		},

		/**
		 * Method to prepare Pred and Child filters and apply these filters for HerarchyData read request
		 * @param {Array} aHierarchyNodes - Array of Pred and child nodes
		 * @param {Object} oObject - current object selected from table
		 * @returns {Array} aFilters - Array of Pred filters and child filters
		 * @private
		 */
		_preparePredChildFilters: function(aHierarchyNodes, oObject) {
			var fnGetNodefromLevel, aInitialFilters = [],
				aLevelNodes = [],
				aLevelChild = [],
				iLevel = oObject.LEVEL,
				sQueryNode = oObject.QUERY_NODE,
				aUniqueNodeNames, aDistinctChild;
			if (aHierarchyNodes.length > 0) {

				//Get the parent and child node for the current level
				fnGetNodefromLevel = function(oObj) {
						//filter with current level and current query node to avoid unnecessary filters to be added from other levels and other pred and child nodes.
						if (oObj.level === iLevel && oObj.node === sQueryNode) {
							aLevelChild.push(oObj.child); //child nodes
						}
					}
					//array of hierarchial nodes with pred and child nodes
				aHierarchyNodes.filter(fnGetNodefromLevel);

				if (aLevelChild.length > 0) {
					//remove duplicates for child nodes
					aDistinctChild = aLevelChild.filter(function(o, i) {
						return aLevelChild.indexOf(o) == i;
					});

					//prepare filters for child nodes
					for (var k = 0; k < aDistinctChild.length; k++) {
						aInitialFilters.push(
							new Filter("RESULT_NODE", FilterOperator.EQ, aDistinctChild[k])
						);
					}
				} else {
					//if no nodes, then always take default filter
					aInitialFilters = [new Filter("PRED_NODE", FilterOperator.EQ, oObject.RESULT_NODE)];
				}
			} else {
				//if no nodes, then always take default filter
				aInitialFilters = [new Filter("PRED_NODE", FilterOperator.EQ, oObject.RESULT_NODE)];
			}
			return aInitialFilters;
		},

		onHierarchyDialogOk: function(oEvent) {
			var oDialog = oEvent.getSource().getParent().getParent();
			var oTable = oDialog.getContent()[0].getContent()[0];
			var oModel = oTable.getModel();
			var oData = oModel.getData();
			var oDataModel = oTable.getModel("hierarchyOData");
			var oFilterBar = this.byId(this.config.ui.elements.filterbar);

			var aLeafs = [];
			var aMissedLeafs = [];

			var getLeafs = function(oObjects) {
				// Check if object selected
				//if (oObjects.checked === "Mixed" || oObjects.checked === "Checked") {
				//get only the object which is valid and other valid properties
				if (oObjects && (oObjects.checked === "Mixed" || oObjects.checked === "Checked")) {
					// Check if object is leaf
					if (oObjects.IS_LEAF === 0) {
						// Check if childs loaded
						if (Object.keys(oObjects.childs[0]).length === 0) {
							aMissedLeafs.push(new Filter("PATH", FilterOperator.Contains, oObjects.PATH));
						} else {
							for (var iChildObject = 0; iChildObject < oObjects.childs.length; iChildObject++) {
								getLeafs(oObjects.childs[iChildObject]); //recursively
							}
						}
					} else {
						aLeafs.push(new sap.m.Token({
							text: oObjects.RESULT_NODE_NAME
						}).data("path", oObjects.PATH));
					}
				}
			};

			// Check hierarchy for data
			for (var iODataObject = 0; iODataObject < oData.length; iODataObject++) {
				getLeafs(oData[iODataObject]);
			}
			//var oControl = oFilterBar.determineControlByName("ARE_LONG");
			var oControl = oFilterBar.determineControlByName(this._sOpenedHierarchyTechName);
			// Get missed leaf data from backend
			if (aMissedLeafs.length > 0) {
				var aFilters = [new Filter(aMissedLeafs, false), new Filter("IS_LEAF", FilterOperator.EQ, 1)];

				oDataModel.read(this._sHierarchyFilterDataPath, {
					filters: [new Filter(aFilters, true)],
					success: function(oData) {
						for (var iResult = 0; iResult < oData.results.length; iResult++) {
							aLeafs.push(new sap.m.Token({
								text: oData.results[iResult].RESULT_NODE_NAME
							}).data("path", oData.results[iResult].PATH));
						}
						oControl.setTokens(aLeafs);
						oFilterBar.fireSearch();
						this.onHierarchyDialogCancel(oData.results[0].LEVEL_NAME);
					}.bind(this)
				});
			} else {
				oControl.setTokens(aLeafs);
				oFilterBar.fireSearch();
				this.onHierarchyDialogCancel(oEvent);
			}
		},

		onHierarchyDialogCancel: function(oEvent) {
			//var oDialog = typeof (oEvent) === "string" ? this.byId(oEvent + "--siemensUiHierarchyDialog") : oEvent.getSource().getParent().getParent();
			var oDialog = typeof(oEvent) === "string" ? this.byId(this._sOpenedHierarchyTechName + "--siemensUiHierarchyDialog") : oEvent.getSource().getParent().getParent();
			oDialog.close();
		},
		/**
		 * Event handler for on before close event of the dialog for hierarchy
		 * @param {sap.ui.base.Event} oEvent - event for on before close
		 * @public
		 */
		onBeforeHierarchyDialogClose: function(oEvent) {
			//collapse all the nodes so that new filter applied will be reflected when the nodes toggle
			var oTable = oEvent.getSource().getContent()[0].getContent()[0];
			oTable.collapseAll();
		},

		/**
		 * Event handler for on before open event of the dialog for hierarchy
		 * @param {sap.ui.base.Event} oEvent - event for on before open
		 * @public
		 */
		onBeforeHierarchyDialogOpen: function(oEvent) {
			var sHierarchyColumn = this._sOpenedHierarchyTechName;
			//setup filters for current hierarchy filter dialog
			this._readHierarchyTypeColumnsData(sHierarchyColumn);
		},

		onChangeTriStateCheckBoxes: function(oEvent) {
			var oNode = oEvent.getSource(),
				oBinding = oNode.getBindingContext(),
				sPath = oBinding.getPath(),
				sParentPath = sPath.substring(0, sPath.lastIndexOf('/childs')),
				oTable = oNode.getParent().getParent(),
				oObject = oBinding.getObject(),
				sParentObj;

			this._setChildState(oObject);

			while (sParentPath !== "") {
				sParentObj = oTable.getModel().getProperty(sParentPath);
				this._updateParent(sParentObj);
				sParentPath = sParentPath.substring(0, sParentPath.lastIndexOf('/childs'));
			}
		},

		_setChildState: function(oObject) {
			var sState = oObject.checked;
			//check for only valid object, ignore objects which are undefined
			if (oObject.childs) { //if condition added
				for (var iChildIndex = 0; iChildIndex < oObject.childs.length; iChildIndex++) {
					//for (var iChildIndex = 0; iChildIndex < Object.keys(oObject.childs).length; iChildIndex++) {
					if (Object.keys(oObject.childs[0]).length === 0) {
						return;
					} else {
						//take only the valid child, neglect the object which is undefined
						if (oObject.childs[iChildIndex]) { //if condition added is a change
							oObject.childs[iChildIndex].checked = sState;
							this._setChildState(oObject.childs[iChildIndex]); //recursively
						}
					}
				}
			}
		},

		_updateParent: function(oObject) {
			var iChecked = 0;
			var iUnchecked = 0;

			for (var iChildIndex = 0; iChildIndex < oObject.childs.length; iChildIndex++) {
				var oChild = oObject.childs[iChildIndex];
				//take only the valid child, neglect the object which is undefined
				if (oChild) { //if condition added is a change

					if (oChild.checked === 'Checked') {
						iChecked += 1;
					} else if (oChild.checked === 'Mixed') {
						iChecked += 1;
						iUnchecked += 1;
					} else {
						iUnchecked += 1;
					}
					if (iChecked > 0 && iUnchecked > 0) {
						oObject.checked = 'Mixed';
						return;
					}

					if (iChecked > 0) {
						oObject.checked = 'Checked';
					} else {
						oObject.checked = 'Unchecked';
					}
				}
			}
		},

		_createMultiComboBox: function(sFilterId, sTypeValue) {
			var oItemTemplate = new Item({
				key: "{" + sFilterId + "}",
				text: "{" + sFilterId + "}"
			});

			return new MultiComboBox({
				customData: {
					key: "type",
					value: sTypeValue
				},
				items: {
					path: this.getEntityName(),
					template: oItemTemplate,
					parameters: {
						select: sFilterId
					}
				},
				name: sFilterId,
				selectionFinish: this._pressFilterBarGoButton.bind(this)
			});
		},

		_createInputControl: function(sFilterId, sTypeValue) {
			return new Input({
				customData: {
					key: "type",
					value: sTypeValue
				},
				name: sFilterId
			});
		},

		_createInputIntegerControl: function(sFilterId, sTypeValue) {
			return new Input({
				type: "Number",
				customData: {
					key: "type",
					value: sTypeValue
				},
				name: sFilterId
			});
		},

		_createMultiInputControl: function(sFilterId, oContext, sTypeValue) {
			return new MultiInput({
				type: "Text",
				customData: {
					key: "type",
					value: sTypeValue
				},
				name: sFilterId,
				change: jQuery.proxy(this._onChangeMultiInput, this),
				showValueHelp: true,
				valueHelpRequest: [this._filterValueHelpRequest, this, oContext]
			});
		},

		/**
		 * Event is fired when value is changed by user interaction
		 * @param {sap.ui.base.Event} oEvent for MultiInput change.
		 * @public
		 */
		_onChangeMultiInput: function(oEvent) {
			var sFieldId = oEvent.getSource().getName(),
				oObject = {},
				oTempDate,
				oDate = oEvent.getSource().getValue(),
				d,
				aTokens = [];

			// get all tokens from the source
			aTokens = oEvent.getSource().getTokens();
			// get the ctype
			oObject = this._retreiveColumnModelObject(sFieldId)[0];
			// generate token and date conversion only incase of ctype 20
			if (oObject.CTYPE === 20) {
				// check for date format of DD.MM.YYYY
				if ((oDate.match(/(\d{1,2}).(\d{1,2}).(\d{4})$/)) === null) {
					return;
				}
				d = oDate.split(".");
				oTempDate = new Date(d[1] + " " + d[0] + " " + d[2] + " 12:00:00");
				oEvent.getSource().setValue("");
				aTokens.push(new Token({
					text: oDate.toString(),
					key: oTempDate.toString(),
					customData: [{
						key: "row",
						value: {
							sFieldId: oTempDate.toString()
						}
					}]
				}));
				oEvent.getSource().setTokens(aTokens);
			}
			if (oObject.CTYPE === 22){
                if ((oDate.match(/(2[0-3]|1[0-9]|0[0-9]|[^0-9][0-9]):([0-5][0-9]|[0-9]):([0-5][0-9]|[0-9][^0-9])$/)) === null) {
                    return;
                }
                d = oDate.split(":");
                oTempDate = "PT" + d[0] + "H" + d[1] + "M" + d[2] + "S";
                oEvent.getSource().setValue("");
                aTokens.push(new Token({
                    text: oDate,
                    key: oTempDate,
                    customData: [{
                        key: "row",
                        value: {
                            sFieldId: oTempDate
                        }
                    }]
                }));
                oEvent.getSource().setTokens(aTokens);
            }
            if (oObject.CTYPE === 17){

                if ((oDate.match(/([0][1-9]|[1][012]).((18|19|20|21)\d\d)$/)) === null) {
                    return;
                }
                d = oDate.split(".");
                oTempDate = d[1] + "" + d[0];

                oEvent.getSource().setValue("");
                aTokens.push(new Token({
                    text: oDate,
                    key: oTempDate,
                    customData: [{
                        key: "row",
                        value: {
                            sFieldId: oTempDate
                        }
                    }]
                }));

                oEvent.getSource().setTokens(aTokens);
            }
		},

		// Static Filter with Value Help Dialog
		_createStaticMultiInputControl: function(sFilterId, oContext, sTypeValue) {
			return new MultiInput({
				type: "Text",
				customData: {
					key: "type",
					value: sTypeValue
				},
				name: sFilterId,
				showValueHelp: true,
				valueHelpRequest: [this._filterStaticValueHelpRequest, this, oContext]
			});
		},

		/**
		 * Creates value help dialog
		 * @private
		 * @param {object} oEvent - Event handler for element
		 */
		_filterValueHelpRequest: function(oEvent) {
			var sFieldID = oEvent.getSource().getName();

			var aColumns = this.getModel("mainConfig").getProperty("/ServiceColumns/results");
			var oColumn = $.grep(aColumns, function(oItem) {
				return oItem.COLUMN === sFieldID;
			})[0];

			var sFieldText = oColumn["LABEL"];
			var sColumnType = oColumn["CTYPE"];
			var sEntitySet = "/" + this.getModel("mainConfig").getProperty("/ENTITY_NAME");

			var oValueHelpDialog = this._createValueHelpDialog(sFieldID, sFieldText, sEntitySet, sColumnType);

			var mFilters = [];

			// Filter the Value Help Dialog values accordingly to already selected filters
			var oFilters = this.getModel("view").getProperty("/aMainFilters");
			if (oFilters !== undefined) {
				for (var i = 0; i < oFilters.aFilters.length; i++) {
					for (var j = 0; j < oFilters.aFilters[i].aFilters.length; j++) {
						//if (sFieldID !== oFilters.aFilters[i].aFilters[j].sPath) {
						if (sFieldID !== oFilters.aFilters[i].aFilters[j].sPath && "tolower(" + sFieldID + ")" !== oFilters.aFilters[i].aFilters[j].sPath) {
							mFilters.push(oFilters.aFilters[i].aFilters[j]);
						}
					}
				}
			}

			this._setValueHelpTokens(oValueHelpDialog, oEvent);
			this._setSearchHelpColumns(sFieldID, sFieldText, sColumnType, oValueHelpDialog); // Set search help columns based on data
			this._setSearchHelpData(this.getModel(), sFieldID, oValueHelpDialog, sEntitySet, mFilters); // Set search help rows
			this._prepareRangeKeyFields(sFieldID, sFieldText, oValueHelpDialog); // Prepare range key selection

			oValueHelpDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());

			oValueHelpDialog.open();
		},


		// Static Filter with Value Help Dialog
		_filterStaticValueHelpRequest: function(oEvent) {
			var sFieldID = oEvent.getSource().getName();
			var oColumn = this._retreiveColumnModelObject(sFieldID)[0];
			var sFieldText = oColumn["LABEL"];
			var sColumnType = oColumn["CTYPE"];
			var sEntitySet = "/data";

			var oValueHelpDialog = this._createValueHelpDialog(sFieldID, sFieldText, sEntitySet, sColumnType);

			this._setValueHelpTokens(oValueHelpDialog, oEvent);
			this._setSearchHelpColumns(sFieldID, sFieldText, sColumnType, oValueHelpDialog);
			this._setStaticSearchHelpData(sFieldID, oValueHelpDialog, sEntitySet);
			this._prepareRangeKeyFields(sFieldID, sFieldText, oValueHelpDialog);

			oValueHelpDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());

			oValueHelpDialog.open();
		},

		_setStaticSearchHelpData: function(sFieldID, oValueHelpDialog, sEntitySet) {
			var oValueHelpDialogTable = oValueHelpDialog.getTable();

			if (!this.getModel(sFieldID)) {
				var sFilterPath = "staticFilters/" + sFieldID + ".xsodata";
				var sServiceUrl = [this.getOwnerComponent().getMetadata().getConfig().serviceUrl, sFilterPath].join("");

				var oModel = new ODataModel(sServiceUrl, true);
				oModel.setDefaultCountMode(CountMode.Inline);
				this.setModel(oModel, sFieldID);
			}

			oValueHelpDialog.setModel(this.getModel(sFieldID));
			oValueHelpDialogTable.bindRows({
				path: sEntitySet,
				parameters: {
					select: sFieldID
				},
				events: {
					change: function() {
						oValueHelpDialog.updateTable();
					}
				}
			});

			this.attachRequestsForControlBusyIndicator(this.getModel(sFieldID), oValueHelpDialogTable);
		},

		_createValueHelpDialog: function(sFieldID, sFieldText, sEntitySet, sColumnType) {
			var oFilterBar = this.byId("siemens.ui.filterbar"),
				that = this;

			return new ValueHelpDialog({
				title: sFieldText,
				// modal: true,
				supportMultiselect: true,
				supportRanges: true,
				supportRangesOnly: false,
				key: sFieldID,
				descriptionKey: sFieldID,
				fieldID: sFieldID,
				tokenDisplayBehaviour: "DescriptionOnly",
				entitySet: sEntitySet,
				columnType: sColumnType,
				ok: function(oControlEvent) {
					this.aTokens = oControlEvent.mParameters.tokens;
					var oObject = that._retreiveColumnModelObject(sFieldID)[0];
					if (oObject.CTYPE === 20) {
						var oDateFormat1 = formatter.getDateTimeInstance("dd.MM.yyyy"),
							aTempDate;
						for (var iLength = 0; iLength < this.aTokens.length; iLength++) {
							// changes to handle manual entry of datetime in MultiInput.
							// check if the mProperties has ata in required format else set the data from custom
							// data and skip the formatting step also check if it is a token
							// from include exclude condition, if yes then skip the formatting
							if (typeof this.aTokens[iLength].getAggregation("customData")[0].getProperty("value").operation === "undefined") {
								if (isNaN(new Date(this.aTokens[iLength].mProperties.text).getDate())) {
									if (typeof this.aTokens[iLength].mProperties === "object") {
										if (this.aTokens[0].getAggregation("customData").length > 0) {
											aTempDate = new Date(this.aTokens[iLength].getAggregation("customData")[1].getValue());
											aTempDate = oDateFormat1.format(aTempDate);
											this.aTokens[iLength].mProperties.text = aTempDate.toString();
											this.aTokens[iLength].mProperties.key = this.aTokens[iLength]
												.getAggregation("customData")[1].getValue();
										}
									}
								} else {
									// for token based selection, date formatting section
									aTempDate = new Date(this.aTokens[iLength].mProperties.text);
									aTempDate = oDateFormat1.format(aTempDate);
									this.aTokens[iLength].mProperties.text = aTempDate.toString();
								}
							} else {
								// convert the selected include exclude token of ctype 20 into date
								var oValue1 = this.aTokens[iLength].getAggregation("customData")[0].getProperty("value").value1,
									d1, oValue2 = this.aTokens[iLength]
									.getAggregation("customData")[0].getProperty("value").value2;
								if (oValue1 !== null || oValue1 !== undefined || oValue1 !== "") {
									if ((oValue1.match(/(\d{1,2}).(\d{1,2}).(\d{4})$/)) !== null) {
										d1 = oValue1.split(".");
										oValue1 = new Date(d1[1] + " " + d1[0] + " " + d1[2] + " 12:00:00");
										this.aTokens[iLength].mAggregations.customData[0].mProperties.value.value1 = oValue1
											.toString();
									}
								}

								if (oValue2 !== null || oValue2 !== undefined || oValue2 !== "") {
									if ((oValue2.match(/(\d{1,2}).(\d{1,2}).(\d{4})$/)) !== null) {
										d1 = oValue2.split(".");
										oValue2 = new Date(d1[1] + " " + d1[0] + " " + d1[2] + " 12:00:00");
										this.aTokens[iLength].mAggregations.customData[0].mProperties.value.value2 = oValue2
											.toString();
									}
								}
							}
						}
					} else if (oObject.CTYPE === 22) {
						/*var timeFormatter = new sap.ui.model.type.Time({source: {pattern:"HH:mm:ss"}, pattern: "'PT'HH'H'mm'M'ss'S'"});
						var time;
						for (var iLength = 0; iLength < this.aTokens.length; iLength++) {
						  time = timeFormatter.formatValue( this.aTokens[iLength].mProperties.key, "string");
						  this.aTokens[iLength].mProperties.key = time;
						}*/
						//formatter for converting value to PT HH mm ss format
						var oTimeFormatter = new sap.ui.model.type.Time({
							source: {
								pattern: "HH:mm:ss"
							},
							pattern: "'PT'HH'H'mm'M'ss'S'"
						});
						var sFormattedTime;
						for (var iLength = 0; iLength < this.aTokens.length; iLength++) {
							//for direct item selection
							if (typeof this.aTokens[iLength].getAggregation("customData")[0].getProperty("value").operation === "undefined") {
								sFormattedTime = oTimeFormatter.formatValue(this.aTokens[iLength].mProperties.key, "string");
								this.aTokens[iLength].mProperties.key = sFormattedTime;
							} else { // for include exclude conditions
								var sTimeVal1 = this.aTokens[iLength].getAggregation("customData")[0].getProperty("value").value1,
									sTimeVal2 = this.aTokens[iLength].getAggregation("customData")[0].getProperty("value").value2;
								if (sTimeVal1 !== null || sTimeVal1 !== undefined || sTimeVal1 !== "") {
									sFormattedTime = oTimeFormatter.formatValue(sTimeVal1, "string");
									this.aTokens[iLength].mAggregations.customData[0].mProperties.value.value1 = sFormattedTime;
								}

								if (sTimeVal2 !== null || sTimeVal2 !== undefined || sTimeVal2 !== "") {
									sFormattedTime = oTimeFormatter.formatValue(sTimeVal2, "string");
									this.aTokens[iLength].mAggregations.customData[0].mProperties.value.value2 = sFormattedTime;
								}
							}
						}
					} else if (oObject.CTYPE === 17) {
						for (var iLen = 0; iLen < this.aTokens.length; iLen++) {
							//check for non include exclude conditions
							if (typeof this.aTokens[iLen].getAggregation("customData")[0].getProperty("value").operation === "undefined") {
								if (this.aTokens[iLen].getText().match(/(\d{4}).(\d{1,2})$/) !== null) {
									var sMonthDate = this.aTokens[iLen].getText();
									this.aTokens[iLen].mProperties.text = sMonthDate.substring(4, sMonthDate.length) + "." + sMonthDate.substring(0, 4);
								}
							} else {
								//check for include exclude conditions
								var sValue1 = this.aTokens[iLen].getAggregation("customData")[0].getProperty("value").value1,
									sValue2 = this.aTokens[iLen].getAggregation("customData")[0].getProperty("value").value2;

								if (sValue1 !== null || sValue1 !== undefined || sValue1 !== "") {
									if ((sValue1.match(/(\d{1,2}).(\d{4})$/)) !== null) {
										var sFilterText = sValue1.split(".")[1].concat(sValue1.split(".")[0]);
										this.aTokens[iLen].mAggregations.customData[0].mProperties.value.value1 = sFilterText.toString();
									}
								}

								if (sValue2 !== null || sValue2 !== undefined || sValue2 !== "") {
									if ((sValue2.match(/(\d{1,2}).(\d{4})$/)) !== null) {
										var sFilterText = sValue2.split(".")[1].concat(sValue2.split(".")[0]);
										this.aTokens[iLen].mAggregations.customData[0].mProperties.value.value2 = sFilterText.toString();
									}
								}
							}
						}
					}
					oFilterBar.determineControlByName(sFieldID).setTokens(this.aTokens);
					oFilterBar.fireSearch();
					this.close();
				},

				cancel: function() {
					this.close();
				},

				afterClose: function() {
					//this.destroy();
				},

				beforeOpen: function() {
					//attach the event handler for the tokenizer on removal of tokens.
					//see if the action type is for removal
					//get the value from the token selected and compare it with rows value
					//if matched then unselect the items from the table
					var oTokenizer = this._oTokenizerGrid.getAggregation("content")[0].getAggregation("content")[1].getAggregation("content")[0];
					oTokenizer.attachTokenChange(function(oTokenEvent) {
						var sActionType = oTokenEvent.getParameter("type");
						var oValueHelpDialog = this.getParent().getParent().getParent().getParent().getParent();
						var oTable = this.getParent().getParent().getParent().getParent().getParent().getTable();
						var oTableBinding = this.getParent().getParent().getParent().getParent().getParent().getTable().getBinding("rows");

						if (sActionType === "removed") {
							var sSelValue = oTokenEvent.getParameter("token").getText();
							for (var i1 = 0; i1 < oTableBinding.aKeys.length; i1++) {
								if (oTableBinding.oModel.getProperty("/" + oTableBinding.aKeys[i1])[oValueHelpDialog.getKey()]) {
									if (sSelValue.toString() === oTableBinding.oModel.getProperty("/" + oTableBinding.aKeys[i1])[oValueHelpDialog.getKey()].toString()) {
										oTable.removeSelectionInterval(i1, i1);
										break;
									}
								}
							}
						}
					});
				}
			});
		},

		/**
		 * Set value help tokens
		 * @private
		 * @param {object} oValueHelpDialog - Value help dialog object
		 * @param {object} oEvent - Event handler for element
		 */
		_setValueHelpTokens: function(oValueHelpDialog, oEvent) {
			var aTokens = oEvent.getSource().getTokens(),
				i, j,
				oValue1,
				oValue2,
				sValue1,
				sValue2,
				oDateFormat = formatter.getDateTimeInstance("dd.MM.yyyy"),
				oTempDate,
				sFieldId = oValueHelpDialog.getKey(),
				oObject;

			oObject = this._retreiveColumnModelObject(sFieldId)[0];

			if (oObject.CTYPE === 20) {
				if (aTokens.length > 0) {
					for (i = 0; i < aTokens.length; i++) {
						// to fix formatting issue of tokens from include and exclude conditions when reopened in valuehelp
						if (typeof aTokens[i].getAggregation("customData")[0].getProperty("value").operation !== "undefined") {
							oValue1 = aTokens[i].getAggregation("customData")[0].getProperty("value").value1;
							oValue2 = aTokens[i].getAggregation("customData")[0].getProperty("value").value2;

							if (oValue1 !== "" || oValue1 !== null || oValue1 !== undefined) {
								if ((!isNaN(new Date(oValue1).getDate())) && (oValue1.match(/(\d{1,2}).(\d{1,2}).(\d{4})$/) === null)) {
									oTempDate = new Date(oValue1);
									oTempDate = oDateFormat.format(oTempDate);
									aTokens[i].mAggregations.customData[0].mProperties.value.value1 = oTempDate.toString();
								}
							}
							if (oValue2 !== null || oValue2 !== "" || oValue2 !== undefined) {
								if ((!isNaN(new Date(oValue2).getDate())) && (oValue2.match(/(\d{1,2}).(\d{1,2}).(\d{4})$/) === null)) {
									oTempDate = new Date(oValue2);
									oTempDate = oDateFormat.format(oTempDate);
									aTokens[i].mAggregations.customData[0].mProperties.value.value2 = oTempDate.toString();
								}
							}
						}
					}
				}
			} else if (oObject.CTYPE === 17) {
				if (aTokens.length > 0) {
					for (j = 0; j < aTokens.length; j++) {
						// to fix formatting issue of tokens from include and exclude conditions when reopened in valuehelp
						if (typeof aTokens[j].getAggregation("customData")[0].getProperty("value").operation !== "undefined") {
							sValue1 = aTokens[j].getAggregation("customData")[0].getProperty("value").value1;
							sValue2 = aTokens[j].getAggregation("customData")[0].getProperty("value").value2;

							if (sValue1 !== "" || sValue1 !== null || sValue1 !== undefined) {
								if (sValue1.match(/(\d{4}).(\d{1,2})$/) !== null) {
									aTokens[j].mAggregations.customData[0].mProperties.value.value1 = sValue1.substring(4, sValue1.length) + "." + sValue1.substring(0, 4);
								}
							}
							if (sValue2 !== null || sValue2 !== "" || sValue2 !== undefined) {
								if (sValue2.match(/(\d{4}).(\d{1,2})$/) !== null) {
									aTokens[j].mAggregations.customData[0].mProperties.value.value2 = sValue2.substring(4, sValue2.length) + "." + sValue2.substring(0, 4);
								}
							}
						}
					}
				}
			} else if (oObject.CTYPE === 22) {
				var oTimeFormatter = new sap.ui.model.type.Time({
					source: {
						pattern: "'PT'HH'H'mm'M'ss'S'"
					},
					pattern: "HH:mm:ss"
				});
				var sFormattedTime;
				for (var iLength = 0; iLength < aTokens.length; iLength++) {
					if (typeof aTokens[iLength].getAggregation("customData")[0].getProperty("value").operation !== "undefined") {
						sValue1 = aTokens[iLength].getAggregation("customData")[0].getProperty("value").value1;
						sValue2 = aTokens[iLength].getAggregation("customData")[0].getProperty("value").value2;
						if (sValue1 !== "" || sValue1 !== null || sValue1 !== undefined) {
							sFormattedTime = oTimeFormatter.formatValue(sValue1, "string");
							aTokens[iLength].mAggregations.customData[0].mProperties.value.value1 = sFormattedTime;
						}

						if (sValue2 !== "" || sValue2 !== null || sValue2 !== undefined) {
							sFormattedTime = oTimeFormatter.formatValue(sValue2, "string");
							aTokens[iLength].mAggregations.customData[0].mProperties.value.value2 = sFormattedTime;
						}
					}
				}
			}

			oValueHelpDialog.setTokens(aTokens);
		},

		/**
		 * Set search help columns to table
		 * @private
		 * @param {object} oEvent - event handler for data retrieval
		 * @param {string} sFieldText - Column name text
		 * @param {object} oValueHelpDialog - value help dialog
		 */
		_setSearchHelpColumns: function(sFieldID, sFieldText, sColumnType, oValueHelpDialog) {
			var oColModel = this._retreiveColumnsModel(sFieldID, sFieldText, sColumnType);
			var oValueHelpDialogTable = oValueHelpDialog.getTable();

			oValueHelpDialogTable.setModel(oColModel, "columns");
			oValueHelpDialogTable.setEnableBusyIndicator(true);
		},

		_retreiveColumnsModel: function(sFieldID, sFieldText, sColumnType) {
			var oColModel = new JSONModel(),
				oType;

			var aColumn = [];

			oType = formatter.getDataTypeInstance(sColumnType);

			aColumn.push({
				label: sFieldText,
				template: sFieldID,
				oType: oType
			});

			var oKeyColumn = this._retreiveColumnModelObject(sFieldID)[0];

			if (oKeyColumn && oKeyColumn.FILTER_TXT_COLUMN) {
				var oDescriptionColumn = this._retreiveColumnModelObject(oKeyColumn.FILTER_TXT_COLUMN)[0];

				oType = formatter.getDataTypeInstance(oDescriptionColumn.CTYPE);

				aColumn.push({
					label: oDescriptionColumn.LABEL,
					template: oDescriptionColumn.COLUMN,
					oType: oType
				});
			}

			oColModel.setData({
				cols: aColumn
			});

			return oColModel;
		},

		/**
		 * Bind search help data to table
		 * @private
		 * @param {object} oModel - Model with data that needs to binded
		 * @param {object} oValueHelpDialog - value help dialog
		 */
		_setSearchHelpData: function(oModel, sFieldID, oValueHelpDialog, sEntitySet, mFilters) {
			var oValueHelpDialogTable = oValueHelpDialog.getTable();
			var sSelect = sFieldID;

			var oKeyColumn = this._retreiveColumnModelObject(sFieldID)[0];

			if (oKeyColumn && oKeyColumn.FILTER_TXT_COLUMN) {
				sSelect = sSelect + "," + oKeyColumn.FILTER_TXT_COLUMN;
			}

			oValueHelpDialog.setModel(oModel);
			oValueHelpDialogTable.bindRows({
				path: sEntitySet,
				parameters: {
					select: sSelect
				},
				filters: mFilters,
				events: {
					change: function() {
						oValueHelpDialog.updateTable();
					}
				}
			});

			this.attachRequestsForControlBusyIndicator(oModel, oValueHelpDialogTable);
		},

		/**
		 * Set range Key fields for value help
		 * @private
		 * @param {object} oEvent - event handler for data retrieval
		 * @param {string} sFieldText - Column name text
		 * @param {object} oValueHelpDialog - value help dialog
		 */
		_prepareRangeKeyFields: function(sFieldID, sFieldText, oValueHelpDialog) {
			oValueHelpDialog.setRangeKeyFields([{
				label: sFieldText,
				key: sFieldID
					// type: "date"
			}]);
		},

		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page.
		 * @public
		 */
		onNavBack: function(bDeleted) {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash(),
				bDependent = this.getOwnerComponent()._getUriParams("dependent");
			if (!(typeof bDeleted === "boolean") && bDependent === "true") {
				var oVariantModel = this.getModel(this.config.paths.variantData);

				if (!oVariantModel) {
					// set variant model
					oVariantModel = new ODataModel([this.getOwnerComponent().getMetadata().getConfig().serviceUrl, this.config.paths.variantService].join(""), true);

					oVariantModel.setDefaultCountMode(CountMode.Inline);
					this.setModel(oVariantModel, this.config.paths.variantData);
				}
				var //sUser = this.getModel("authModel").getProperty("/USERID"),
					sCtrl = this.getModel("mainConfig").getProperty("/CTRLID");
				//sPath = "/VariantsUpsert(CTRLID='" + sCtrl + "',VariantId='DependentReport',UserId='" + sUser + "',isGlobal=0)";
				oVariantModel.read("/VariantsGet", {
					filters: [new Filter([new Filter("VariantId", FilterOperator.EQ, "DependentReport"), new Filter("CTRLID", FilterOperator.EQ, sCtrl)], true)],
					success: function(oData) {
						var sUri = oData.results[0].__metadata.uri;
						var sPath = sUri.substring(sUri.lastIndexOf("VariantsGet"), sUri.length).replace("VariantsGet", "VariantsSet");
						oVariantModel.remove(sPath, {
							success: function() {
								jQuery.sap.log.info("Variant removed");
								this.onNavBack(true);
							}.bind(this),
							error: function(oError) {
								jQuery.sap.log.error(oError);
							}
						});
					}.bind(this)
				});
				return;
			}

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Navigate back to FLP home
				// oCrossAppNavigator.toExternal({
				//     target: {
				//         shellHash: "#"
				//     }
				// });

				if (sap.ushell) {
					sap.ushell.Container.getService("CrossApplicationNavigation").backToPreviousApp();
				} else {
					history.go(-1);
				}

			}
		},

		_onRouteMatched: function(oEvent) {
			var oArgs, oView, oTab;
			oArgs = oEvent.getParameter("arguments");
			oView = this.getView();
			oTab = oArgs["tab"];
			this.sTab = oTab;
			if (oTab && _aValidTabKeys.indexOf(oTab) > -1) {
				oView.getModel("view").setProperty("/selectedTabKey", oTab);
				// support lazy loading
				this.getRouter().getTargets().display(oTab);
			} else if (this.getOwnerComponent().getModel("mainConfig").getProperty("/IS_HIERARCHY") === 1) {
				// the default table should be visible
				this.getRouter().navTo("tableviewer", {
					tab: _aValidTabKeys[2]
				}, true /*no history*/ );
			} else if (this.getOwnerComponent().getModel("mainConfig").getProperty("/IS_MIXED") === 1) {
				// the mixed tab should be opened
				this.getRouter().navTo("tableviewer", {
					tab: _aValidTabKeys[3]
				}, true /*no history*/ );
			} else {
				// the default table should be visible
				this.getRouter().navTo("tableviewer", {
					tab: _aValidTabKeys[0]
				}, true /*no history*/ );
			}
		},

		/**
		 * We use this event handler to update the hash in case a new tab is selected.
		 * @param oEvent
		 */
		onTabSelect: function(oEvent) {
			//get the table type and get the sorter for non hierarchial table only
			//get the sorter of the table before navigation to charts tab
			var sTableType = this._tableViewerTableType;
			if (sTableType === this.config.tableTypes.table) {
				var oTableTab = oEvent.getSource().getAggregation("_header").getAggregation("items")[0];
				//check if there are aggregation in the table, then only get the sorter
				if (oTableTab.getAggregation("content")[0]) {
					var aSorter = oTableTab.getAggregation("content")[0].getAggregation("content")[0].getBinding("rows").aSorters;
					this.getModel("view").setProperty("/aMainSorters", aSorter.length === 0 ? undefined : aSorter);
				}
			}
			this.getRouter().navTo("tableviewer", {
				tab: oEvent.getParameter("selectedKey")
			}, true /*without history*/ );
		},

		/**
		 * Check Duplicate Variant Name
		 * @private
		 * @param {object} oModel - Variant oModel
		 * @param {string} sVariantName - Variant name
		 * @param {string} sVariantKey - Variant key
		 * @param {string} opType - Operation type Save/Manage
		 * @param {string} isDef - is variant is default or not. 1 - default 0 - is not default, used to overwrite the default of other variant item
		 */
		_checkDuplicateVariant: function(oVariantModel, sVariantName, sVariantKey, opType, isDef) {
			var oVariant = this.getView().byId(this.config.ui.elements.variant);

			if (sVariantName.toUpperCase() === "STANDARD" || sVariantName.toUpperCase() === "DEFAULT") {
				if (opType === 'S') {
					oVariant.removeVariantItem(oVariant.getItemByKey(sVariantKey).sId);
					if (oVariant.getItems().length > 0) {
						oVariant.removeItem(oVariant.getItemByKey(sVariantKey).sId);
					}
				}
				this._showVariantError("variantReservedError", sVariantName);
				return true;
			}
			for (var key in oVariantModel.oData) {
				if (key.search("VariantsGet") !== -1) {
					if (sVariantName.toUpperCase() === oVariantModel.oData[key].VariantName.toUpperCase()) {
						this._oDuplicateVariant = {
							name: sVariantName,
							op: 'M',
							isDefault: isDef
						};
						if (opType === 'S') {
							this._oDuplicateVariant.op = 'S';
							oVariant.removeVariantItem(oVariant.getItemByKey(sVariantKey).sId);
						}
						this._showVariantError("variantOverWrite", sVariantName);
						return true;
						//break;
					}
				}
			}
			return false;
		},

		/** Show Variant Error
		 * @String msdId : i18n Message Id
		 * @String sVariantName : Variant Name
		 */
		_showVariantError: function(msgId, sVariantName) {
			var sMessage = this.getResourceBundle().getText(msgId, ["\"" + sVariantName + "\""]);
			//var sMessage = "Do you want to overwrite \"" + sVariantName + "\" variant?";
			var mOptions = {
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				icon: MessageBox.Icon.WARNING,
				onClose: jQuery.proxy(this._onCloseDuplicateVariantMsg, this)
			};
			this._showMessage(sMessage, mOptions);
		},

		/**
		 * Method to return the item key which has duplicate variant name
		 * @returns {string} sKey - variant item key which is duplicate
		 * @private
		 */
		_getDuplicateVariantKey: function() {
			var oVariant = this.getView().byId(this.config.ui.elements.variant),
				aVariantItems = oVariant.getVariantItems(),
				sDuplicateVariant = this._oDuplicateVariant.name;


			var oDuplicateItem = $.grep(aVariantItems, function(oItem) {
				if (oItem.getText().toUpperCase() === sDuplicateVariant.toUpperCase()) {
					return oItem;
				}
			})[0];
			return oDuplicateItem.getKey();
		},

		_onCloseDuplicateVariantMsg: function(sMsg) {
			var oVariant = this.getView().byId(this.config.ui.elements.variant);
			//var sVariantKey = oVariant.lastSelectedVariantKey;
			var sVariantKey = this._getDuplicateVariantKey();
			var oBindingContext = oVariant.getItemByKey(sVariantKey).getBindingContext("variantData");
			var iGlobal = oBindingContext.getProperty("isGlobal");
			if (iGlobal === 0) {
				if (sMsg === "YES") {
					var oVariantModel = this.getModel("variantData");
					var sCTRLID = this.getComponentModel("mainConfig").getProperty("/CTRLID");
					var sUderId = oBindingContext.getProperty("UserId");
					var sVariantName = oBindingContext.getProperty("VariantName");
					//var iDefault = oBindingContext.getProperty("isDefault");
					var iDefault = this._oDuplicateVariant ? this._oDuplicateVariant.isDefault : oBindingContext.getProperty("isDefault");
					var iHidden = oBindingContext.getProperty("isHidden");
					var sFilterObject = encodeURI(JSON.stringify(this._getAppliedFilters()));
					var aTableColumns = this._getTableColumns();
					var aFilterFields = this._readVisibleFilters();

					var mPayLoad = {
						CTRLID: sCTRLID,
						VariantId: sVariantKey,
						UserId: sUderId,
						VariantName: sVariantName,
						isDefault: iDefault,
						isGlobal: iGlobal,
						isHidden: iHidden,
						filterObject: sFilterObject,
						forUsers: "",
						tableColumns: encodeURI(JSON.stringify(aTableColumns)),
						filterFields: encodeURI(JSON.stringify(aFilterFields))
					};

					var mBindingParams = {
						CTRLID: sCTRLID,
						VariantId: sVariantKey,
						UserId: sUderId,
						isGlobal: iGlobal
					};

					if (iDefault === 1) {
						this._previousDefaultKey = sVariantKey;
						oVariant.setDefaultVariantKey(sVariantKey);
					}

					var sBindingPath = oVariantModel.createKey("/VariantsSet", mBindingParams);

					oVariantModel.update(sBindingPath, mPayLoad, {

						success: jQuery.proxy(function(oResponse) {
							MessageToast.show("Variant '" + sVariantName + "' Succesfully Updated", {
								animationDuration: 2000,
								closeOnBrowserNavigation: false
							});
						}, this),

						error: jQuery.proxy(function(oError) {
							var sError = JSON.parse(oError.response.body);
							var sMessage = sError.error.message.value;
							var mOptions = {
								actions: [MessageBox.Action.OK],
								icon: MessageBox.Icon.ERROR,
								title: "Error",
								onClose: jQuery.proxy(this._onCloseVariantErrorMsg, this)
							};
							this._showMessage(sMessage, mOptions);
						}, this)
					});

					oVariantModel.refresh();
					//                oVariant.clearVariantSelection();
					//                oVariant.fireSelect({
					//                    key: "*standard*"
					//                });
				}
			} else {
				var sMessage = "Shared Variant can't be overwritten";
				var mOptions = {
					actions: [MessageBox.Action.OK],
					icon: MessageBox.Icon.ERROR,
					title: "Error",
					onClose: jQuery.proxy(this._onCloseVariantErrorMsg, this)
				};
				this._showMessage(sMessage, mOptions);
			}
		},

		_getAppliedFilters: function() {
			var oFilterBar = this.byId(this.config.ui.elements.filterbar),
				aFilterItems = oFilterBar.getFilterItems(),
				aSavedObjects = [];

			$.grep(aFilterItems, function(oFilterItem) {
				var oFilterControl = oFilterBar.determineControlByFilterItem(oFilterItem),
					sClassName = oFilterControl.getMetadata()._sClassName;

				if (sClassName === "sap.m.MultiInput" && (oFilterControl.getTokens().length > 0 || !!oFilterControl.getValue())) {
					if (oFilterControl.getTokens().length > 0) {
						var aTokensString = [];

						$.grep(oFilterControl.getTokens(), function(oToken) {
							aTokensString.push({
								sKey: oToken.getKey(),
								sText: oToken.getText(),
								sCustomDataKey: oToken.getCustomData()[0].getProperty("key"),
								sCustomData: JSON.stringify(oToken.getCustomData()[0].getProperty("value"))
							});
						});

						aSavedObjects.push({
							sFieldName: oFilterControl.getName(),
							sClassName: sClassName,
							aTokens: JSON.stringify(aTokensString)
						});
					} else {
						aSavedObjects.push({
							sFieldName: oFilterControl.getName(),
							sClassName: sClassName,
							sValue: oFilterControl.getValue()
						});
					}
				} else if (sClassName === "sap.m.Input" && oFilterControl.getValue()) {
					aSavedObjects.push({
						sFieldName: oFilterControl.getName(),
						sClassName: sClassName,
						sValue: oFilterControl.getValue()
					});
				} else if (sClassName === "sap.m.DatePicker" && oFilterControl.getDateValue()) {
					aSavedObjects.push({
						sFieldName: oFilterControl.getName(),
						sClassName: sClassName,
						sValue: oFilterControl.getDateValue()

					});
				} else if (sClassName === "sap.m.DateRangeSelection" && oFilterControl.getDateValue()) {
					var aValues = [];

					aValues.push(oFilterControl.getDateValue());

					if (oFilterControl.getSecondDateValue()) {
						aValues.push(oFilterControl.getSecondDateValue());
					}

					aSavedObjects.push({
						sFieldName: oFilterControl.getName(),
						sClassName: sClassName,
						aValues: JSON.stringify(aValues)
					});
				} else if (sClassName === "sap.m.MultiComboBox" && oFilterControl.getSelectedItems().length > 0) {
					var aItems = oFilterControl.getSelectedItems().map(function(oItem) {
						return oItem.getProperty("text");
					});

					aSavedObjects.push({
						sFieldName: oFilterControl.getName(),
						sClassName: sClassName,
						aValues: JSON.stringify(aItems)
					});
				} else if (sClassName === "sap.m.ComboBox" && oFilterControl.getSelectedKey()) { //take values from combobox control for filtering
					aSavedObjects.push({
						sFieldName: oFilterControl.getName(),
						sClassName: sClassName,
						sValue: oFilterControl.getSelectedKey()
					});
				}
			});
			return aSavedObjects;
		},
		/**
		 * Method to fire to look for default variant and fire select event of variant
		 * @private
		 */
		_fireDefaultVariant: function() {
			var oVariantModel = this.getModel("variantData");
			var oMainConfigModel = this.getComponentModel(this.config.paths.mainConfig);
			var sCTRLID = oMainConfigModel.getProperty("/CTRLID");

			// Set default variant
			oVariantModel.read("/VariantsGet", {
				urlParameters: "$filter=isDefault%20eq%201%20and%20CTRLID%20eq%20%27" + sCTRLID + "%27",
				success: jQuery.proxy(function(oData) {
					if (oData.results.length > 0) {
						this.getView().byId(this.config.ui.elements.variant).setInitialSelectionKey(oData.results[0].VariantId);
						var sVariantId = oData.results[0].VariantId;
						if (sVariantId === undefined || sVariantId === null || sVariantId === "") {
							this._previousDefaultKey = "*standard*";
						} else {
							this._previousDefaultKey = sVariantId;
						}
						this.getView().byId(this.config.ui.elements.variant).setDefaultVariantKey(this._previousDefaultKey);
						this.getView().byId(this.config.ui.elements.variant).fireSelect({
							key: this._previousDefaultKey
						});
					} else {
						//else condition added to fix deletion of variants where this._previousDefaultKey was set undefined
						this._previousDefaultKey = "*standard*";
					}
				}, this)
			});
		},

		/**
		 * Triggered when person pressed save variant
		 * @param oEvent
		 */
		onVariantSave: function(oEvent) {
			var oVariantModel = this.getModel("variantData");
			var iGlobal = oEvent.getParameter("global") ? 1 : 0;
			var iDefault = oEvent.getParameter("def") ? 1 : 0;
			var sVariantKey = oEvent.getParameter("key");
			var sVariantName = oEvent.getParameter("name");
			var sCTRLID = this.getComponentModel("mainConfig").getProperty("/CTRLID");

			var aMainFilters = this._retrieveFilters(this._retrieveFilterFields());
			
			var bDuplicate = this._checkDuplicateVariant(oVariantModel, sVariantName, sVariantKey, 'S', iDefault);
			if (bDuplicate === true) {
				return;
			}
			
			var bValid = this._checkFilterParamsLength(aMainFilters);
			if (!bValid) {
				var oVariant = this.getView().byId(this.config.ui.elements.variant);
				oVariant.removeVariantItem(oVariant.getItemByKey(sVariantKey).sId);
				if (oVariant.getItems().length > 0) {
						oVariant.removeItem(oVariant.getItemByKey(sVariantKey).sId);
					}
				oVariant.setDefaultVariantKey(this._previousDefaultKey);
				if(this._previousDefaultKeyText === undefined || this._previousDefaultKeyText === ""){
					this._previousDefaultKeyText = "Standard";
				}
				oVariant.oVariantText.setText(this._previousDefaultKeyText);
				return;
			}			

			var aTableColumns = this._getTableColumns();
			var aFilterFields = this._readVisibleFilters();

			var oPayLoad = {
				CTRLID: sCTRLID,
				VariantId: sVariantKey,
				UserId: "",
				VariantName: sVariantName,
				isDefault: iDefault,
				isGlobal: iGlobal,
				isHidden: 0,
				filterObject: encodeURI(JSON.stringify(this._getAppliedFilters())),
				forUsers: "",
				tableColumns: encodeURI(JSON.stringify(aTableColumns)),
				filterFields: encodeURI(JSON.stringify(aFilterFields))				
			};

			if (iGlobal === 0) { //Check sharing 
				oVariantModel.create(this.config.paths.variantEntity, oPayLoad, {
					success: function(oData, response) {
						var msg = this.getResourceBundle().getText("variantSaved", ["\"" + sVariantName + "\""]);
						var oVariant = this.getView().byId(this.config.ui.elements.variant);
						MessageToast.show(msg);
						oVariantModel.refresh(true);
						oVariantModel.updateBindings(true);
						this._fireDefaultVariant();
					}.bind(this),
					error: function(oError) {
						// to-do error
						jQuery.sap.log.error(oError);
					}
				});

			} else {
				var aSharedUser = oEvent.getSource().oSaveDialog.getContent()[6].getTokens();
				var sUsers = "";

				if (aSharedUser.length > 0) {
					var aPayload = [];
					$.each(aSharedUser, function(index, sSharedUser) {
						var oPayLoadCpy = $.extend({}, oPayLoad);
						oPayLoadCpy.UserId = sSharedUser.getKey().toUpperCase();
						sUsers += sUsers === "" ? oPayLoadCpy.UserId : "," + oPayLoadCpy.UserId;
						aPayload.push(oVariantModel.createBatchOperation("/VariantsSet", "POST", oPayLoadCpy));
					});

					var oPayLoadCpy = $.extend({}, oPayLoad);
					oPayLoadCpy.UserId = "dummy";
					oPayLoadCpy.forUsers = sUsers;
					oPayLoadCpy.isGlobal = 0;
					aPayload.push(oVariantModel.createBatchOperation("/VariantsSet", "POST", oPayLoadCpy));


					oVariantModel.addBatchChangeOperations(aPayload);

					oVariantModel.submitBatch(function(data) {
						oVariantModel.refresh();
						if (data.__batchResponses[0].__changeResponses) {
							var msg = this.getResourceBundle().getText("variantShared", ["\"" + sVariantName + "\"", data.__batchResponses[0].__changeResponses.length]);
							MessageToast.show(msg);
						} else {
							this._showVariantError("variantSharedError", sVariantName);
						}
					}.bind(this), function(err) {
						alert("Error occurred", err);
					});
				} else {
					this._showVariantError("variantUserError", sVariantName);
				}
			}
		},

		_addFilterItemsValuesToFilterBar: function(aSavedFilters) {
			var oFilterBar = this.byId(this.config.ui.elements.filterbar),
				bSetDelete = false;

			$.grep(aSavedFilters, function(oSavedFilter) {
				var oFilterControl = oFilterBar.determineControlByName(oSavedFilter.sFieldName);
				if (oFilterControl !== null) {
					if (oSavedFilter.sClassName === "sap.m.MultiInput") {
						if (oSavedFilter.sValue) {
							oFilterControl.setValue(oSavedFilter.sValue);
						} else {
							var aNewTokens = [];

							$.grep(JSON.parse(oSavedFilter.aTokens), function(oToken) {
								var oNewToken = new Token({
									key: oToken.sKey,
									text: oToken.sText
								});
								oNewToken.data(oToken.sCustomDataKey, JSON.parse(oToken.sCustomData));
								aNewTokens.push(oNewToken);
							});

							oFilterControl.setTokens(aNewTokens);
						}
					} else if (oSavedFilter.sClassName === "sap.m.Input") {
						oFilterControl.setValue(oSavedFilter.sValue);
					} else if (oSavedFilter.sClassName === "sap.m.DatePicker") {
						oFilterControl.setDateValue(new Date(oSavedFilter.sValue));
					} else if (oSavedFilter.sClassName === "sap.m.DateRangeSelection") {
						var aValues = JSON.parse(oSavedFilter.aValues);

						oFilterControl.setDateValue(new Date(aValues[0]));
						// check if second date exist
						if (aValues[1]) {
							oFilterControl.setSecondDateValue(new Date(aValues[1]));
						}
					} else if (oSavedFilter.sClassName === "sap.m.MultiComboBox") {
						var aValues = JSON.parse(oSavedFilter.aValues);

						oFilterControl.setSelectedKeys(aValues);
					} else if (oSavedFilter.sClassName === "sap.m.ComboBox") { //set the values for combobox control if it is part of filters
						var sSelectedKey = oSavedFilter.sValue;
						oFilterControl.setSelectedKey(sSelectedKey);
					}
				} else {
					bSetDelete = true;
				}
			});

			return bSetDelete;
		},

		/**
		 * Set visibility of columns in table after variant select 
		 * @private
		 * @param - {object} event instance
		 */
		_setVisibleColumns: function() {
			var oModel = this.getComponentModel("mainConfig");
			if (oModel.getProperty("/ODATA_SRV") === 1 && this.sTab !== "Chart") {
				var aVariantColumns,
					sColumns = null,
					sFilters = null,
					sIconTabId = this._getIconTab(),
					oTable = this._getTable();

				//Get all columns from service
				var aServiceColumns = oModel.getProperty("/ServiceColumns/results");

				//Get Visible columns from variant
				var sVariantMangement = this.getView().byId(this.config.ui.elements.variant),
					oItem = sVariantMangement.getItemByKey(sVariantMangement.getSelectionKey());
				if (oItem) {
					sColumns = oItem.data("tableColumns");
					sFilters = oItem.data("filterFields");
				}
				//Parse decode columns from variant 
				if (sColumns !== "") {
					aVariantColumns = JSON.parse(decodeURIComponent(sColumns));
				} else {
					aVariantColumns = sColumns;
				}
				
				if (oTable !== undefined && oTable !== null) {

					var aTableColumns = oTable.getAggregation("columns");
					var sFieldName; 
					var fnColCompFunc;
					var oServiceColumn;
					var iColumn;
					var aColumn;

					if (aVariantColumns !== null && aVariantColumns !== "null" && aVariantColumns !== undefined && aVariantColumns !== "") {
						if (sIconTabId !== "siemens.ui.tree") {
							this._resetApplicatonFilter(oTable);
						}
						fnColCompFunc = function(oColumns) {
							return oColumns.fieldName === sFieldName;
						};
						for (iColumn = 0; iColumn < aTableColumns.length; iColumn++) {
							sFieldName = aTableColumns[iColumn].getCustomData()[0].getValue();
							aColumn = $.grep(aVariantColumns, fnColCompFunc);
							if (aColumn.length !== 0 && aColumn.length !== undefined && aColumn !== null) {
								aTableColumns[iColumn].setVisible(true);
							} else {
								aTableColumns[iColumn].setVisible(false);
							}
						}
					} else {
						if (sIconTabId !== "siemens.ui.tree") {
							this._resetApplicatonFilter(oTable);
						}
						fnColCompFunc = function(oColumns) {
							return oColumns.getCustomData()[0].getValue() === oServiceColumn.COLUMN;
						};
						for (iColumn = 0; iColumn < aServiceColumns.length; iColumn++) {
							oServiceColumn = aServiceColumns[iColumn];
							aColumn = $.grep(aTableColumns, fnColCompFunc);
							if (aServiceColumns[iColumn].STDRD === 1) {
								aColumn[0].setVisible(true);
							} else {
								aColumn[0].setVisible(false);
							}
						}
					}
				}
			}
		},

		/**
		 * Reset table application filter   
		 * @private
		 * @param - {object} table instance
		 */
		_resetApplicatonFilter: function(oTable) {
			var oTableBinding = oTable.getBinding("rows");
			if (oTableBinding) {
				if (oTableBinding.hasOwnProperty("aApplicationFilters") === true) {
					if (oTableBinding.aApplicationFilters) {
						if (oTableBinding.aApplicationFilters.length > 0) {
							oTableBinding.aApplicationFilters[0] = null;
						}
					}
				}
			}
		},

		/**
		 * Triggered when select variant    
		 * @private
		 * @param - {object} event instance 
		 */
		onVariantSelect: function(oEvent) {
			if (oEvent.getParameter("key") === "*standard*") {
				this.onClear();
				//return;
			} else {
				this._clearFilterItems();
			}
			this._previousDefaultKeyText = oEvent.getSource().oVariantText.getText();
			//Publish event when variant get selected 
			var oEventBus = this.getEventBus();
			oEventBus.publish("TableController", "SetVariantSelect");
			
			//unescape introduces unwanted characters. Replaced unescape with decodeURIComponent.
			if (oEvent.getSource().getItemByKey(oEvent.getParameter("key")) !== null) {
				var bSetDelete = this._addFilterItemsValuesToFilterBar(JSON.parse(decodeURIComponent(oEvent.getSource().getItemByKey(oEvent.getParameter("key")).data("filters"))));
			}
			var oFilterBar = this.byId(this.config.ui.elements.filterbar);

			if (bSetDelete) {
				var oVariant = this.getView().byId(this.config.ui.elements.variant),
					aVariants = oVariant.getVariantItems(),
					sVariantName;

				for (var m = 0; m < aVariants.length; m++) {
					if (oEvent.getParameter("key") === aVariants[m].getKey()) {
						sVariantName = aVariants[m].getText();
						break;
					}
				}
				var sMessage = this.getResourceBundle().getText("variantConfigError", ["\"" + sVariantName + "\""]);

				var mOptions = {
					actions: [MessageBox.Action.OK],
					icon: MessageBox.Icon.ERROR,
					title: "Error",
					onClose: jQuery.proxy(this._onCloseVariantErrorMsg, this)
				};
				this._showMessage(sMessage, mOptions);

				if (oEvent.getParameter("key") === oVariant.getDefaultVariantKey()) {
					oVariant.setDefaultVariantKey("*standard*");
				}

			} else {
				oFilterBar.fireSearch();
			}
			this._setVisibleColumns();
//			oEventBus.publish("TableController", "resetColumnColorConfig");
		},

		_onCloseVariantErrorMsg: function() {
			var oVariant = this.getView().byId(this.config.ui.elements.variant);
			//            oVariant.clearVariantSelection();
			//            oVariant.fireSelect({
			//                key: "*standard*"
			//            });
		},


		/**
		 * helper method to show the confirmation Message box
		 *
		 * @param {String} sMessage - message to be shown
		 * @param {object} mOptions - mapping options required for message box
		 *
		 * @private
		 */
		_showMessage: function(sMessage, mOptions) {
			sap.ui.getCore().attachInit(function() {
				MessageBox.show(sMessage, mOptions);
			});
		},

		/**
		 * Retrieve the visible columns from table
		 * @private
		 * @param {array} aColumns - all columns that currently are in table
		 * @param {boolean} bOption - with sorting true/false  
		 * @returns {string} object array of visible and sorted column 
		 */
		_readVisibleColumns: function(aColumns, bOption) {
			var sVisibleColumns = "",
				oVisibleColumns,
				aVisibleColumns = [];

			for (var iColumn = 0; iColumn < aColumns.length; iColumn++) {
				oVisibleColumns = {
					fieldName: "",
					sortOrder: ""
				};
				if (aColumns[iColumn].getProperty("visible")) {
					sVisibleColumns = sVisibleColumns === "" ? aColumns[iColumn].getCustomData()[0].getValue() : aColumns[iColumn].getCustomData()[0].getValue();
					oVisibleColumns.fieldName = sVisibleColumns;
					if (aColumns[iColumn].getSorted() === true && bOption === true) {
						oVisibleColumns.sortOrder = aColumns[iColumn].getSortOrder();
					}
					aVisibleColumns.push(oVisibleColumns);
				}
			}
			return aVisibleColumns;
		},
		
		/**
		 * Retrieve the visible filter fields from filter bar
		 * @private
		 * @returns {string} object array of visible filter fields 
		 */
		_readVisibleFilters: function() {
			var aVisibleFilters = [],
				oVisibleFilters,
				aFilterItems = [],
				oFilterBar = this.byId(this.config.ui.elements.filterbar);
			
				aFilterItems = oFilterBar.getAllFilterItems(true);

			for (var iFilter = 0; iFilter < aFilterItems.length; iFilter++) {
					oVisibleFilters = {
						fieldName: ""
					};
				
				if (aFilterItems[iFilter].getVisibleInFilterBar() === true) {
					oVisibleFilters.fieldName = aFilterItems[iFilter].getName() ;
					aVisibleFilters.push(oVisibleFilters);
				}
			}
			return aVisibleFilters;
		},
		
		/**
		 * Set visible filter on filter bar
		 * @private
		 */
		_setVisibleFilters: function() {
			var	aFilterItems = [],
				oFilterBar = this.byId(this.config.ui.elements.filterbar),
				sFilterField , bExist , sFilters , aFilterFields , iFilter;
			
				var oModel = this.getComponentModel("mainConfig");
				if (oModel.getProperty("/ODATA_SRV") === 1){

				//Get all columns from service
				var aServiceColumns = oModel.getProperty("/ServiceColumns/results");

				//Get Visible columns from variant
				var sVariantMangement = this.getView().byId(this.config.ui.elements.variant),
					oItem = sVariantMangement.getItemByKey(sVariantMangement.getSelectionKey());
					if (oItem) {
				 		sFilters = oItem.data("filterFields");
						}
							
					if(sFilters !== "" && sFilters !== undefined){
						aFilterFields = JSON.parse(decodeURIComponent(sFilters));
					}
			
					aFilterItems = oFilterBar.getAllFilterItems(true);
				
				if(aFilterFields !== null && aFilterFields !== undefined){
					for (iFilter = 0; iFilter < aFilterItems.length; iFilter++) {
							sFilterField = aFilterItems[iFilter].getName();
							bExist = this._checkFilterField(aFilterFields,null,sFilterField);
							if(bExist === true){
								aFilterItems[iFilter].setVisibleInFilterBar(true);
							}
							else{
								aFilterItems[iFilter].setVisibleInFilterBar(false);						
							}
						}			
				}
				else{
					for (iFilter = 0; iFilter < aFilterItems.length; iFilter++) {
						sFilterField = aFilterItems[iFilter].getName();
						bExist = this._checkFilterField(null,aServiceColumns,sFilterField);
						if(bExist === true){
							aFilterItems[iFilter].setVisibleInFilterBar(true);
						}
						else{
							aFilterItems[iFilter].setVisibleInFilterBar(false);						
						}
					}			
				}
				}
			},
		
		/**
		 * Set visibility of columns in table after variant select 
		 * @private
		 * @param - {Array} aFilterFields - Array of Filter fields
		 * @param - {Array} aServiceColumns - Array of Service columns
		 * @param - {String} sFilterField - Filter Field Name
		 * return - {boolean} bExist - true/false if field exist or not
		 */
		_checkFilterField:function(aFilterFields,aServiceColumns,sFilterField){
			var bExist = false,
				aFilterField;
			
				if(aFilterFields !== null){
					aFilterField = $.grep(aFilterFields, function(oFilterFields) {
						return oFilterFields.fieldName === sFilterField;
					});
				}
				else{
					aFilterField = $.grep(aServiceColumns, function(oFilterFields) {
						return oFilterFields.COLUMN === sFilterField && oFilterFields.ONFILTERBAR === 1;
					});
				}
				if (aFilterField.length !== 0 && aFilterField.length !== undefined && aFilterField !== null) {
					bExist = true;
				} else {
					bExist = false;
				}
				
			return bExist;
		},
		
		
		/**
		 * Retrieve icon tab instance 
		 * @private
		 * @returns {object} icon tab instance 
		 */
		_getIconTab: function() {
			var oModel = this.getComponentModel("mainConfig"),
				sMixed = oModel.getProperty("/IS_MIXED"),
				sIconTabId = (this._tableViewerTableType === "table") ? "siemens.ui.table" : "siemens.ui.tree";
			if (sMixed === 1) {
				sIconTabId = "siemens.ui.mix";
			}
			return sIconTabId;
		},

		/**
		 * Retrieve the table tree/table 
		 * @private
		 * @returns {object} oTable table instance 
		 */
		_getTable: function() {
			var oTable;
			var sIconTabId = this._getIconTab(),
				oIconTab = this.getView().byId(sIconTabId);
			if (oIconTab.getAggregation("content") !== null) {
				if(oIconTab.getAggregation("content").length > 0){
				if (sIconTabId === "siemens.ui.mix") {
					oTable = oIconTab.getAggregation("content")[0].getAggregation("content")[0].getAggregation("contentAreas")[0].getAggregation("content")[0].getAggregation("content")[0];
				} else {
					oTable = oIconTab.getAggregation("content")[0].getAggregation("content")[0];
				}
			}
			}
			return oTable;
		},

		/**
		 * Retrieve the table columns
		 * @private
		 * @returns {string} array of visible column 
		 */
		_getTableColumns: function() {
			var sVisibleColumns = "";
			var oTable = this._getTable(),
				aColumns;

			if (oTable !== undefined && oTable !== null) {
				    aColumns = oTable.getAggregation("columns");
					sVisibleColumns = this._readVisibleColumns(aColumns, false);
			} else {
				sVisibleColumns = "";
			}
			return sVisibleColumns;
		},

		/**
		 * Triggered when you press manage variant's ok button   
		 * @private
		 * @param - {object} event instance 
		 */
		onVariantManage: function(oEvent) {
			var oVariantManagement = oEvent.getSource(),
				oParameters = oEvent.getParameters(),
				aVariantItems = oVariantManagement.getVariantItems(),
				sDefaultKey = oEvent.getParameter("def"),
				oVariantItem,
				oBindingContext,
				oModel = this.getModel(this.config.paths.variantData),
				aRenamedVariants = oParameters.renamed,
				aDeletedVariants = oParameters.deleted,
				sPath,
				sPathChange,
				sMessage,
				oDataObject,
				sVariantPath = this.config.paths.variantData,
				oInstance = this;

			aDeletedVariants.forEach(function(remove) {
				oVariantItem = $.grep(aVariantItems, function(oItem) {
					return oItem.getProperty("key") === remove;
				})[0];
				oBindingContext = oVariantItem.getBindingContext(sVariantPath);
				sPath = oBindingContext.sPath;
				sPathChange = sPath.replace('VariantsGet', 'VariantsSet');
				sMessage = oInstance.getResourceBundle().getText("variantDelete");
				oModel.remove(sPathChange, null, function(oData) {
					MessageToast.show(sMessage);
				}, function(oError) {
					jQuery.sap.log.error(oError);
				});
			});

			aRenamedVariants.forEach(function(rename) {
				oVariantItem = $.grep(aVariantItems, function(oItem) {
					return oItem.getProperty("key") === rename.key;
				})[0];

				var isDef = oVariantItem.getBindingContext("variantData").getObject("isDefault");

				var bDuplicate = oInstance._checkDuplicateVariant(oModel, oVariantItem.getText(), oVariantItem.getKey(), 'M', isDef);

				if (bDuplicate === true) {
					return;
				}

				oBindingContext = oVariantItem.getBindingContext(sVariantPath);
				sPath = oBindingContext.sPath;
				oDataObject = oBindingContext.getObject();
				oDataObject.VariantName = rename.name;
				if (oDataObject.VariantId === sDefaultKey) {
					oDataObject.isDefault = 1;
				}
				sPathChange = sPath.replace('VariantsGet', 'VariantsSet');
				sMessage = oInstance.getResourceBundle().getText("variantUpdate");
				oModel.update(sPathChange, oDataObject, null, function(oData) {
					MessageToast.show(sMessage);
				}, function(oError) {
					jQuery.sap.log.error(oError);
				});
			});

			// check if default key is already selected
			if (this._previousDefaultKey !== sDefaultKey && aRenamedVariants.length === 0) {
				var sSearchKey = sDefaultKey === "*standard*" ? this._previousDefaultKey : sDefaultKey;

				oVariantItem = $.grep(aVariantItems, function(oItem) {
					return oItem.getProperty("key") === sSearchKey;
				})[0];

				oBindingContext = oVariantItem.getBindingContext(this.config.paths.variantData);

				var oDataObject = oBindingContext.getObject();

				oDataObject.isDefault = sDefaultKey === "*standard*" ? 0 : 1;

				this._previousDefaultKey = sDefaultKey;

				sPathChange = oBindingContext.sPath.replace('VariantsGet', 'VariantsSet');

				oModel.update(sPathChange, oDataObject, {
					success: this._handleSuccessUpdateVariantModel.bind(this),
					error: this._handleErrorUpdateVariantModel.bind(this)
				});
			}

			oModel.refresh();
			oModel.updateBindings();
		},

		_handleSuccessUpdateVariantModel: function(oData, response) {
			var sVariantName, sPathChange;

			if (this._previousDefaultKey === "*standard*") {
				sVariantName = "Standard";
			} else {
				var sPath = response.requestUri.split(
					[this.getOwnerComponent().getMetadata().getConfig().serviceUrl, this.config.paths.variantService].join("")
				)[1];
				sPathChange = sPath.replace('VariantsSet', 'VariantsGet');
				sVariantName = this.getModel(this.config.paths.variantData).getProperty(sPathChange).VariantName;
			}

			this.getView().byId(this.config.ui.elements.variant).setDefaultVariantKey(this._previousDefaultKey);

			var msg = this.getResourceBundle().getText("variantUpdated", ["\"" + sVariantName + "\""]);
			MessageToast.show(msg);
		},

		_handleErrorUpdateVariantModel: function(oError) {
			jQuery.sap.log.error(oError);
		},

		_onDialogClose: function() {
			this.oSharedVariantPopover.close();
		},

		onManageSharedVariants: function(oEvent) {
			if (!this.oSharedVariantPopover) {
				var oMainModel = this.getModel("mainConfig");
				var oMsgBundle = this.getResourceBundle();
				var oButtonDelete = new sap.m.Button({
					text: "{i18n>msvd.btn.delete}",
					enabled: false,
					press: function() {
						var oVariantModel = this.getModel("variantData");
						var aSelectedItems = oList.getSelectedItems();
						var aPayLoad = [];
						var aUsers = [];
						$.each(aSelectedItems, function(index, oSelectedItem) {
							var oContext = oSelectedItem.getBindingContext("variantData");
							var sPath = oContext.getPath();
							var sUsers = oContext.getProperty("forUsers");

							aPayLoad.push(oVariantModel.createBatchOperation(sPath, "DELETE"));

							aUsers = sUsers.split(",");
							for (var i = 0; i < aUsers.length; i++) {
								var sUserPath = sPath.replace("Admin", aUsers[i]);

								aPayLoad.push(oVariantModel.createBatchOperation(sUserPath, "DELETE"));
							}
						});

						oVariantModel.addBatchChangeOperations(aPayLoad);

						oVariantModel.submitBatch(function(data) {
							if (aSelectedItems.length > 1) {
								sap.m.MessageToast.show(aSelectedItems.length + oMsgBundle.getText("msvd.msg.svwere"));
							} else {
								var sVariantName = aSelectedItems[0].getBindingContext("variantData").getProperty("VariantName");
								sap.m.MessageToast.show(oMsgBundle.getText("msvd.msg.svdeleted", ["\"" + sVariantName + "\""]));
							}
							oList.getBinding("items").refresh();
						}.bind(this), function(err) {
							jQuery.sap.log.error(err);
						});

					}.bind(this)
				});
				var oList = new sap.m.List({
					noDataText: "{i18n>msvd.list.msg}",
					mode: "MultiSelect",
					selectionChange: function() {
						if (this.getSelectedItems().length === 0) {
							oButtonDelete.setEnabled(false);
						} else {
							oButtonDelete.setEnabled(true);
						}
					}
				});
				var oMultiInputField = new sap.m.MultiInput({
					type: "Text",
					name: "USER_NAME",
					showValueHelp: true,
					valueHelpOnly: true,
					valueHelpRequest: [this._filterUserHelpRequest, this],
					tokenChange: function(oEvent) {
						if (this.getTokens().length === 0) {
							oEvent.getSource().setValueStateText(oMsgBundle.getText("msvd.msg.user"));
							oEvent.getSource().setValueState("Error");
						} else {
							oEvent.getSource().setValueState("None");
						}
					},
					value: {
						path: "variantData>forUsers",
						formatter: function(oValue) {
							var aUsers = oValue ? oValue.split(",") : [];
							if (aUsers[0]) {
								var aTokens = [];
								for (var iUser = 0; iUser < aUsers.length; iUser++) {
									aTokens.push(new sap.m.Token({
										key: aUsers[iUser],
										text: aUsers[iUser]
									}).data("row", {
										USER_NAME: aUsers[iUser]
									}));
								}
								this.setTokens(aTokens);
							}
						}
					}
				});
				var oInputField = new sap.m.Input({
					value: "{variantData>VariantName}",
					change: function(oEvent) {
						var sValue = oEvent.getParameter("value").trim();
						if (!sValue) {
							oEvent.getSource().setValueStateText(oMsgBundle.getText("msvd.msg.vnmissed"));
							oEvent.getSource().setValueState("Error");
						} else {
							oEvent.getSource().setValueState("None");
						}
					}
				});
				var oCheckBox = new sap.m.CheckBox({
					text: "{i18n>msvd.cb.default}",
					selected: {
						path: "variantData>isDefault",
						formatter: function(oValue) {
							return oValue === 1;
						}
					}
				});
				var that = this;
				//                var oFilterForm = new sap.ui.layout.form.Form();
				//                oFilterForm = this.byId("siemens.ui.filterbar")._createFiltersAndAdaptBasicArea();
				/** prepare filters **/
				//             var oFilterBar = this.byId(this.config.ui.elements.filterbar);
				//             var oLabel, oItem;
				//             for (var i = 0; i < oFilterBar._mAdvancedAreaFilter["__$INTERNAL$"].items.length; i++) {
				//                 oItem = oFilterBar._mAdvancedAreaFilter["__$INTERNAL$"].items[i];

				//                 if (oItem.control.getWidth) {
				// 		oItem.width = oItem.control.getWidth();

				// 		if (oItem.control.setWidth) {
				// 			oItem.control.setWidth("100%");
				// 		}
				// 	}

				// 	oLabel = oItem.filterItem.getLabelControl();
				// 	oLabel.setText(oItem.filterItem.getLabel());

				//             }
				var oCMPage = new sap.m.Page("siemensUiSharedCMForm", {
					title: "{i18n>variant.shared.text}",
					showNavButton: true,
					navButtonPress: function() {
						oNavCont.back();
						oCMPage.unbindElement("variantData");
						oMultiInputField.removeAllTokens();
						oInputField.setValueState("None");
						oMultiInputField.setValueState("None");
					},
					footer: [new sap.m.Toolbar({
						content: [new sap.m.ToolbarSpacer(), new sap.m.Button({
							text: "{i18n>msvd.btn.publish}",
							press: function() {
								if (oInputField.getValue().trim() === "") {
									oInputField.setValueState("Error");
									oInputField.setValueStateText(oMsgBundle.getText("msvd.msg.vname"));
									return;
								}
								if (oMultiInputField.getTokens().length === 0) {
									oMultiInputField.setValueState("Error");
									oMultiInputField.setValueStateText(oMsgBundle.getText("msvd.msg.user"));
									return;
								}
								var oCtx = oCMPage.getBindingContext("variantData");
								if (oCtx) {
									var bRenamed = false,
										bDefaultChanged = false;
									if (oInputField.getValue().trim() !== oCtx.getProperty("VariantName")) {
										bRenamed = true;
									}
									if (oCheckBox.getSelected() !== !!oCtx.getProperty("isDefault")) {
										bDefaultChanged = true;
									}
									var aUsers = oCtx.getProperty("forUsers").split(","),
										aCreatedUsers = [],
										sTokenText = "",
										aSharedUser = [],
										sUsers = "",
										iUserIndex;
									oMultiInputField.getTokens().map(function(oToken) {
										sTokenText = oToken.getProperty("text");
										iUserIndex = aUsers.indexOf(sTokenText);
										if (iUserIndex !== -1) {
											aSharedUser.push(sTokenText);
											aUsers.splice(iUserIndex, 1);
										} else {
											aCreatedUsers.push(sTokenText);
										}
										sUsers += sUsers === "" ? sTokenText : "," + sTokenText;
									});
									if (aUsers.length === 0 && aCreatedUsers.length === 0 && !bRenamed && !bDefaultChanged) {
										sap.m.MessageToast.show(oMsgBundle.getText("msvd.msg.ncvariant"));
										return;
									}

									var aTableColumns = that._getTableColumns();
									var aFilterFields = that._readVisibleFilters();

									var aPayLoad = [],
										oVariantModel = oCtx.oModel,
										sPath = oCtx.getPath().replace("VariantsGet", "VariantsSet"),
										aDevidedPath = sPath.split(","),
										oPayLoad = {
											CTRLID: oCtx.getProperty("CTRLID"),
											VariantId: oCtx.getProperty("VariantId"),
											UserId: oCtx.getProperty("UserId"),
											VariantName: bRenamed ? oInputField.getValue().trim() : oCtx.getProperty("VariantName"),
											isDefault: oCheckBox.getSelected() ? 1 : 0,
											isGlobal: 1,
											isHidden: 0,
											filterObject: encodeURI(JSON.stringify(that._getAppliedFilters())),
											forUsers: sUsers,
											tableColumns: encodeURI(JSON.stringify(aTableColumns)),
											filterFields: encodeURI(JSON.stringify(aFilterFields))
										};

									aPayLoad.push(oVariantModel.createBatchOperation(sPath, "PUT", oPayLoad));

									if (bDefaultChanged || bRenamed) {
										$.each(aSharedUser, function(index, sSharedUser) {
											var oPayLoadCpy = $.extend({}, oPayLoad);
											aDevidedPath[2] = aDevidedPath[2].substr(0, aDevidedPath[2].indexOf("'")) + "'" + sSharedUser.toUpperCase() + "'";
											oPayLoadCpy.UserId = sSharedUser.toUpperCase();
											oPayLoadCpy.forUsers = "";
											aPayLoad.push(oVariantModel.createBatchOperation(aDevidedPath + "", "PUT", oPayLoadCpy));
										});
									}
									if (aCreatedUsers.length > 0) {
										$.each(aCreatedUsers, function(index, sSharedUser) {
											var oPayLoadCpy = $.extend({}, oPayLoad);
											oPayLoadCpy.UserId = sSharedUser.toUpperCase();
											oPayLoadCpy.forUsers = "";
											aPayLoad.push(oVariantModel.createBatchOperation("/VariantsSet", "POST", oPayLoadCpy));
										});
									}
									if (aUsers.length > 0) {
										$.each(aUsers, function(index, sSharedUser) {
											var oPayLoadCpy = $.extend({}, oPayLoad);
											aDevidedPath[2] = aDevidedPath[2].substr(0, aDevidedPath[2].indexOf("'")) + "'" + sSharedUser.toUpperCase() + "'";
											oPayLoadCpy.UserId = sSharedUser.toUpperCase();
											oPayLoadCpy.forUsers = "";
											aPayLoad.push(oVariantModel.createBatchOperation(aDevidedPath + "", "DELETE", oPayLoadCpy));
										});
									}

									oVariantModel.addBatchChangeOperations(aPayLoad);

									oVariantModel.submitBatch(function(data) {
										sap.m.MessageToast.show(oMsgBundle.getText("msvd.msg.adjusted", ["\"" + oPayLoad.VariantName + "\""]));
										oList.getBinding("items").refresh();
										oNavCont.back();
										oCMPage.unbindElement("variantData");
										oMultiInputField.removeAllTokens();
										oMultiInputField.setValueState("None");
										// oVariantModel.refresh();  
										//      if (data.__batchResponses[0].__changeResponses) {
										//          var msg = this.getResourceBundle().getText("variantShared", ["\"" + sVariantName + "\"",data.__batchResponses[0].__changeResponses.length]);
										//          MessageToast.show(msg);
										//      } else {
										//          this._showVariantError("variantSharedError", sVariantName);
										//      }
									}.bind(this), function(err) {
										jQuery.sap.log.error(err);
									});
								} else {
									var sTokenText,
										sUsers = "",
										aUsers = [];
									oMultiInputField.getTokens().map(function(oToken) {
										sTokenText = oToken.getProperty("text");
										aUsers.push(sTokenText);
										sUsers += sUsers === "" ? sTokenText : "," + sTokenText;
									});

									var aTableColumns = that._getTableColumns();
									var aFilterFields = that._readVisibleFilters();

									var aPayLoad = [],
										oVariantModel = this.getModel("variantData"),
										oPayLoad = {
											CTRLID: oMainModel.getProperty("/CTRLID"),
											VariantId: "SV" + new Date().getTime().toString(),
											UserId: "Admin",
											VariantName: oInputField.getValue().trim(),
											isDefault: oCheckBox.getSelected() ? 1 : 0,
											isGlobal: 1,
											isHidden: 0,
											filterObject: encodeURI(JSON.stringify(that._getAppliedFilters())),
											forUsers: sUsers,
											tableColumns: encodeURI(JSON.stringify(aTableColumns)),
											filterFields: encodeURI(JSON.stringify(aFilterFields))
										};

									aPayLoad.push(oVariantModel.createBatchOperation("/VariantsSet", "POST", oPayLoad));

									$.each(aUsers, function(index, sSharedUser) {
										var oPayLoadCpy = $.extend({}, oPayLoad);
										oPayLoadCpy.UserId = sSharedUser.toUpperCase();
										oPayLoadCpy.forUsers = "";
										aPayLoad.push(oVariantModel.createBatchOperation("/VariantsSet", "POST", oPayLoadCpy));
									});

									oVariantModel.addBatchChangeOperations(aPayLoad);

									oVariantModel.submitBatch(function(data) {
										sap.m.MessageToast.show(oMsgBundle.getText("msvd.msg.created", ["\"" + oPayLoad.VariantName + "\""]));
										oList.getBinding("items").refresh();
										oNavCont.back();
										oCMPage.unbindElement("variantData");
										oMultiInputField.removeAllTokens();
										oMultiInputField.setValueState("None");
									}.bind(this), function(err) {
										jQuery.sap.log.error(err);
									});
								}
							}
						}), new sap.m.Button({
							text: "{i18n>msvd.btn.cancel}",
							press: function() {
								oNavCont.back();
								oCMPage.unbindElement("variantData");
								oMultiInputField.removeAllTokens();
								oMultiInputField.setValueState("None");
								oInputField.setValueState("None");
								that._onDialogClose();
							}
						})]
					})],
					content: [new sap.m.Label({
						text: "{i18n>msvd.lbl.name}"
					}).addStyleClass("sapMLabelRequired"), oInputField, new sap.ui.layout.Grid({
						defaultSpan: "L6 M6 S12",
						content: [oCheckBox]
					}), new sap.m.Label({
						text: "{i18n>variantSelectUsers}"
					}).addStyleClass("sapMLabelRequired"), oMultiInputField]
				}).addStyleClass("sapUiContentPadding");
				var oNavCont = new sap.m.NavContainer("siemensUiSharedNavContainer", {
					pages: [new sap.m.Page({
						title: "{i18n>variant.shared.text}",
						content: [oList],
						headerContent: [new sap.m.Button({
							icon: "sap-icon://refresh",
							press: function() {
								var oVariantModel = this.getModel("variantData");
								oVariantModel.refresh();
							}
						})],
						footer: [new sap.m.Toolbar({
							content: [new sap.m.ToolbarSpacer(), oButtonDelete, new sap.m.Button({
								text: "{i18n>msvd.btn.createnew}",
								press: function() {
									oNavCont.to(oCMPage);
								}
							}), new sap.m.Button({
								text: "{i18n>msvd.btn.cancel}",
								press: function() {
									that._onDialogClose();
								}
							})]
						})]
					}), oCMPage]
				});

				this.oSharedVariantPopover = new sap.m.Dialog({
					showHeader: false,
					contentWidth: '400px',
					placement: sap.m.PlacementType.Bottom,
					content: [oNavCont],
					contentHeight: '300px'
				});
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oSharedVariantPopover);
				oList.setModel(this.getModel("variantData"), "variantData");
				oList.bindItems({
					path: "variantData>/VariantsSet",
					filters: [new Filter([new Filter("isGlobal", FilterOperator.EQ, 1), new Filter("CTRLID", FilterOperator.EQ, oMainModel.getProperty("/CTRLID")), new Filter("forUsers", FilterOperator.NE, "")], true)],
					template: new sap.m.StandardListItem({
						title: "{variantData>VariantName}",
						type: sap.m.ListType.Navigation,
						press: function(oEvent) {
								var oCtx = oEvent.getSource().getBindingContext("variantData");
								oNavCont.to(oCMPage);
								oCMPage.bindElement("variantData>" + oCtx.getPath());
							}
							/*counter: {
							    path: "variantData>forUsers",
							    formatter: function(oValue) {
							        var aUsers = oValue.split(","),
							            iResult = 0;
							        if (aUsers[0]) {
							            iResult = aUsers.length;
							        }
							        return iResult;
							    }
							}*/
					})
				});
				this.getView().addDependent(this.oSharedVariantPopover);
			}
			var oButton = oEvent.getSource();
			jQuery.sap.delayedCall(0, this, function() {
				this.oSharedVariantPopover.open(oButton);
			});
		}

	});

});