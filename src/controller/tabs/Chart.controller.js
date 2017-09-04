sap.ui.define([
    "com/siemens/tableViewer/controller/BaseController",
    "com/siemens/tableViewer/control/Chart",
    "com/siemens/tableViewer/control/ChartDimension",
    "com/siemens/tableViewer/control/ChartMeasure",
    "com/siemens/tableViewer/control/ChartBackgroundColor",
    "com/siemens/tableViewer/control/ChartBorderColorData",
    "com/siemens/tableViewer/model/formatter",
    "com/siemens/tableViewer/model/models",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter",
    "sap/ui/core/Fragment",
    "sap/m/Button",
    "sap/m/List",
    "sap/m/MessageBox",
    "sap/m/ComboBox",
    "sap/m/Panel",
    "sap/m/Popover",
    "sap/m/StandardListItem",
    "sap/m/Text",
    "sap/m/Title",
    "sap/m/ToggleButton",
    "sap/m/Toolbar",
    "sap/m/ToolbarSpacer",
    "sap/m/VBox",
    "sap/m/ViewSettingsDialog",
    "sap/m/ViewSettingsItem",
    "sap/m/ViewSettingsFilterItem"
], function(BaseController, ChartControl, ChartDimension, ChartMeasure, ChartBackgroundColor, ChartBorderColorData, formatter, models, JSONModel, FilterOperator, Filter, Fragment, Button, List, MessageBox, ComboBox, Panel, Popover, StandardListItem, Text, Title, ToggleButton, Toolbar, ToolbarSpacer, VBox, ViewSettingsDialog, ViewSettingsItem, ViewSettingsFilterItem) {
    "use strict";
    return BaseController.extend("com.siemens.tableViewer.controller.tabs.Chart", {
        /**
         * Constants for Chart Controller
         */
        config: {
            ui: {
                elements: {
                    chart: "siemensUiChart",
                    chartsGrid: "siemensUiChartsGrid",
                    chartTypeButton: "chartTypeButton"
                }
            },
            paths: {
                chartsEntity: "/Charts",
                chartDimensionsMeasures: "ChartsDimensionsMeasures",
                chartButtonsTypes: "ChartButtonsTypes",
                mainConfig: "mainConfig"
            },
            limitations: {
                chartLimitation: 5000,
                chartLimitationMeasures: 4
            },
            icons: {
                bar: "bar-chart",
                line: "line-chart",
                pie: "pie-chart",
                radar: "radar-chart",
                line_bar: "line-chart-dual-axis",
                combine: "multiple-line-chart",
                stacked: "upstacked-chart"
            }
        },

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */
        /**
         * Called when the table controller is instantiated.
         * @public
         */
        onInit: function() {
            var oConfigModel = this.getComponentModel(this.config.paths.mainConfig),
                oFilter = new Filter("CTRLID", FilterOperator.EQ, oConfigModel.getProperty("/CTRLID")),
                oRouter = this.getRouter(),
                oEventBus = this.getEventBus();

            this._chartsNames = "";

            var fnInitializeCharts;
            fnInitializeCharts = function() {
                models.requestChartsDimensionsMeasures(
                    this.getComponentModel("main"),
                    this.config.paths.chartsEntity, {
                        "$expand": this.config.paths.chartDimensionsMeasures
                    }, [oFilter],
                    this._handleSuccessDimensionsMeasuresRequest.bind(this),
                    this._handleErrorDimensionsMeasuresRequest.bind(this)
                );

                oRouter.attachRoutePatternMatched(this._onRouteMatched, this);
                var oVariantModel = this.getModel("variantData");
                if (!(oVariantModel && oVariantModel.aPendingRequestHandles.length > 0 && !oVariantModel.bDefault)) {
                    this._onChartMatched();
                }
            }.bind(this);
            this.getOwnerComponent().oWhenMetadataIsLoaded.then(fnInitializeCharts, fnInitializeCharts);

            oEventBus.subscribe("TableController", "SetVariantSelect", this._setVariantSelect, this)
                .subscribe("TableController", "SetupFilters", this.onFilterSetup, this)
                .subscribe("TableController", "RemoveFilters", this.onFilterSetup, this)
                .subscribe("TableController", "InputParameters", this.onFilterSetup, this);
        },

        /**
         * Handle Chart expand button pressed
         * @param {sap.ui.base.Event} oEvent - the button pressed event
         * @return {void}
         * @public
         */
        onChartExpandButtonPressed: function(oEvent) {
            this.getEventBus().publish("TableViewer", "FullMode");
            var oButton = oEvent.getSource();
            var sChartId = oButton.data("chartId");
            var oVisibilityModel = this.getModel("ChartVisibility");
            var oVisibility = oVisibilityModel.oData;
            var iChartsCount = 0;
            var iChartIndex;

            for (var sKey in oVisibility) {
                if (oVisibility.hasOwnProperty(sKey)) {
                    iChartsCount++;

                    if (sKey !== sChartId) {
                        oVisibilityModel.setProperty("/" + sKey, !oVisibility[sKey]);
                    } else {
                        iChartIndex = iChartsCount;
                    }
                }
            }

            var oGrid = this.getView().byId(this.config.ui.elements.chartsGrid);
            var oPanel = oButton.getParent().getParent();
            var oChartModel = this.getModel(sChartId);
            var bMatched = oButton.getProperty("icon") === "sap-icon://full-screen";
            var sGridSpan;
            var sPanelSpan;
            var sIcon;

            if (bMatched) {
                sGridSpan = sPanelSpan = "L12 M12 S12";
                sIcon = "sap-icon://exit-full-screen";
            } else {
                sGridSpan = sPanelSpan = this._setChartLayout(iChartIndex);
                sIcon = "sap-icon://full-screen";
            }

            oGrid.setDefaultSpan(sGridSpan);
            oPanel.getLayoutData().setSpan(sPanelSpan);
            oChartModel.setProperty("/expandButton/icon", sIcon);
            oChartModel.setProperty("/expandButton/pressed", bMatched);
            oChartModel.setProperty("/chartSettings/expanded", bMatched);
        },

        /**
         * Event handler when a change chart type button is pressed.
         * It creates {sap.m.Popover} that shows the list of chart types.
         * @param {sap.ui.base.Event} oEvent - the button pressed event
         * @return {void}
         * @public
         */
        onChartTypeButtonPressed: function(oEvent) {
            var sChartId = oEvent.getSource().getCustomData()[0].getProperty("value"),
                sCharButtonsType = sChartId + this.config.paths.chartButtonsTypes;

            if (!this.getModel(sChartId).getProperty("/ChartTypePopover")) {
                this.getView().setModel(models.createChartButtonsModel(this.getResourceBundle()), sCharButtonsType);

                var oList = new List({});

                var oPopover = new Popover({
                    placement: "Bottom",
                    showHeader: false,
                    content: [oList]
                });

                var oListTemplate = new StandardListItem({
                    title: {
                        path: sCharButtonsType + ">title"
                    },
                    icon: {
                        path: sCharButtonsType + ">icon"
                    },
                    visible: {
                        path: sCharButtonsType + ">enabled"
                    },
                    press: this.onChangeChartType.bind.apply(this.onChangeChartType, [this].concat([sChartId])),
                    type: {
                        path: sCharButtonsType + ">type"
                    }
                });

                oList.bindAggregation("items", sCharButtonsType + ">/buttons", oListTemplate);

                this.getView().addDependent(oPopover);

                // add compact styles
                jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oPopover);

                this.getModel(sChartId).setProperty("/ChartTypePopover", oPopover);
            }

            // open popover with 0 delay
            var oButton = oEvent.getSource();
            jQuery.sap.delayedCall(0, this, function() {
                this.getModel(sChartId).getProperty("/ChartTypePopover").openBy(oButton);
            });
        },

        /**
         * Event handler when a user selects a new chart type from Popover's list
         * @param {string} sChartId - Chart ID
         * @param {sap.ui.base.Event} oEvent - the Popover's List press event
         * @return {void}
         * @public
         */
        onChangeChartType: function(sChartId, oEvent) {
            var oContext = oEvent.getSource().getBindingContext(sChartId + this.config.paths.chartButtonsTypes),
                sSelectedChartType = oContext.getProperty("id"),
                sSelectedIcon = oContext.getProperty("icon");

            var aDimensions = this.getModel(sChartId).getData().dimensions;
            if (sSelectedChartType === 'line_bar' && aDimensions.length > 0) {
                this._getChartDialog(sChartId, oContext, sSelectedChartType, sSelectedIcon);
            } else {
                this.getModel(sChartId).setProperty("/typeButton/icon", sSelectedIcon);
                this.getModel(sChartId).setProperty("/chartSettings/type", sSelectedChartType);
            }

            this.getModel(sChartId).getProperty("/ChartTypePopover").close();
        },

        _setVariantSelect: function() {
            this.getGlobalVariableModel().setProperty("/vSelEvent", "X");
        },

        /**
         * Method for getting error message if measures count more than in limitation parameter
         * @param {string} iSelectedMeasuresCount - Measures count
         * @param {string} sChartId - Chart ID
         * @return {void}
         * @public
         */
        _getErrorMeasureCount: function(iSelectedMeasuresCount, sChartId) {
            var oErrorData = {
                title: this.getModel(sChartId).getProperty("/title") + " - " + this.getResourceBundle().getText("errorTitle"),
                icon: MessageBox.Icon.ERROR,
                actions: [MessageBox.Action.ABORT],
                message: this.getResourceBundle().getText("loadChartDataMeasureLimitationErrorMessage", [iSelectedMeasuresCount, this.config.limitations.chartLimitationMeasures])
            };
            MessageBox.show(oErrorData.message, {
                icon: oErrorData.icon,
                title: oErrorData.title,
                actions: oErrorData.actions,
                defaultAction: MessageBox.Action.ABORT,
                styleClass: this.getOwnerComponent().getContentDensityClass(),
                onClose: function(oAction) {}
            });
        },

        // **************************************************************************************************************
        // ************************************** Highcharts Options START **********************************************
        // **************************************************************************************************************
        /**
         * Method for getting chart options dialog
         * @param {string} sChartId - Chart ID
         * @param {object} oContext - Context
         * @param {string} sSelectedChartType - Chart Type
         * @param {string} sSelectedIcon - Chart Icon
         * @returns {void}
         * @public
         */
        _getChartDialog: function(sChartId, oContext, sSelectedChartType, sSelectedIcon) {
            // calling the fragment for the action
            if (!this.oDialogChart) {
                this.oDialogChart = sap.ui.xmlfragment(this._getHighchartOptionsFragDiagId(), "com.siemens.tableViewer/view/tabs/fragments/HighchartOptionsDialog", this); // associate controller with the fragment
                //set the fragment as the dependent to the view
                this.getView().addDependent(this.oDialogChart);
                this.oDialogChart.data("chartId", sChartId).data("chartType", sSelectedChartType).data("chartIcon", sSelectedIcon);
            }

            var aMeasures, oHighchartOptionsModel;
            aMeasures = this.getModel(sChartId).getData().measures;

            oHighchartOptionsModel = new JSONModel();
            oHighchartOptionsModel.setData(aMeasures);
            this.setModel(oHighchartOptionsModel, "highchartOptionsModel");

            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oDialogChart);
            this.oDialogChart.open();
        },

        /**
         * Function which create dialog content before opening the dialog itself
         * @returns {void}
         * @public
         */
        onBeforeOpenHighchartOptionsDialog: function() {
            var oHighchartOptionsModel = this.getModel("highchartOptionsModel"),
                aMeasures = oHighchartOptionsModel.oData,
                oForm = this._getHighchartOptionsForm();

            for (var i = 0; i < aMeasures.length; i++) {
                oForm.addContent(new sap.m.Label({
                    text: aMeasures[i].LABEL,
                    tooltip: aMeasures[i].LABEL
                }));

                var oControlChartType = new sap.m.ComboBox({
                    value: "{highchartOptionsModel>/" + i + "/CHARTTYPE}",
                    placeholder: "Choose Type",
                    tooltip: "Choose Type"
                });

                oControlChartType.addStyleClass("sapUiSmallMarginEnd");

                oForm.addContent(oControlChartType.addItem(
                        new sap.ui.core.ListItem("spline_" + aMeasures[i].COLUMN, {
                            text: "Line Chart",
                            key: "spline"
                        }))
                    .addItem(
                        new sap.ui.core.ListItem("column_" + aMeasures[i].COLUMN, {
                            text: "Column Chart",
                            key: "column"
                        }))
                );

                // ComboBox with Group for each measure
                var sSelectedChartGrouping = "{highchartOptionsModel>/" + i + "/CHARTGROUP}";
                var oControlChartGrouping = new sap.m.ComboBox({
                    value: sSelectedChartGrouping,
                    placeholder: "Choose Group",
                    tooltip: "Choose Group"
                });

                oControlChartGrouping.addStyleClass("sapUiSmallMarginEnd");
                for (var j = 0; j < aMeasures.length; j++) {
                    var iMeasureNumber = j + 1;
                    oForm.addContent(oControlChartGrouping.addItem(
                        new sap.ui.core.ListItem({
                            text: iMeasureNumber + " Group",
                            key: j
                        })));
                }
            }
        },

        /**
         * Helper method to return the instance of simple form control in chart options dialog
         * @returns {Object} - Instance of Simple form control
         * @private
         */
        _getHighchartOptionsForm: function() {
            return this._getFragmentControl(this._getHighchartOptionsFragDiagId(), "siemensHighchartOptionsForm");
        },

        /**
         * Returns a control from fragment with provided fragment id
         * @param   {string} sFragId - fragment id
         * @param   {string} sControlId - control id
         * @returns {sap.ui.core.Control} - Control inside fragment
         * @private
         */
        _getFragmentControl: function(sFragId, sControlId) {
            return Fragment.byId(sFragId, sControlId);
        },

        /**
         * Helper method to return the instance of chart options dialog control
         * @returns {string} - Id of chart options dialog control
         * @private
         */
        _getHighchartOptionsFragDiagId: function() {
            return this.createId("tvFragHighchartOptionsDialog");
        },

        /**
         * Event handler when a user press "OK" button in the Chart Options dialog
         * @returns {void}
         * @public
         */
        onHighchartsOk: function() {
            var sChartId = this.oDialogChart.getCustomData()[0].getProperty("value"),
                oHighchartOptionsModel = this.getModel("highchartOptionsModel"),
                sSelectedChartType = this.oDialogChart.getCustomData()[1].getProperty("value"),
                sSelectedIcon = this.oDialogChart.getCustomData()[2].getProperty("value"),
                aMeasures = oHighchartOptionsModel.oData;

            for (var i = 0; i < aMeasures.length; i++) {
                var sSelectedItem = oHighchartOptionsModel.getProperty("/" + i + "").CHARTTYPE;
                var sSelectedGroup = oHighchartOptionsModel.getProperty("/" + i + "").CHARTGROUP;
                aMeasures[i].CHARTTYPE = (sSelectedItem && sSelectedItem !== undefined && sSelectedItem !== "") ? sSelectedItem : "Column Chart";
                aMeasures[i].CHARTGROUP = (sSelectedGroup && sSelectedGroup !== undefined && sSelectedGroup !== "") ? sSelectedGroup : "0";
            }

            //check
            this.getModel(sChartId).setProperty("/typeButton/icon", sSelectedIcon);
            this.getModel(sChartId).setProperty("/chartSettings/type", sSelectedChartType);
            this._setChartData(sChartId);

            if (this.oDialogChart) {
                this.oDialogChart.destroy();
                this.oDialogChart = null;
            }
        },

        /**
         * Event handler when a user press "CANCEL" button in the Chart Options dialog
         * @param {sap.ui.base.Event} oEvent - the Chart options dialog "CANCEL"
         * @returns {void}
         * @public
         */
        onHighchartsCancel: function() {
            if (this.oDialogChart) {
                this.oDialogChart.destroy();
                this.oDialogChart = null;
            }
        },

        /**
         * Event handler when a change chart measures and dimensions is pressed
         * @param {sap.ui.base.Event} oEvent - the button pressed event
         * @return {void}
         * @public
         */
        onChartDimensionMeasureButtonPressed: function(oEvent) {
            var sChartId = oEvent.getSource().getCustomData()[0].getProperty("value");

            if (!this.getModel(sChartId).getProperty("/ChartDimensionsMeasuresDialog")) {
                var oViewSettingsFilterItemMeasures = new ViewSettingsFilterItem({
                    key: "measures",
                    text: {
                        path: "i18n>ChartFilterMeasures"
                    },
                    multiSelect: true
                });

                var oViewSettingsFilterItemDimensions = new ViewSettingsFilterItem({
                    key: "dimensions",
                    text: {
                        path: "i18n>ChartFilterDimensions"
                    },
                    multiSelect: true
                });

                var oViewSettingsDialog = new ViewSettingsDialog({
                    confirm: this.handleChartSettingsConfirm.bind.apply(this.handleChartSettingsConfirm, [this].concat([sChartId])),
                    resetFilters: this.handleChartSettingsDialogResetFilters.bind.apply(this.handleChartSettingsDialogResetFilters, [this].concat([sChartId])),
                    filterItems: [oViewSettingsFilterItemMeasures, oViewSettingsFilterItemDimensions]
                });

                var oViewSettingsItemTemplate = new ViewSettingsItem({
                    text: {
                        path: sChartId + ">LABEL"
                    },
                    key: {
                        path: sChartId + ">COLUMN"
                    },
                    selected: {
                        path: sChartId + ">SELECTED"
                    }
                });

                oViewSettingsFilterItemMeasures.bindAggregation("items", sChartId + ">/chartDimensionsMeasures/measures", oViewSettingsItemTemplate);
                oViewSettingsFilterItemDimensions.bindAggregation("items", sChartId + ">/chartDimensionsMeasures/dimensions", oViewSettingsItemTemplate);

                this.getView().addDependent(oViewSettingsDialog);

                // add compact styles
                jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oViewSettingsDialog);

                this.getModel(sChartId).setProperty("/ChartDimensionsMeasuresDialog", oViewSettingsDialog);
            }

            jQuery.sap.delayedCall(0, this, function() {
                this.getModel(sChartId).getProperty("/ChartDimensionsMeasuresDialog").open("filter");
            });
        },

        /**
         * Event handler when a dimension and measures dialog is closed with OK button
         * @param {string} sChartId - Chart ID
         * @return {void}
         * @public
         */
        handleChartSettingsConfirm: function(sChartId) {
            var aSorters = this._lastAppliedSorters;
            this._onModelRequestChartData(this._handleCountRequestSuccess, "/$count/", sChartId, this._lastAppliedFilters, aSorters);

        },

        /**
         * Event handler when a user would like to reset his filters and restore icon has been pressed
         * @param {string} sChartId - Chart ID
         * @return {void}
         * @public
         */
        handleChartSettingsDialogResetFilters: function(sChartId) {
            this.getModel(sChartId).setProperty("/chartDimensionsMeasures", models.createDimensionMeasures(this.getModel(sChartId).getProperty("/oChart")[this.config.paths.chartDimensionsMeasures].results, sChartId));
        },

        /**
         * Create request for data based on received filter parameters
         * @param {string} sChannel - Received channel name
         * @param {string} sEvent - EventBus event name
         * @param {object} oData - Object containing hash and filter parameters
         * @return {void}
         * @public
         */
        onFilterSetup: function(sChannel, sEvent, oData) {
            if (oData.hash === "Chart" || oData.hash === "Mix") {
                var aChartIds = this._chartsNames.split(",");
                var oEventBus = this.getEventBus();

                if (sEvent === "InputParameters") {
                    aChartIds.map(function(sChartId) {
                        this.handleChartSettingsConfirm(sChartId);
                    }.bind(this));
                } else {
                    var aFilters, aSorters;
                    // Set Filter if it is corresponding event
                    if (sEvent === "SetupFilters") {
                        if (oData.mainFilters.aFilters.length > 0) {
                            aFilters = oData.mainFilters;
                        }
                    }

                    if (oData.mainSorters) {
                        if (oData.mainSorters.length > 0) {
                            aSorters = oData.mainSorters;
                        }
                    }

                    var bVselEvent = this.getGlobalVariableModel().getProperty("/vSelEvent");
                    if (bVselEvent === "X") {
                        this.getGlobalVariableModel().setProperty("/vSelEvent", "");
                        oEventBus.publish("TableViewer", "SetVisibleFilter");
                    }

                    // Check if filters already applied
                    //if (JSON.stringify(aFilters) !== JSON.stringify(this._lastAppliedFilters)) {
                    if (!this.hasOwnProperty("_lastAppliedFilters") || JSON.stringify(aFilters) !== JSON.stringify(this._lastAppliedFilters) ||
                        JSON.stringify(aSorters) !== JSON.stringify(this._lastAppliedSorters)) {
                        aChartIds.map(function(sChartId) {
                            // Check if model exist (initial loading)
                            if (this.getModel(sChartId + "Data")) {
                                this.getModel(sChartId + "Data").setProperty("/measures", []);
                                this.getModel(sChartId + "Data").setProperty("/dimensions", []);
                                this._onModelRequestChartData(this._handleCountRequestSuccess, "/$count/", sChartId, aFilters, aSorters);
                            }
                        }.bind(this));
                    }

                    this._lastAppliedFilters = oData.mainFilters;
                    this._lastAppliedSorters = oData.mainSorters;
                }
            }
        },

        /**
         * Called when the table controller is destroyed
         * @return {void}
         * @public
         */
        onExit: function() {
            var oEventBus = this.getEventBus();
            oEventBus.unsubscribe("TableController", "RemoveFilters", this.onFilterSetup, this);
            oEventBus.unsubscribe("TableController", "SetupFilters", this.onFilterSetup, this);
            oEventBus.unsubscribe("TableController", "InputParameters", this.onFilterSetup, this);
            oEventBus.unsubscribe("TableController", "SetVariantSelect", this._setVariantSelect, this);
        },

        /**
         * Method to get the initial sorters configured for columns in config table
         * @returns {Array} - sorters from config table
         * @private
         */
        _getInitialSorters: function() {
            var aSorter = [],
                oConfigColumns = this.getModel("mainConfig").getProperty("/ServiceColumns/results");
            //get columns with their sort.
            jQuery.grep(oConfigColumns, function(oColumn) {
                var iColumnSorting = oColumn["COLUMN_SORTING"],
                    bDesc;
                //see COLUMN_SORTING property of the model to check if sorting enabled for that column or not
                //1 or 2 for COLUMN_SORTING is enabled else disabled
                if (iColumnSorting === 1 || iColumnSorting === 2) {
                    //next check if it is ascending or descending order 1 is ascending 2 is Descending
                    //when everything is there form the sorters
                    if (iColumnSorting === 1) {
                        bDesc = false;
                    } else if (iColumnSorting === 2) {
                        bDesc = true;
                    } else {
                        bDesc = undefined;
                    }

                    aSorter.push(
                        new sap.ui.model.Sorter(
                            oColumn["COLUMN"],
                            bDesc,
                            false)
                    );
                }
            });
            return aSorter.length === 0 ? undefined : aSorter;
        },

        /**
         * Called when chart route matched
         * @param {object} oEvent - contains url hash parameters
         * @return {void}
         * @private
         */
        _onRouteMatched: function(oEvent) {
            if (oEvent.getParameters("arguments").arguments.tab === "Chart") {
                var aFilter = this.getModel("view").getProperty("/aMainFilters");
                //get the sorter
                var aSorter = this.getModel("view").getProperty("/aMainSorters");
                if (aSorter === undefined) {
                    aSorter = this._getInitialSorters();
                }
                var oData = {
                    mainFilters: this.getModel("view").getProperty("/aMainFilters"),
                    mainSorters: aSorter,
                    hash: oEvent.getParameters("arguments").arguments.tab
                };

                if (aFilter && aFilter !== undefined) {
                    this.onFilterSetup("", "SetupFilters", oData);
                } else if (aFilter === undefined) {
                    this.onFilterSetup("", "RemoveFilters", oData);
                }
            }
        },

        /**
         * Method to call filter setup when there is no default variant
         * @return {void}
         * @private
         */
        _onChartMatched: function() {
            var aFilter = this.getModel("view").getProperty("/aMainFilters");
            var aSorter = this.getModel("view").getProperty("/aMainSorters");

            if (aSorter === undefined) {
                aSorter = this._getInitialSorters();
            }
            var oData = {
                mainFilters: aFilter,
                mainSorters: aSorter,
                hash: "Chart"
            };

            if (aFilter && aFilter !== undefined) {
                this.onFilterSetup("", "SetupFilters", oData);
            } else if (aFilter === undefined) {
                this.onFilterSetup("", "RemoveFilters", oData);
            }
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Handle success request for Charts data
         * @param {object} oData - received charts data from backend
         * @return {void}
         * @private
         */
        _handleSuccessDimensionsMeasuresRequest: function(oData) {
            if (oData.results.length > 0) {
                this._chartCount = 0;
                var iChartCount = 0;
                var oVisibilityModel = new JSONModel();
                oData.results.map(function(oChart) {
                    if (oChart.VISIBLE === 1) {
                        this._chartCount++;
                    }
                }.bind(this));
                oData.results.forEach(function(oChart) {
                    if (oChart.VISIBLE === 1) {
                        oVisibilityModel.setProperty("/" + oChart.CHARTID, true);
                        this._setChartToView(oChart.CHARTID, iChartCount);
                        this._setChartDimensionsMeasures(oChart);
                        this._chartsNames += !this._chartsNames ? oChart.CHARTID : "," + oChart.CHARTID;
                        iChartCount++;
                        if (this.getModel(oChart.CHARTID)) {
                            this.getModel(oChart.CHARTID).setProperty("/busy", false);
                        }
                    }
                }.bind(this));
                this.setModel(oVisibilityModel, "ChartVisibility");
            } else {
                this._addChartConfigurationModelErrorText();
            }
        },

        /**
         * Set Error text to grid if no charts will be received
         * @return {void}
         * @private
         */
        _addChartConfigurationModelErrorText: function() {
            var oGrid = this.getView().byId(this.config.ui.elements.chartsGrid);
            var oText = new Text({
                text: this.getResourceBundle().getText("chart.noChartsReceivedFromBackend")
            });

            oText.setLayoutData(new sap.ui.layout.GridData({
                span: "L12 M12 S12",
                indent: "L4 M3 S2"
            }));

            oGrid.setBusy(false);
            oGrid.addContent(oText);
        },

        /**
         * Create Chart inside Panel and set it to grid
         * @param {string} sChartId - Chart ID
         * @param {integer} iChartIndex - Chart index on the grid
         * @return {void}
         * @private
         */
        _setChartToView: function(sChartId, iChartIndex) {
            var oGrid = this.getView().byId(this.config.ui.elements.chartsGrid),
                that = this;
            oGrid.setBusy(false);

            var oChart = new ChartControl({
                id: that.config.ui.elements.chart + sChartId,
                width: {
                    path: sChartId + ">/chartSettings/width"
                },
                height: {
                    path: sChartId + ">/chartSettings/height"
                },
                type: {
                    path: sChartId + ">/chartSettings/type"
                },
                nodata: {
                    path: "i18n>ChartNoData"
                },
                yaxisLabel: {
                    path: sChartId + ">/chartSettings/yaxislabel"
                },
                expanded: {
                    path: sChartId + ">/chartSettings/expanded"
                }
            });

            var oPanel = new Panel({
                expandable: "{= ${" + sChartId + ">/chartSettings/expanded} === false}",
                expanded: true,
                width: "auto",
                visible: {
                    path: "ChartVisibility>/" + sChartId
                },
                headerToolbar: new Toolbar({
                    content: [new Title({
                            text: {
                                path: sChartId + ">/title"
                            }
                        }),
                        new ToolbarSpacer(),
                        new Button({
                            press: that.onChartTypeButtonPressed.bind(that),
                            tooltip: {
                                path: sChartId + ">/typeButton/tooltip"
                            },
                            icon: {
                                path: sChartId + ">/typeButton/icon"
                            }
                        }).data("chartId", sChartId),
                        new Button({
                            press: that.onChartDimensionMeasureButtonPressed.bind(that),
                            tooltip: {
                                path: sChartId + ">/measuresDimensionButton/tooltip"
                            },
                            icon: {
                                path: sChartId + ">/measuresDimensionButton/icon"
                            }
                        }).data("chartId", sChartId),
                        new ToggleButton({
                            press: that.onChartExpandButtonPressed.bind(that),
                            pressed: {
                                path: sChartId + ">/expandButton/pressed"
                            },
                            tooltip: {
                                path: sChartId + ">/expandButton/tooltip"
                            },
                            icon: {
                                path: sChartId + ">/expandButton/icon"
                            },
                            visible: "{= ${mainConfig>/IS_MIXED} !== 1}"
                        }).data("chartId", sChartId)
                    ]
                }),
                content: [new VBox({
                    busy: {
                        path: sChartId + ">/busy"
                    },
                    busyIndicatorDelay: 0,
                    items: [oChart]
                })],
                expand: function(oEvent) {
                    this.getModel(sChartId + "Data").refresh(true);
                    this.getModel(sChartId + "Data").updateBindings(true);
                }.bind(this)
            });

            oPanel.setLayoutData(new sap.ui.layout.GridData({
                span: this._setChartLayout(iChartIndex + 1)
            }));


            var mDimMeasParams = {
                values: {
                    path: sChartId + "Data>VALUES"
                },
                label: {
                    path: sChartId + "Data>LABEL"
                },
                ctype: {
                    path: sChartId + "Data>CTYPE"
                },
                column: {
                    path: sChartId + "Data>COLUMN"
                },
                chartype: {
                    path: sChartId + "Data>CHARTTYPE"
                },
                chartgroup: {
                    path: sChartId + "Data>CHARTGROUP"
                }
            };

            var mColorParams = {
                color: {
                    path: sChartId + "Data>COLOR"
                }
            };

            var oMeasuresTemplate = new ChartMeasure(mDimMeasParams),
                oDimensionsTemplate = new ChartDimension(mDimMeasParams),
                oBackgroundColorTemplate = new ChartBackgroundColor(mColorParams),
                oBorderColorTemplate = new ChartBorderColorData(mColorParams);

            var oJsonModel = new JSONModel({
                measures: [],
                dimensions: [],
                backgroundColorData: [],
                size: 0
            });

            this.setModel(oJsonModel, sChartId + "Data");

            oChart.bindAggregation("measures", sChartId + "Data>/measures", oMeasuresTemplate);
            oChart.bindAggregation("dimensions", sChartId + "Data>/dimensions", oDimensionsTemplate);
            oChart.bindAggregation("backgroundColorData", sChartId + "Data>/backgroundColorData", oBackgroundColorTemplate);
            oChart.bindAggregation("borderColorData", sChartId + "Data>/borderColorData", oBorderColorTemplate);

            oGrid.addContent(oPanel);
        },

        /**
         * Set Chart layout
         * @param {integer} iChartIndex - Chart index on the grid
         * @return {string} sSpan - Span for chart on the grid
         * @private
         */
        _setChartLayout: function(iChartIndex) {
            var sSpan = "";

            if (this._chartCount % 3 === 2) {
                if (this._chartCount - iChartIndex === 1 || this._chartCount - iChartIndex === 0) {
                    sSpan += "L6 ";
                }
            } else if (this._chartCount % 3 === 1 && iChartIndex === this._chartCount) {
                sSpan += "L12 ";
            } else {
                sSpan += "L4 ";
            }

            if (this._chartCount % 2 && iChartIndex === this._chartCount) {
                sSpan += "M12 ";
            } else {
                sSpan += "M6 ";
            }

            sSpan += "S12";

            return sSpan;
        },

        /**
         * Create chart support model
         * @param {object} oChart - Chart parameters received from backend
         * @return {void}
         * @private
         */
        _setChartDimensionsMeasures: function(oChart) {
            var oChartModel = new JSONModel({
                busy: true,
                delay: 0,
                title: oChart.TITLE,
                chartSettings: {
                    type: oChart.TYPE,
                    width: "auto",
                    height: "250",
                    yaxislabel: oChart.YAXISLABEL,
                    expanded: false
                },
                typeButton: {
                    tooltip: this.getResourceBundle().getText("chart.chartChange"),
                    icon: "sap-icon://" + this.config.icons[oChart.TYPE]
                },
                measuresDimensionButton: {
                    tooltip: this.getResourceBundle().getText("chart.toggleLegend"),
                    icon: "sap-icon://drop-down-list"
                },
                expandButton: {
                    tooltip: this.getResourceBundle().getText("chart.expandChart"),
                    icon: "sap-icon://full-screen",
                    pressed: false
                },
                chartDimensionsMeasures: models.createDimensionMeasures(oChart[this.config.paths.chartDimensionsMeasures].results, oChart.CHARTID),
                oChart: oChart,
                measures: [],
                dimensions: [],
                backgroundColorData: [],
                size: 0
            });

            this.setModel(oChartModel, oChart.CHARTID);
        },

        /**
         * Handle error request for Dimensions/Measures for charts
         * @param {object} oError - Error response
         * @return {void}
         * @private
         */
        _handleErrorDimensionsMeasuresRequest: function(oError) {
            jQuery.sap.log.error(oError);

            var oGrid = this.getView().byId(this.config.ui.elements.chartsGrid);
            oGrid.setBusy(false);
        },

        /**
         * Create request for data if selected columns exist
         * @param {function} fnSuccess - function to handle data count or raw data
         * @param {string} sCount - additional string part for count request
         * @param {string} sChartId - Chart ID
         * @param {array} aFilters - received filter parameters
         * @param {array} aSorters - received sorter parameters
         * @return {void}
         * @private
         */
        _onModelRequestChartData: function(fnSuccess, sCount, sChartId, aFilters, aSorters) {
            var sChartSelectedColumns = this._getChartSelectedColumnsAsString(sChartId);
            var aSelectedChartColumns = [];
            var aModelSorter = [];
            var bOrderBy = false;

            if (sChartSelectedColumns) {
                aSelectedChartColumns = sChartSelectedColumns.split(",");
                if (aSorters && aSorters.length > 0) {
                    jQuery.each(aSelectedChartColumns, function(i, c) {
                        jQuery.each(aSorters, function(j, s) {
                            if (c === s.sPath) {
                                aModelSorter.push(s);
                            }
                        });
                    });
                } else {
                    bOrderBy = true;
                }
                this.getModel(sChartId).setProperty("/busy", true);
                models.requestData(
                    this.getComponentModel(),
                    this.getEntityName() + sCount,
                    sChartSelectedColumns,
                    fnSuccess.bind.apply(fnSuccess, [this].concat([sChartId])),
                    this._handleRequestError.bind.apply(this._handleRequestError, [this].concat([sChartId])),
                    //true, // OrderBy Parameter
                    bOrderBy,
                    aFilters ? [aFilters] : undefined,
                    aModelSorter
                );
            } else {
                this.getModel(sChartId).setProperty("/busy", false);
                // Check if model exist (initial loading)
                if (this.getModel(sChartId + "Data")) {
                    this.getModel(sChartId + "Data").setProperty("/measures", []);
                    this.getModel(sChartId + "Data").setProperty("/dimensions", []);
                }
            }
        },

        /**
         * Create string for selected columns
         * @param {string} sChartId - Chart ID
         * @return {string} - String created based on selected measures and dimensions
         * @private
         */
        _getChartSelectedColumnsAsString: function(sChartId) {
            var aDimensions = this.getModel(sChartId).getProperty("/chartDimensionsMeasures/dimensions"),
                aMeasures = this.getModel(sChartId).getProperty("/chartDimensionsMeasures/measures"),
                sSelected,
                sSelectedMeasures = "",
                sSelectedDimensions = "";

            var chartData = {
                measures: [],
                dimensions: []
            };

            // Create dimension string part for request and dimension array
            jQuery.grep(aDimensions, function(oDimension) {
                if (oDimension.SELECTED) {
                    sSelectedDimensions += !sSelectedDimensions ? oDimension.COLUMN : "," + oDimension.COLUMN;
                    chartData.dimensions.push({
                        LABEL: oDimension.LABEL,
                        COLUMN: oDimension.COLUMN,
                        CTYPE: oDimension.CTYPE,
                        VALUES: []
                    });
                }
            });

            var aChartMeasureOld = this.getModel(sChartId).getData().measures;
            var sChartType,
                sChartGroup,
                oOldSetting;

            // Create measure string part for request and measure array
            jQuery.grep(aMeasures, function(oMeasure) {
                if (oMeasure.SELECTED) {
                    sChartType = "Line Chart";
                    sChartGroup = "1 Group";
                    sSelectedMeasures += !sSelectedMeasures ? oMeasure.COLUMN : "," + oMeasure.COLUMN;
                    if (aChartMeasureOld.length > 0) {
                        oOldSetting = jQuery.grep(aChartMeasureOld, function(e) {
                            return e.COLUMN === oMeasure.COLUMN;
                        })[0];
                        if (oOldSetting && oOldSetting.CHARTTYPE && oOldSetting.CHARTGROUP) {
                            sChartType = oOldSetting.CHARTTYPE;
                            sChartGroup = oOldSetting.CHARTGROUP;
                        }
                    }
                    chartData.measures.push({
                        LABEL: oMeasure.LABEL,
                        COLUMN: oMeasure.COLUMN,
                        CTYPE: oMeasure.CTYPE,
                        VALUES: [],
                        CHARTTYPE: sChartType,
                        CHARTGROUP: sChartGroup
                    });
                }
            });


            if (!!sSelectedDimensions && !!sSelectedMeasures) {
                sSelected = sSelectedDimensions + "," + sSelectedMeasures;
            }

            this.getModel(sChartId).setProperty("/measures", chartData.measures);
            this.getModel(sChartId).setProperty("/dimensions", chartData.dimensions);

            return sSelected;
        },

        /**
         * Handle success count request
         * @param {string} sChartId - Chart ID
         * @param {object} oData - data count
         * @param {object} response - received response
         * @returns {void}
         * @private
         */
        _handleCountRequestSuccess: function(sChartId, oData, response) {
            if (oData < this.config.limitations.chartLimitation) {
                this._onModelRequestChartData(this._handleRequestSuccess, "", sChartId, this._lastAppliedFilters, this._lastAppliedSorters);
            } else {
                var oErrorData = {
                    title: this.getModel(sChartId).getProperty("/title") + " - " + this.getResourceBundle().getText("errorTitle"),
                    icon: MessageBox.Icon.ERROR,
                    actions: [MessageBox.Action.ABORT],
                    message: this.getResourceBundle().getText("loadChartDataLimitationErrorMessage", [oData.toString(), this.config.limitations.chartLimitation])
                };
                MessageBox.show(oErrorData.message, {
                    icon: oErrorData.icon,
                    title: oErrorData.title,
                    actions: oErrorData.actions,
                    defaultAction: MessageBox.Action.ABORT,
                    styleClass: this.getOwnerComponent().getContentDensityClass(),
                    onClose: function(oAction) {

                    }
                });

                this._lastAppliedFilters = undefined;
                this._lastAppliedSorters = undefined;
                this.getModel(sChartId).setProperty("/busy", false);
            }
        },

        /**
         * Handle success request
         * @param {string} sChartId - Chart ID
         * @param {object} oData - received data from backend
         * @param {object} response - received response
         * @returns {void}
         * @private
         */
        _handleRequestSuccess: function(sChartId, oData, response) {
            // Get dimensions
            jQuery.grep(this.getModel(sChartId).getProperty("/dimensions"), function(oDimension) {
                oDimension.VALUES = oData.results.map(function(oObject) {
                    return oObject[oDimension.COLUMN];
                });
            });

            // Count dimension size for dynamic model
            this.getModel(sChartId).setProperty("/size", this.getModel(sChartId).getProperty("/dimensions/0/VALUES").length);

            // Get measures
            jQuery.grep(this.getModel(sChartId).getProperty("/measures"), function(oMeasure) {
                this.getModel(sChartId).getProperty("/backgroundColorData").push({
                    COLOR: this._randomColor()
                });

                oMeasure.VALUES = oData.results.map(function(oObject) {
                    return oObject[oMeasure.COLUMN];
                });
            }.bind(this));

            if (this.getModel(sChartId).getProperty("/size") < this.getModel(sChartId).getProperty("/measures").length) {
                this.getModel(sChartId).setProperty("/size", this.getModel(sChartId).getProperty("/measures").length);
            }

            this._setChartData(sChartId);
        },

        /**
         * Handle error request
         * @param {string} sChartId - Chart ID
         * @param {object} oError - Error response
         * @returns {void}
         * @private
         */
        _handleRequestError: function(sChartId, oError) {
            jQuery.sap.log.error(oError);
            this.getModel(sChartId).setProperty("/busy", false);
        },

        /**
         * Set Chart data model
         * @param {string} sChartId - Chart ID
         * @returns {void}
         * @private
         */
        _setChartData: function(sChartId) {
            var oJsonModel = this.getModel(sChartId + "Data");

            if (location.hostname !== "localhost") {
                oJsonModel.setSizeLimit(this.getModel(sChartId).getProperty("/size"));
            }

            oJsonModel.setData({
                measures: this.getModel(sChartId).getProperty("/measures"),
                dimensions: this.getModel(sChartId).getProperty("/dimensions"),
                backgroundColorData: this.getModel(sChartId).getProperty("/backgroundColorData"),
                size: this.getModel(sChartId).getProperty("/size")
            });

            this.getModel(sChartId).setProperty("/busy", false);
        },

        /**
         * Returns randomly generated color for chart
         * @returns {integer} - randomly generated integer for colors
         * @private
         */
        _randomColorFactor: function() {
            return Math.round(Math.random() * 255);
        },

        /**
         * Returns randomly generated color for chart
         * @returns {string} - randomly generated color
         * @private
         */
        _randomColor: function() {
            return "rgba(" + this._randomColorFactor() + "," + this._randomColorFactor() + "," + this._randomColorFactor() + ",.7)";
        }
    });
});