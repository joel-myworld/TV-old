sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History"
], function (Controller, History) {
	"use strict";
	return Controller.extend("com.siemens.tableViewer.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} - the router for this component
		 */
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] - the model name
		 * @returns {sap.ui.model.Model} - the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Get model from component
		 * @public
		 * @param {string} [sName] - model name
		 * @returns {sap.ui.model.Model} - the model instance
		 */
		getComponentModel: function (sName) {
			return this.getOwnerComponent().getModel(sName);
		},
		
		/**
		 * Get model from component
		 * @public
		 * @param {string} [sName] - model name
		 * @returns {sap.ui.model.Model} - the model instance
		 */
		getGlobalVariableModel: function () {
			return this.getOwnerComponent().getModel("GlobalVariable");
		},
		
		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel - the model instance
		 * @param {string} sName - the model name
		 * @returns {sap.ui.mvc.View} - the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} - the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Getter for the event bus.
		 * @public
		 * @returns {sap.ui.core.EventBus} - the Event Bus
		 */
		getEventBus: function () {
			return this.getOwnerComponent().getEventBus();
		},
		
		/**
		 * Getter for app language
		 * @public
		 * @return {string} - App language
		 */
        getAppLanguage: function() {
            var sLanguage;

            if (sap.ushell) {
                sLanguage = sap.ushell.Container.getUser().getLanguage();
            } else {
                sLanguage = sap.ui.getCore().getConfiguration().getLanguage();
            }

            return sLanguage.split("-")[0].toUpperCase();
        },

		/**
		 * Attaching requests to model to display busy indicator
		 * @public
		 * @param {sap.ui.model.Model} oModel - the model instance
		 * @param {sap.ui.core.Control} oControl - received control instance
		 */
		attachRequestsForControlBusyIndicator: function (oModel, oControl) {
			if (oControl.getBusyIndicatorDelay() === 1000) {
				oControl.setBusyIndicatorDelay(0);
			}

			// table busy dialog on each request.
			oModel.attachEventOnce("requestSent", jQuery.proxy(function () {
				oControl.setBusy(true);
			}), this);

			oModel.attachEventOnce("requestCompleted", jQuery.proxy(function () {
				oControl.setBusy(false);
			}), this);

			oModel.attachEventOnce("requestFailed", jQuery.proxy(function () {
				oControl.setBusy(false);
			}), this);
		},
	

		/**
		 * Attaching requests to model to set busy indicator of support view
		 * model depending on sent parameters
		 * @public
		 * @param {sap.ui.model.Model} oModel - the model instance
		 * @param {sap.ui.model.Model} oViewModel - the model instance
		 */
		attachRequestsForModel: function(oModel, oViewModel) {
			oModel.attachRequestSent(function() {
				this.setViewModelBusyParameter(oViewModel, true);
			}, this);

			oModel.attachRequestCompleted(function() {
				this.setViewModelBusyParameter(oViewModel, false);
			}, this);

			oModel.attachRequestFailed(function() {
				this.setViewModelBusyParameter(oViewModel, false);
			}, this);
		},

		/**
		 * Set model property "busy" depending on received parameter
		 * @public
		 * @param {sap.ui.model.Model} oViewModel - the model instance
		 * @param {boolean} bState
		 */
		setViewModelBusyParameter: function (oViewModel, bState) {
			oViewModel.setProperty("/busy", bState);
		},

		/**
		 * Return EntityName from main configuration table
		 * @returns {string}
		 */
		getEntityName: function () {
			return "/" + this.getComponentModel(this.config.paths.mainConfig).getProperty('/ENTITY_NAME');
		},
		/**
		 * Remove Columns from the Model related to the Static Filters
		 * @private
		 */
		_removeStaticColumns: function () {
			var aColumns = this.getComponentModel("mainConfig").getProperty("/ServiceColumns/results");
			for (var i = aColumns.length - 1; i >= 0; i--) {
				if (aColumns[i].FILTERTYPE === "StaticSingleSelect" || aColumns[i].FILTERTYPE === "StaticMultiSelect" || aColumns[i].FILTERTYPE === "StaticMultiValueHelp") {
					this.getComponentModel("mainConfig").getData().ServiceColumns.results.splice(i, 1);
				}
			}
		},
		
		/**
		 * Move to new Dependant report from launchpad or via the 
		 * standalone application
		 * @param {string} [sDrillDownTarget] - CNTRL that should be loaded
		 * @returns {void}
		 */
		handleCrossAppNavigation: function(sDrillDownTarget, bDependent) {
            var oRouter = this.getRouter();

            oRouter.stop();

            if (sap.ushell) {
				var sHash = new sap.ui.core.routing.HashChanger().getHash(),
					sTarget = sHash.split("?")[0].split("-"),
					sSemanticObject = sTarget[0],
					sAction = sTarget[1],
					mParams = {
						dependent: bDependent,
						CNTRL: sDrillDownTarget
					};
					
				var aHash = sHash.split("/"),
				    sLaunchpadParameters = aHash[0].split("?"),
				    sStartupParameters = sLaunchpadParameters[1];
				    
			    if (sStartupParameters.search("dependent") === -1) {
			        sLaunchpadParameters[1] = sStartupParameters + "dependent=false&";
			    } else if (sStartupParameters.search("dependent=true") !== -1) {
			        sLaunchpadParameters[1] = sStartupParameters.replace("dependent=true", "dependent=false");
			    }
			    
			    aHash[0] = sLaunchpadParameters.join("?");
			    sHash = aHash.join("/");
			    
			    location = "#" + sHash;

				sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
					target: {
						semanticObject: sSemanticObject,
						action: sAction
					},
					params: mParams
				});
			} else {
			    var sNewHref;
			    if (location.href.search("dependent") === -1) {
                    sNewHref = location.href.replace("?", "?dependent=false&");
                    // Change URL without reloading the page
                    history.replaceState({}, "", sNewHref);
			    } else if (location.href.search("dependent=true") !== -1) {
			        sNewHref = location.href.replace("dependent=true", "dependent=false");
                    // Change URL without reloading the page
                    history.replaceState({}, "", sNewHref);
			    }
    	        
			    
				var sUrl = location.origin + location.pathname;
				var aStartupParameters = location.search.slice(1).split("&");
				
				aStartupParameters = aStartupParameters.map(function(sParameter) {
                    if (sParameter.search("CNTRL") !== -1) {
                        sParameter = "CNTRL=" + sDrillDownTarget;
                    } else if (sParameter.search("dependent") !== -1) {
                        sParameter = "dependent=" + bDependent;
                    }
                    return sParameter;
				});

				sUrl += "?" + aStartupParameters.join("&");

				location.assign(sUrl);
			}
		},
		
		/**
		 * Remove initial app status before opening Dependant report
		 * @param {string} [sCtrl] - CNTRL that contains saved variant
		 * @param {sap.ui.model.odata.OData} [oVariantModel] - Odata instance model
		 * @returns {void}
		 */
		removeSavedAppParameters: function(sCtrl, oVariantModel) {
            var sUser = this.getComponentModel("authModel").getProperty("/USERID"),
		        sPath = "/VariantsSet(CTRLID='" + sCtrl + "',VariantId='InitialReport',UserId='" + sUser + "',isGlobal=0)";

            oVariantModel.remove(sPath, {
                success: function() {
                    jQuery.sap.log.info("Variant removed");
                },
                error: function(oError) {
                    jQuery.sap.log.error(oError);
                }
            });
		},
		
        /**
         * Get default values from ENTITY_NAME from configuration table
         * @param {string} sPath - Entity name with keys and without navigation path
         * @param {sap.ui.model.json.JSONModel} oInputParametersModel - instance of input parameters model
         * @return {void}
         * @private
         */
        _getDefaultEntityValues: function(sPath, oInputParametersModel) {
            // Get Keys with values
            var aValues = sPath.slice(sPath.indexOf("(") + 1, sPath.indexOf(")")).split(",");

            aValues.forEach(function(sValue) {
                // Separate Key from Value
                var sKey = sValue.slice(0, sValue.indexOf("=")),
                    oControlProperty = oInputParametersModel.getProperty("/controls/" + sKey),
                    sKeyValue;
                // Check for data type
                switch (oControlProperty.type) {
                    case "Edm.Byte":
                    case "Edm.Int16":
                    case "Edm.Int32":
                    case "Edm.Int64":
                    case "Edm.Decimal":
                    case "Edm.Single":
                    case "Edm.Double":
                        sKeyValue = sValue.slice(sValue.indexOf("=") + 1) * 1;
                        break;
                    case "Edm.DateTime":
                    case "Edm.String":
                    case "Edm.Time":
                    default:
                        sKeyValue = sValue.slice(sValue.indexOf("'") + 1, sValue.length - 1);
                        break;
                }

                // Set Value to the input parameters model
                oInputParametersModel.setProperty("/controls/" + sKey + "/value", sKeyValue);
            });
        },

        /**
         * Get Default Value for Input Parameters model from metadata
         * @param {sap.ui.model.odata.ODataModel} oModel - instance of oData model
         * @param {sap.ui.model.json.JSONModel} oInputParametersModel - instance of input parameters model
         * @return {void}
         * @private
         */
        _getMetadataDefaultValues: function(oModel, oInputParametersModel) {
            var aEntities = oModel.getServiceMetadata().dataServices.schema[0].entityType;

            $.grep(aEntities, function(oEntity) {
                // Check if Entity has navigation property
                if (oEntity.hasOwnProperty("navigationProperty") && oEntity.navigationProperty[0].name.search("HierarchyData_") === -1) {
                    var sEntity = oEntity.name.slice(0, oEntity.name.indexOf("Type")),
                        sNavigationProperty = oEntity.navigationProperty[0].name;

                    // Set Entity name
                    oInputParametersModel.setProperty("/entityName", sEntity);
                    // Set Navigation name
                    oInputParametersModel.setProperty("/navigation", sNavigationProperty);

                    oEntity.property.map(function(oProperty) {
                        var sPath = oProperty.name;

                        // Set Value to the input parameters model
                        oInputParametersModel.setProperty("/controls/" + sPath, {
                            label: oProperty.extensions[0].value,
                            value: oProperty.defaultValue,
                            type: oProperty.type,
                            maxLength: oProperty.maxLength
                        });
                    });
                }
            });
        },
        
        /**
         * Create ENTITY_NAME property in Config model based on input
         * parameters model
         * @param {sap.ui.model.json.JSONModel} oInputParametersModel - instance of input parameters model
         * @param {sap.ui.model.json.JSONModel} oConfigModel - instance of config model
         * @return {void}
         */
        _setEntityNameWithInputParams: function(oInputParametersModel, oConfigModel) {
            var sEntityPath = "",
                oControls = oInputParametersModel.getProperty("/controls"),
                iPropertyCount = 0,
                iObjectLength = Object.keys(oInputParametersModel.getProperty("/controls")).length;

            sEntityPath = oInputParametersModel.getProperty("/entityName") + "(";

            for (var sTechName in oInputParametersModel.getProperty("/controls")) {
                iPropertyCount++;

                switch (oControls[sTechName].type) {
                    case "Edm.Byte":
                    case "Edm.Int16":
                    case "Edm.Int32":
                    case "Edm.Int64":
                    case "Edm.Decimal":
                    case "Edm.Single":
                    case "Edm.Double":
                        oControls[sTechName].value = oControls[sTechName].value ? oControls[sTechName].value : 0;
                        sEntityPath += sTechName + "=" + oControls[sTechName].value;
                        break;
                    case "Edm.DateTime":
                        oControls[sTechName].value = oControls[sTechName].value ? oControls[sTechName].value : new Date().toISOString();
                        sEntityPath += sTechName + "=datetime'" + oControls[sTechName].value + "'";
                        break;
                    case "Edm.Time":
                        oControls[sTechName].value = oControls[sTechName].value ? oControls[sTechName].value : new Date().getTime();
                        sEntityPath += sTechName + "=time'" + oControls[sTechName].value + "'";
                        break;
                    case "Edm.String":
                    default:
                        oControls[sTechName].value = oControls[sTechName].value ? oControls[sTechName].value : "";
                        sEntityPath += sTechName + "='" + oControls[sTechName].value + "'";
                        break;
                }

                sEntityPath += iPropertyCount === iObjectLength ? ")" : ",";
            }

            sEntityPath += "/" + oInputParametersModel.getProperty("/navigation");

            oConfigModel.setProperty("/ENTITY_NAME", sEntityPath);
        },

		/**
		 * Event handler for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		handleNavBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("master", {}, true);
			}
		},
		
		/**
		 * method which returns the Busy dialog instance.
		 * 
		 * @public
		 * @returns {Object} - Busy Dialog Instance
		 */
		getBusyDialog: function() {
			// initialize the fragment to display Busy Dialog
			// Lazy Loading

			if (!this._oBusyDialog) {

				// Create dialog using fragment factory
				this._oBusyDialog = sap.ui.xmlfragment(this._getBusyDailogId(),
					"com.siemens.tableViewer/view/tabs/fragments/BusyDialog", this);

				// Connect dialog to view
				this.getView().addDependent(this._oBusyDialog);
			}
			return this._oBusyDialog;
		},
		/**
		 * method to create the Id for Busy Dialog
		 * 
		 * @private
		 * @returns {string} - ID
		 */
		_getBusyDailogId: function() {
			return this.createId("siemensUiFragBusyDialog");
		},

	});
});
