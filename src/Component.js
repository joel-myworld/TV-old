sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"com/siemens/tableViewer/model/models",
	"com/siemens/tableViewer/controller/ErrorHandler",
	"sap/ui/model/odata/CountMode",
	"sap/m/MessageBox"
], function (UIComponent, Device, models, ErrorHandler, CountMode, MessageBox) {
	"use strict";

	return UIComponent.extend("com.siemens.tableViewer.Component", {
		metadata: {
			"version": "2.22.1",
			"rootView": {
				"viewName": "com.siemens.tableViewer.view.App",
				"type": "XML"
			},
			"includes": ["css/style.css"],
			"dependencies": {
				"libs": ["sap.ui.core", "sap.m", "sap.ui.layout", "sap.ui.comp"]
			},
			"config": {
				"i18nBundle": "com.siemens.tableViewer.i18n.i18n",
				"serviceUrl": "/siemens/COMMON_DEV/xs/services/tableViewerOData/",
				"icon": "sap-icon://database",
				"fullWidth": "true",
				"favIcon": "img/favicon.ico",
				"phone": "",
				"phone@2": "",
				"tablet": "",
				"tablet@2": ""
			},
			"routing": {
				"config": {
					"routerClass": "sap.m.routing.Router",
					"viewType": "XML",
					"viewPath": "com.siemens.tableViewer.view",
					"controlId": "app",
					"controlAggregation": "pages",
					"clearTarget:": false,
					"bypassed": {
						"target": "notFound"
					}
				},
				"routes": [{
					"pattern": ":tab:",
					"name": "tableviewer",
					"target": "tableviewer"
				}],
				"targets": {
					"tableviewer": {
						"viewName": "TableViewer",
						"viewId": "tableviewer",
						"viewLevel": 1
					},
					"Table": {
						"parent": "tableviewer",
						"viewName": "Table",
						"viewId": "Table",
						"viewPath": "com.siemens.tableViewer.view.tabs",
						"controlId": "siemens.ui.table",
						"controlAggregation": "content"
					},
					"Chart": {
						"parent": "tableviewer",
						"viewName": "Chart",
						"viewId": "Chart",
						"viewPath": "com.siemens.tableViewer.view.tabs",
						"controlId": "siemens.ui.chart",
						"controlAggregation": "content"
					},
					"Tree": {
						"parent": "tableviewer",
						"viewName": "Tree",
						"viewId": "Tree",
						"viewPath": "com.siemens.tableViewer.view.tabs",
						"controlId": "siemens.ui.tree",
						"controlAggregation": "content"
					},
					"Mix": {
						"parent": "tableviewer",
						"viewName": "Mix",
						"viewId": "Mix",
						"viewPath": "com.siemens.tableViewer.view.tabs",
						"controlId": "siemens.ui.mix",
						"controlAggregation": "content"
					},
					"notFound": {
						"viewName": "NotFound",
						"transition": "show"
					}
				}
			}
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this method, the resource and application models are set and the router is initialized.
		 * @public
		 * @override
		 */
		init: function () {
			var mConfig = this.getMetadata().getConfig(),
				sCalculationId;

			// get startup parameters
			sCalculationId = this._getUriParams("CNTRL");

			if (!sCalculationId) {
				jQuery.sap.log.error("CNTRL is not passed");
				return;
			}

			// Capture user statistics
			this._createUserStatistics(sCalculationId);

			//model for cellConfigAuth check
			this.setModel(models.createAuthDataModel(), "authModel");
			
			//User authorization check for cell config
			this._getAuthForCellConfig();

			// url to main.xsodata
			var sMainOData = [this.getMetadata().getConfig().serviceUrl, "main.xsodata"].join(""),
				aMainOdataJsonModels = models.createConfigurationModel(sMainOData, sCalculationId);
			this.setModel(aMainOdataJsonModels.oConfigModel, "mainConfig");
			this.setModel(aMainOdataJsonModels.oModel, "main");

			// create url to serviceUrl
			var sServiceUrl = [this.getMetadata().getConfig().serviceUrl,
				this.getModel("mainConfig").getProperty("/SERVICE_NAME")
			].join("");

			var bIsODataServer = this.getModel("mainConfig").getProperty("/ODATA_SRV") === 1 ? true : false,
				bIsHierarchy = this.getModel("mainConfig").getProperty("/IS_HIERARCHY") === 1 ? true : false;

			// Check whether it's OData or XSJS service
			if (bIsODataServer) {
				// create and set the ODataModel
				var oModel = models.createODataModel({
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
				oModel.setDefaultCountMode(CountMode.Inline);
				oModel.setUseBatch(bIsHierarchy);
				this.setModel(oModel);
				this._createMetadataPromise(oModel);
			}

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// set the FLP model if app is running in FLP
			if (sap.ushell) {
				this.setModel(models.createFLPModel(), "FLP");
			}

			// Capture user statistics
			this.setModel(models.createGlobalVariableModel(),"GlobalVariable");

			// set the i18n model
			this.setModel(models.createResourceModel(mConfig.i18nBundle), "i18n");

			if (bIsODataServer && !bIsHierarchy) {
				// initialize the error handler with the component
				this._oErrorHandler = new ErrorHandler(this);
			}

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// create the views based on the url/hash
			this.getRouter().initialize();

		},

		/*
		 * Creates a promise which is resolved when the metadata is loaded.
		 * @param {sap.ui.core.Model} oModel the app model
		 * @private
		 */
		_createMetadataPromise: function (oModel) {
			 /*eslint-disable */
			this.oWhenMetadataIsLoaded = new Promise(function (fnResolve, fnReject) {
				oModel.attachEventOnce("metadataLoaded", fnResolve);
				oModel.attachEventOnce("metadataFailed", fnReject);
			});
		},

		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ErrorHandler are destroyed.
		 * @public
		 * @override
		 */
		destroy: function () {
			if (this._oErrorHandler !== undefined) {
				this._oErrorHandler.destroy();
			}
			try {
				this.getModel().destroy();
			} catch (e) {
				jQuery.sap.log.info("failed to destroy model");
			}
			this.getModel("i18n").destroy();
			this.getModel("FLP").destroy();
			this.getModel("device").destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass: function () {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when the application startup parameter is missing
		 * The user should pass CNTRL=<% View ID %>, e.g. ?CNTRL=VIEW6
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showApplicationError: function (sDetails) {
			if (this._bMessageOpen) {
				return;
			}
			this._bMessageOpen = true;
			MessageBox.show(
				this._sErrorText, {
					id: "serviceErrorMessageBox",
					icon: MessageBox.Icon.ERROR,
					title: this._sErrorTitle,
					details: sDetails,
					styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE],
					onClose: function () {
						this._bMessageOpen = false;
					}.bind(this)
				}
			);
		},

		/**
		 * This method can be called to get startup parameters depend on property
		 * that should be passed to function
		 * @public
		 * @param {string} sProperty - startup parameter property
		 * @return {string} startup parameter property value
		 */
		_getUriParams: function (sProperty) {
			var oStartUpParams = this.getComponentData() ? this.getComponentData().startupParameters : null, sResult;

			if (!oStartUpParams) {
				// check CNTRL via URL
				var oUriParams = jQuery.sap.getUriParameters().mParams;
				sResult = oUriParams[sProperty] ? oUriParams[sProperty][0] : null;
			} else {
				sResult = oStartUpParams[sProperty] ? oStartUpParams[sProperty][0] : undefined;
			}

			return sResult;
		},

		/**
		 * Insert Userid , CV Id and Time Stamp in User Statistics
		 * @private
		 * @param {sCTRLID} pass control id
		 */
		_createUserStatistics: function (sCTRLID) {
			var sDateTime = new Date();
			var oPayLoad = {
				"CTRLID": sCTRLID,
				"UserId": "dummy",
				"UDateTime": sDateTime
			};

			var oModel = new sap.ui.model.odata.ODataModel([this.getMetadata().getConfig().serviceUrl, "userstatistics.xsodata"].join(""), true);
			oModel.create('/UserStatisticsSet', oPayLoad, {
				success: function (oData, response) {
					jQuery.sap.log.info('oData');
				},
				error: function (oError) {
					jQuery.sap.log.error(oError);
				}
			});
		},

		/**
		 * Method to check the user is given admin role for cell config.
		 * @private
		 *
		 */
		 _getAuthForCellConfig: function() {
			 var sUrl = [this.getMetadata().getConfig().serviceUrl, "getUserAuth.xsjs"].join("");
			 jQuery.ajax({
	                type: "GET",
	                url: sUrl,
	                async: false,
	                dataType: "json",
	                success: jQuery.proxy(this._handleSuccessForGetAuth, this),
	                error: jQuery.proxy(this._handleErrorForGetAuth, this)
	            }, this);
		 },

			/**
			* Success handler for read request of Auth check for cell config. If ADMIN = t, then cell config button is visible
			* @param {object} oData - oData from read request
			* @param {String} sStatus - response text
			* @param {object} jqXHR - XML HTTP Request
			* @private
			*/
		 	_handleSuccessForGetAuth: function(oData, sStatus, jqXHR) {
				var oCellConfigAuthData = this.getModel("authModel"), bAdmin;
				if (sStatus === "success") {
					oCellConfigAuthData.setData(oData);
				}
				// oCellConfigAuthData.setProperty("/isAuthToConfigCell", bAdmin);
			},
			/**
			* Error handler for read request of Auth check for cell config. Sets cell config visible to false.
			* @param {object} jqXHR - XML HTTP Request
			* @param {String} sStatus - Status text
			* @param {String} sError - Error message
			* @private
			*/
			_handleErrorForGetAuth: function(jqXHR, sStatus, sError) {
				var oCellConfigAuthData = this.getModel("authModel");
				oCellConfigAuthData.setProperty("/isAuthToConfigCell", false);
				jQuery.sap.log.error("User does not exist in User Authorization table");
			}
	});
});
