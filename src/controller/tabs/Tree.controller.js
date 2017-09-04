sap.ui.define([
    "com/siemens/tableViewer/controller/BaseController",
    "com/siemens/tableViewer/control/CustomTablePersoController",
    "com/siemens/tableViewer/control/CustomColumn",
    "com/siemens/tableViewer/model/formatter",
    "com/siemens/tableViewer/model/models",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/ODataUtils",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/LabelDesign",
    "sap/m/MessageBox"
], function(BaseController, TablePersoController, Column, formatter, models, JSONModel, ODataUtils, Label, Text, LabelDesign, MessageBox) {
    "use strict";
    /* global $ */
    return BaseController.extend("com.siemens.tableViewer.controller.tabs.Tree", {
        config: {
            elements: {
                table: "siemensUiTree"
            },
            models: {
                mainConfig: "mainConfig",
                tableView: "treeView"
            },
            paths: {
                mainConfig: "mainConfig",
                columns: 'ColumnModel>/Columns',
                Data: '/Data',
                ServiceName: "/SERVICE_NAME",
                busy: '/busy',
                tableExportFormats: "tableExportFormats",
                exportService: "/odxl/odxl.xsjs"
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
                delay: 0
            });
            var oEventBus = this.getEventBus();
            var oMainConfigModel = this.getComponentModel("mainConfig");

            this.setModel(oViewModel, this.config.models.tableView);
            
            if (oMainConfigModel.getProperty("/ODATA_SRV")) {
                var sVisibleColumns = this._retrieveVisibleColumns(oMainConfigModel).visibleColumns;
                this._bindTable(sVisibleColumns);
            } else {
                this.treeDataDeffered = jQuery.Deferred();
                var sServiceUrl = this.getOwnerComponent().getMetadata().getConfig().serviceUrl +
                    this.getComponentModel(this.config.models.mainConfig).getProperty(this.config.paths.ServiceName);
    
                $.when(this.treeDataDeffered).done(this._bindTree).fail(this._handleFailedDataLoading);
    
                models.requestTreeData(sServiceUrl, this.treeDataDeffered, this);
            }

            // Set Model for Export Popover
            this.setModel(models.createTableExportFormatsModel(), this.config.paths.tableExportFormats);

            this._initializeTablePerso();

            oEventBus.subscribe("TableController", "RemoveFilters", this._setupFilters, this);
            oEventBus.subscribe("TableController", "SetupFilters", this._setupFilters, this);
            oEventBus.subscribe("TableController", "InputParameters", this._setupFilters, this);
        },
        
        onExit: function() {
            var oEventBus = this.getEventBus();
            oEventBus.unsubscribe("TableController", "RemoveFilters", this._setupFilters, this);
            oEventBus.unsubscribe("TableController", "SetupFilters", this._setupFilters, this);
            oEventBus.unsubscribe("TableController", "InputParameters", this._setupFilters, this);
        },

        /**
         * Table personalization dialog action
         * @public
         */
        onTablePersonalization: function() {
            this._oTPC.openDialog();

            if (this._oTPC._oDialog.mEventRegistry.confirm.length < 2) {
                this._oTPC._oDialog.attachEventOnce("confirm", function() {
                    this._requestNewData();
                }.bind(this));
            }
        },

        /**
         * Event handler when an export button is pressed
         * @public
         */
        onExportToExcel: function(oEvent) {
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

        /**
         * Event handler when an export button is pressed
         * @public
         */
        onExport: function(oEvent) {
            var oTable = this.getView().byId(this.config.elements.table),
                aColumns = oTable.getAggregation("columns"),
                sVisibleColumns = this._readVisibleColumns(aColumns),
                sExportService = this.getOwnerComponent().getMetadata().getConfig().serviceUrl,
                sFilterParams = this._lastAppliedFilters,
                oMainConfig = this.getComponentModel("mainConfig"),
                sDataSource = oMainConfig.getProperty("/DATA_SOURCE"),
                sSheetName = "data",
                sExportFileName = "export",
                sFormat = oEvent.getSource().data("id"),
                sExportURI = "";

            this._oExportFormatsPopover.close();

            sFilterParams = sFilterParams ? "&$filter=" + sFilterParams.replace(/&/g, "%26") : "";
            
            if (oMainConfig.getProperty("/ODATA_SRV")) {
                sExportURI = sExportService + this.config.paths.exportService + "/%22_SYS_BIC%22/%22" + sDataSource + "%22" + "?"
                            + "$select=" + sVisibleColumns
                            + sFilterParams
                            + "&" + "$format=" + sFormat
                            + "&" + "fieldsep=;"
                            + "&" + "sheetname=" + sSheetName
                            + "&" + "download=" + sExportFileName + "." + sFormat
                            + "&" + "langu=" + this.getAppLanguage();
            } else {
                sExportURI = sExportService + this.getComponentModel(this.config.models.mainConfig).getProperty(this.config.paths.ServiceName) + "?"
                            + "$select=" + sVisibleColumns
                            + sFilterParams
                            + "&" + "mode=export"
                            + "&" + "$format=" + sFormat
                            + "&" + "fieldsep=;"
                            + "&" + "sheetname=" + sSheetName
                            + "&" + "download=" + sExportFileName + "." + sFormat
                            + "&" + "langu=" + this.getAppLanguage();
            }

            window.open(sExportURI);
        },
        
        _retrieveVisibleColumns: function (oColumnModel) {
			var aColumns = oColumnModel.getProperty("/ServiceColumns/results"),
				sVisibleColumns = null,
				aAggregateColumns = [];

			$.grep(aColumns, function (oItem, iItemIndex) {
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
         * Bind Table if Hierarchy based on odata service
         * @param {string} [sVisibleColumns] - Visible columns for request
         * @return {void}
         */
        _bindTable: function(sVisibleColumns) {
            var oTable = this.byId(this.config.elements.table);
            
            oTable.bindAggregation("columns", "mainConfig>/ServiceColumns/results", this._columnsFactory.bind(this));
            
            this._bindRows(oTable, sVisibleColumns);
        },
        
        /**
         * Bind Odata Tree Table
         * @param {sap.ui.table.TreeTable} [oTable] - Tree Table
         * @param {string} [sVisibleColumns] - Visible columns for request
         * @return {void}
         */
        _bindRows: function(oTable, sVisibleColumns, aFilters) {
            oTable.bindRows({
				path: this.getEntityName(),
				parameters: {
				    treeAnnotationProperties : {
                        hierarchyLevelFor : 'LEVEL',
                        hierarchyNodeFor : 'QUERY_NODE',
                        hierarchyParentNodeFor : 'PRED_NODE',
                        hierarchyDrillStateFor : 'IS_LEAF'
                    },
					select: sVisibleColumns
				},
				filters: aFilters,
				events: {
				    dataRequested: function() {
//				        oTable.setBusy(true);
				        this.getBusyDialog().open();
				    }.bind(this),
				    dataReceived: function() {
//				        oTable.setBusy(false);
				        this.getBusyDialog().close();
				    }.bind(this)
				}
            });
        },

        /**
         * Generates a column for a table with all settings
         * @private
         * @param {string} sId - ID for the column
         * @param {object} oContext - Column information from model
         * @returns {object} Newly generated column
         */
        _columnsFactory: function(sId, oContext) {
            var sModel = "";
            if (this.getModel("mainConfig").getProperty("/ODATA_SRV")) {
                sModel = "mainConfig>";
            } else {
                sModel = "ColumnModel>";
            }
            
            var oLabel = new Label({
                text: "{" + sModel + "LABEL}",
                design: {
                    path: sModel + "IS_KFG",
                    formatter: formatter.columnLabelDesign
                }
            });

            // Get first column for adding buttons
            if (oContext.sPath.substr(oContext.sPath.length - 1) === "0" && this.firstColumn !== false) {
                this.firstColumn = false;
                oLabel = new sap.ui.layout.FixFlex({
                    fixContent: [

                        new Label({
                            text: "{" + sModel + "LABEL}",
                            design: {
                                path: sModel + "IS_KFG",
                                formatter: formatter.columnLabelDesign
                            }
                        }),

                        new sap.ui.layout.FixFlex({
                            vertical: false,
                            fixFirst: false,
                            fixContent: [
                                new sap.m.Button({
                                    icon: "sap-icon://expand",
                                    press: jQuery.proxy(function() {
                                        this._expandAll();
                                    }, this)
                                }).addStyleClass("sapUiTinyMarginEnd"),

                                new sap.m.Button({
                                    icon: "sap-icon://collapse",
                                    press: jQuery.proxy(function() {
                                        this._collapseAll();
                                    }, this)
                                })
                            ]
                        })
                    ]
                });
            }


            var oTemplate = new Text({
                //				text: "{" + oContext.getProperty("COLUMN") + "}"
                text: {
                    path: oContext.getProperty("COLUMN"),
                    type: formatter.getDataTypeInstance(oContext.getProperty("CTYPE"))
                }
            });

            var oUIControl = new Column(sId, {
                visible: {
                    path: sModel + "STDRD",
                    formatter: function(oValue) {
                        return oValue === 1;
                    }
                },
                label: oLabel,
                template: oTemplate,
                autoResizable: true,
                supportHidden: {
                    path: sModel + "SUPPORT_HIDDEN",
                    formatter: function(oValue) {
                        return oValue === 1;
                    }
                },
                hAlign: {
                    path: sModel + "IS_KFG",
                    formatter: formatter.alignColumn
                },
                width: "{" + sModel + "CWIDTH}",
                tooltip: "{" + sModel + "DESCRIPTION}"
            }).data("COLUMN", "{" + sModel + "COLUMN}");

            return oUIControl;
        },

        /**
         * Setup filters before requesting for a new data
         * @private
         * @param {string} sChannel - Channel of the fired event
         * @param {string} sEvent - ID of the fired event
         * @param {object} oData - Parameters that should carried by event
         */
        _setupFilters: function(sChannel, sEvent, oData) {
            if (oData.hash === "Tree") {
                if (sEvent === "InputParameters") {
                    this._requestNewData();
                    return;
                }
                var oMainConfigModel = this.getComponentModel("mainConfig");
                            
                if (oMainConfigModel.getProperty("/ODATA_SRV")) {
                    this._setupOdataFilters(sChannel, sEvent, oData);
                } else {
                    this._setupXsjsFilters(sChannel, sEvent, oData);
                }
            }
        },
        
        _setupOdataFilters: function(sChannel, sEvent, oData) {
            var oTable = this.getView().byId(this.config.elements.table),
				oTableBinding = oTable.getBinding("rows"),
				aFilters;
			// Set Filter if it is corresponding event
			if (sEvent === "SetupFilters") {
				if (oData.mainFilters.aFilters.length > 0) {
					aFilters = oData.mainFilters;
				}
			}
			
			var oEventBus = this.getEventBus();
			oEventBus.publish("TableViewer", "SetVisibleColumn");
			// Check if filters already applied
			if ((!oTable.aFilters && aFilters) || (oTable.aFilters && !aFilters) || (oTableBinding.aFilters && JSON.stringify(aFilters) !== JSON.stringify(oTableBinding.aFilters[0]))) {
				var aColumns = oTable.getAggregation("columns"),
					sVisibleColumns = this._readVisibleColumns(aColumns);
					
				this._bindRows(oTable, sVisibleColumns, aFilters);
			}
        },
        
        _setupXsjsFilters: function(sChannel, sEvent, oData) {
            var sFilterString;
            
            this._oSetupFilterObj = {
        		bIsFilterSet : true,
        		sChannel : sChannel,
        		sEvent : sEvent,
        		oOData : oData
        	};

            // Set Filter if it is corresponding event
            if (sEvent === "SetupFilters") {
                if (oData.mainFilters.aFilters.length > 0) {
                    // Simulate oDataModel function to get metadata property
                    var oSimulateOdata = {
                        _getPropertyMetadata: function(oColumnModel, sPath) {
                            var aColumns = oColumnModel["aColumns"],
                                oType;

                            $.grep(aColumns, function(oColumn) {
                                if (oColumn.COLUMN === sPath && oColumn.CTYPE === 11) {
                                    oType = {
                                        type: "Edm.String"
                                    };
                                    return;
                                }
                            });

                            return oType;
                        }
                    };
                    
                    if (!this.getModel()) {
                        this._oSetupFilterObj.bIsFilterSet = false;
                        return;
                    }

                    var oColumnModel = {
                        aColumns: this.getModel().getProperty("/Columns")
                    };

                    sFilterString = unescape(ODataUtils.createFilterParams([oData.mainFilters], oSimulateOdata, oColumnModel).substring(8));
                }
            }
            // Check if filters already applied
            if (this._lastAppliedFilters !== sFilterString) {
                this._lastAppliedFilters = sFilterString;

                this._requestNewData();
            }
        },

        /**
         * Expands all columns
         * @private
         */
        _expandAll: function() {
            var oTable = this.getView().byId(this.config.elements.table);
            for (var iRow = 0; iRow < oTable.getBinding("rows").getLength(); iRow++) {
                oTable.expand(iRow);
            }
        },

        /**
         * Collapse all columns
         * @private
         */
        _collapseAll: function() {
            var oTable = this.getView().byId(this.config.elements.table);
            oTable.setFirstVisibleRow(0); // Otherwise busy indicator will be forever
            for (var iRow = oTable.getBinding("rows").getLength() - 1; iRow >= 0; iRow--) {
                oTable.collapse(iRow);
            }
        },

        /**
         * Bind JSON model data to Tree Table
         * @private
         * @param {sap.ui.model.json.JSONModel} oTreeModel - Tree model instance
         * @param {object} oController - Tree controller instance
         */
        _bindTree: function(oTreeModel, oController) {
        	var iLimit;
            // set busy indicator false
            oController.getModel(oController.config.models.tableView).setProperty(oController.config.paths.busy, false);
            //oTreeModel.setSizeLimit(Number.MAX_SAFE_INTEGER);
            //Number.MAX_SAFE_INTEGER does not work in IE. Works only with chrome. Hence using Math.pow which gives exactly same value as Max safe integer.
            iLimit = Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : Math.pow(2, 53) - 1;
            oTreeModel.setSizeLimit(iLimit);
            oController.setModel(oTreeModel);

            // Attach model request to enable/disable busy indicator
            oController.attachRequestsForModel(oTreeModel, oController.getModel(oController.config.models.tableView));

            var oTable = oController.byId(oController.config.elements.table);

            // Set independent column model
            var oColumnModel = new JSONModel({
                Columns: oTreeModel.getProperty("/Columns")
            });
            oTable.setModel(oColumnModel, "ColumnModel");

            oTable.bindRows({
                path: oController.config.paths.Data
            });

            oTable.bindAggregation("columns", oController.config.paths.columns, oController._columnsFactory.bind(oController));
            
            if (oController._oSetupFilterObj && !oController._oSetupFilterObj.bIsFilterSet) {
            	oController._setupFilters(oController._oSetupFilterObj.sChannel,oController._oSetupFilterObj.sEvent,oController._oSetupFilterObj.oOData);	
            }
        },

        /**
         * Handle failed request from xsjx service
         * @private
         * @param {object} XMLHttpRequest - Failed response
         * @param {string} sTextStatus - Response status
         * @param {object} oController - Tree controller instance
         */
        _handleFailedDataLoading: function(XMLHttpRequest, sTextStatus, oController) {
            MessageBox.show(
                oController.getResourceBundle().getText("errorText"), {
                    icon: MessageBox.Icon.ERROR,
                    title: sTextStatus,
                    details: XMLHttpRequest.responseText,
                    styleClass: oController.getOwnerComponent().getContentDensityClass(),
                    actions: [MessageBox.Action.CLOSE],
                    onClose: function() {}
                }
            );
            oController.getModel(oController.config.models.tableView).setProperty(oController.config.paths.busy, false);
        },

        /**
         * Initialize table personalization
         * @private
         */
        _initializeTablePerso: function() {
            this._oTPC = new TablePersoController({
                table: this.getView().byId(this.config.elements.table),
                componentName: "com.siemens.tableViewer"
            });
        },

        /**
         * Requests new data from database based on visible columns
         * @private
         */
        _requestNewData: function() {
            var oTable = this.getView().byId(this.config.elements.table),
                aColumns = oTable.getAggregation("columns"),
                sVisibleColumns = this._readVisibleColumns(aColumns),
                oMainConfigModel = this.getModel("mainConfig");
            
            if (oMainConfigModel.getProperty("/ODATA_SRV")) {
            	this.attachRequestsForControlBusyIndicator(this.getComponentModel(), oTable);
                this._bindRows(oTable, sVisibleColumns, oTable.getBinding("rows").aFilters);
            } else {
                this._requestJsonData(oTable, sVisibleColumns, this._lastAppliedFilters);
            }
            
        },

        /**
         * Request to load new data from backend (support selecting and filtering data)
         * @private
         * @param {sap.ui.table.treetable} oTable - Tree table instance
         * @param {string} sVisibleColumns - Visible columns in string for selecting parameter
         * @param {string} sFilters - Completed filter string
         */
        _requestJsonData: function(oTable, sVisibleColumns, sFilters) {
            var sServiceUrl = this.getOwnerComponent().getMetadata().getConfig().serviceUrl +
                this.getComponentModel(this.config.models.mainConfig).getProperty(this.config.paths.ServiceName);
            var oJsonModel = oTable.getModel();

            oJsonModel.loadData(sServiceUrl, {
                "$select": sVisibleColumns,
                "$filter": sFilters
            });
        },

        /**
         * Retrieve the visibility of columns from table
         * @private
         * @param {array} aColumns - all columns that currently are in table
         * @returns {string} string of visible column concatenation
         */
        _readVisibleColumns: function(aColumns) {
            var sVisibleColumns = "";
            var sColumnName = "";

            for (var iColumn = 0; iColumn < aColumns.length; iColumn++) {
                if (aColumns[iColumn].getProperty("visible")) {
                    sColumnName = aColumns[iColumn].getSortProperty() ? aColumns[iColumn].getSortProperty() : aColumns[iColumn].getCustomData()[0].getValue();
                    sVisibleColumns += sVisibleColumns === "" ? sColumnName : "," + sColumnName;
                }
            }

            return sVisibleColumns;
        },
        
        onToggleFullScreen: function (oEvent) {
			this.getEventBus().publish("TableViewer", "FullMode");
			var oTable = this.byId("siemensUiTree"),
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
				oTable.setVisibleRowCount(15);
			}
		}
    });
});