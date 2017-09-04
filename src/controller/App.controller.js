sap.ui.define([
	"com/siemens/tableViewer/controller/BaseController"
], function (BaseController) {
	"use strict";

	return BaseController.extend("com.siemens.tableViewer.controller.App", {

		onInit: function () {
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			var sAppTitle = this.getComponentModel("mainConfig").getProperty("/DESCRIPTION");
			document.title = this.getResourceBundle().getText("documentTitle", sAppTitle);
		}
	});

});
