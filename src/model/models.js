sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/resource/ResourceModel",
    "sap/ui/model/odata/ODataModel",
    "sap/m/MessageBox",
    "sap/ui/thirdparty/URI"
], function(JSONModel, Device, ODataModel, ResourceModel, ODataModelNew, MessageBox, URI) {
    "use strict";
    /* global $ */
    function extendMetadataUrlParameters(aUrlParametersToAdd, oMetadataUrlParams, sServiceUrl) {
        var oExtensionObject = {},
            oServiceUri = new URI(sServiceUrl);

        aUrlParametersToAdd.forEach(function(sUrlParam) {
            var oUrlParameters,
                sParameterValue;

            if (sUrlParam === "sap-language" && sap.ushell) {
                // for sap-language we check if the launchpad can provide it.
                oMetadataUrlParams["sap-language"] = sap.ushell.Container.getUser().getLanguage();
            } else {
                oUrlParameters = jQuery.sap.getUriParameters();
                sParameterValue = oUrlParameters.get(sUrlParam);
                if (sParameterValue) {
                    oMetadataUrlParams[sUrlParam] = sParameterValue;
                    oServiceUri.addSearch(sUrlParam, sParameterValue);
                }
            }
        });

        jQuery.extend(oMetadataUrlParams, oExtensionObject);
        return oServiceUri.toString();
    }

    return {
        /**
         *
         * @param {object} oOptions a map which contains the following parameter properties
         * @param {string} oOptions.url see {@link sap.ui.model.odata.v2.ODataModel#constructor.sServiceUrl}.
         * @param {object} [oOptions.urlParametersForEveryRequest] If the parameter is present in the URL or in case of language the UShell can provide it,
         * it is added to the odata models metadataUrlParams {@link sap.ui.model.odata.v2.ODataModel#constructor.mParameters.metadataUrlParams}, and to the service url.
         * If you provided a value in the config.metadataUrlParams this value will be overwritten by the value in the url.
         *
         * Example: the app is started with the url query, and the user has an us language set in the launchpad:
         *
         * ?sap-server=serverValue&sap-host=hostValue
         *
         * The createODataModel looks like this.
         *
         * models.createODataModel({
         *     urlParametersToPassOn: [
         *         "sap-server",
         *         "sap-language",
         *         "anotherValue"
         *     ],
         *     url : "my/Url"
         * });
         *
         * then the config will have the following metadataUrlParams:
         *
         * metadataUrlParams: {
         *     // retrieved from the url
         *     "sap-server" : "serverValue"
         *     // language is added from the launchpad
         *     "sap-language" : "us"
         *     // anotherValue is not present in the url and will not be added
         * }
         *
         * @param {object} [oOptions.config] see {@link sap.ui.model.odata.v2.ODataModel#constructor.mParameters} it is the exact same object, the metadataUrlParams are enriched by the oOptions.urlParametersToPassOn
         * @returns {sap.ui.model.odata.v2.ODataModel}
         */
        createODataModel: function(oOptions) {
            var aUrlParametersForEveryRequest,
                oConfig,
                sUrl;

            oOptions = oOptions || {};

            if (!oOptions.url) {
                jQuery.sap.log.error("Please provide a url when you want to create an ODataModel", "test.model.models.createODataModel");
                return null;
            }

            // create a copied instance since we modify the config
            oConfig = jQuery.extend(true, {}, oOptions.config);

            aUrlParametersForEveryRequest = oOptions.urlParametersForEveryRequest || [];
            oConfig.metadataUrlParams = oConfig.metadataUrlParams || {};

            sUrl = extendMetadataUrlParameters(aUrlParametersForEveryRequest, oConfig.metadataUrlParams, oOptions.url);

            return this._createODataModel(sUrl, oConfig);
        },

        _createODataModel: function(sUrl, oConfig) {
            return new ODataModel(sUrl, oConfig);
        },
        
        createODataModelWithParams: function(sServiceUrl) {
            var oModel = this.createODataModel({
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
            oModel.setDefaultCountMode("Inline");
            oModel.setUseBatch(false);
            return oModel;
        },

        createDeviceModel: function() {
            var oModel = new JSONModel(Device);
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        createFLPModel: function() {
            var bIsShareInJamActive = sap.ushell.Container.getUser().isJamActive(),
                oModel = new JSONModel({
                    isShareInJamActive: bIsShareInJamActive
                });
            oModel.setDefaultBindingMode("OneWay");
            return oModel;
        },

        createResourceModel: function(sBundleName) {
            var oResourceModel = new ResourceModel({
                "bundleName": sBundleName
            });
            return oResourceModel;
        },
        
        createInputParametersModel: function() {
            return new JSONModel({
                controls: {},
                entityName: "",
                navigation: "Results"
            });
        },

        createChartButtonsModel: function(oResourceBundle) {
            return new JSONModel({
                buttons: [{
                    "id": "bar",
                    "title": oResourceBundle.getText("chart.barChartText"),
                    "icon": "sap-icon://bar-chart",
                    "enabled": true,
                    "type": "Active"
                }, {
                    "id": "line",
                    "title": oResourceBundle.getText("chart.lineChartText"),
                    "icon": "sap-icon://line-chart",
                    "enabled": true,
                    "type": "Active"
                }, {
                    "id": "pie",
                    "title": oResourceBundle.getText("chart.pieChartText"),
                    "icon": "sap-icon://pie-chart",
                    "enabled": true,
                    "type": "Active"

                }, {
                    "id": "radar",
                    "title": oResourceBundle.getText("chart.radarChartText"),
                    "icon": "sap-icon://radar-chart",
                    "enabled": true,
                    "type": "Active"

                }, {
                    "id": "bubble",
                    "title": oResourceBundle.getText("chart.bubbleChartText"),
                    "icon": "sap-icon://bubble-chart",
                    "enabled": false,
                    "type": "Active"
                }, {
                    "id": "line_bar",
                    "title": oResourceBundle.getText("chart.multipleChartText"),
                    "icon": "sap-icon://line-chart-dual-axis",
                    "enabled": true,
                    "type": "Active"
                }, {
                    "id": "combine",
                    "title": oResourceBundle.getText("chart.combineChartText"),
                    "icon": "sap-icon://multiple-line-chart",
                    "enabled": true,
                    "type": "Active"
                }, {
                    "id": "stacked",
                    "title": oResourceBundle.getText("chart.stackedChartText"),
                    "icon": "sap-icon://upstacked-chart",
                    "enabled": true,
                    "type": "Active"
                }]
            });
        },

        createTableExportFormatsModel: function() {
            return new JSONModel({
                buttons: [{
                    "id": "csv",
                    "title": "CSV",
                    "icon": "sap-icon://attachment-text-file",
                    "enabled": true,
                    "type": "Active"
                }, {
                    "id": "zip",
                    "title": "ZIP",
                    "icon": "sap-icon://attachment-zip-file",
                    "enabled": false,
                    "type": "Active"
                }, {
                    "id": "xlsx",
                    "title": "XLSX",
                    "icon": "sap-icon://excel-attachment",
                    "enabled": true,
                    "type": "Active"
                }]
            });
        },

        requestChartsDimensionsMeasures: function(oModel, sEntitySet, oUriParams, aFilters, fnSuccess, fnError) {
            oModel.read(sEntitySet, {
                urlParameters: oUriParams,
                filters: aFilters,
                success: fnSuccess,
                error: fnError,
                async: false
            });
        },

        /**
         * Prepare model for data binding - storing all chart measures and
         * dimensions
         *
         * @param oConfigModel
         * @param sPath
         * @returns {{dimensions: Array, measures: Array}}
         */
        createDimensionMeasures: function(aDimensionsMeasures, sChartId) {
            var oMeasuresDimensions = {
                dimensions: [],
                measures: []
            };

            $.grep(aDimensionsMeasures, function(oDimensionsMeasures) {
                if (sChartId === oDimensionsMeasures.CHARTID) {
                    var sNameOfArray = null;
                    var sLabel = oDimensionsMeasures.LABEL;
                    var sColumn = oDimensionsMeasures.COLUMN;
                    var bSelected = oDimensionsMeasures.IS_KFG === 1 || oDimensionsMeasures.IS_KFG === 2;
                    var sChartType = oDimensionsMeasures.CHARTYPE;

                    if (oDimensionsMeasures.IS_KFG === 1) {
                        sNameOfArray = "measures";
                    } else {
                        sNameOfArray = "dimensions";
                    }
                    oMeasuresDimensions[sNameOfArray].push({
                        LABEL: sLabel,
                        COLUMN: sColumn,
                        SELECTED: bSelected,
                        CTYPE: oDimensionsMeasures.CTYPE,
                        CHARTYPE: sChartType
                    });
                }
            });

            return oMeasuresDimensions;
        },

        /**
         * Create Chart Model by doing read to the backend and merging values to one JSON
         * @param oModel
         * @param sEntity
         * @param sSelect
         */
        requestData: function(oModel, sEntitySet, sSelect, fnSuccess, fnError, bOrder, aFilters, aSorters) {
            var oUriParams = {
                "$select": sSelect
            };

            if (bOrder) {
                oUriParams["$orderby"] = sSelect;
            }
            oModel.read(sEntitySet, {
                urlParameters: oUriParams,
                filters: aFilters,
                sorters: aSorters,
                success: fnSuccess,
                error: fnError
            });
        },

        /**
         *    Read columns from xsjs service
         * @private
         * @param {object} oConfigData - Configuration data object
         * @param {string} sDataName - Name of the data model
         * @param {string} sPath - Path of the xsjs service
         * @returns {object} Updated configuration data object
         */
        requestTreeData: function(sPath, oDeffered, oController) {

            var sEntityName = document.location.hostname === "localhost" ? '/localService/tree/mockdata/getHierarchyV4.json' : sPath;
            $.ajax({
                type: "GET",
                url: sEntityName,
                async: true,
                dataType: "json",
                success: function(oData) {
                    oDeffered.resolve(new JSONModel(oData), oController);
                },
                error: function(XMLHttpRequest, sStatus, sTextStatus) {
                    oDeffered.reject(XMLHttpRequest, sTextStatus, oController);
                }
            }, this);

        },

        createConfigurationModel: function(sUrl, sCalcId) {
            var oModel = new ODataModelNew(sUrl, true);
            var oConfigModel = new JSONModel();
            var sErrorText = "Configuration for " + sCalcId + " is missing. Contact System Administrator";

            // async call is required here
            oModel.read("/Service('" + sCalcId + "')", {
                urlParameters: "$expand=ServiceColumns",
                success: function(oData, oResponse) {
                    if (oData) {
                        // TODO sort it via backend orderby (currently is not working)
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

            return {
                oConfigModel: oConfigModel,
                oModel: oModel
            };
        },

        /**
         * Create initial variant save model
         * @returns {*}
         */

        createVariantManagerModel: function() {
            return new JSONModel({
                busy: false
            });
        },

        /**
        * Method to return the JSON Model for cell config authorization check. Contains flag enabled/disabled based on admin flag.
        * @returns {object} JSONModel - Json model for cell config auth check
        */
        createAuthDataModel : function () {
            return new JSONModel({
                ADMIN : 0,
                SHARE_VARIANT: 0
            });
        },
        
        /**
         * Create global variable model
         * @returns {*}
         */

        createGlobalVariableModel: function() {
            return new JSONModel({
            	vSelEvent: ""
            });
        }
    };

});
