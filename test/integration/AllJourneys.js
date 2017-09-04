sap.ui.define(['sap/ui/base/Object'], function (Ui5Object) {
	'use strict';
	return Ui5Object.extend('com.siemens.tableViewer.test.integration.AllJourneys', {
		start: function (oConfig) {
			oConfig = oConfig || {};
			jQuery.sap.require('sap.ui.qunit.qunit-css');
			jQuery.sap.require('sap.ui.thirdparty.qunit');
			jQuery.sap.require('sap.ui.qunit.qunit-junit');
			jQuery.sap.require('sap.ui.test.opaQunit');
			jQuery.sap.require('sap.ui.test.Opa5');
			jQuery.sap.require('com.siemens.tableViewer.test.integration.pages.Common');
			jQuery.sap.require('com.siemens.tableViewer.test.integration.pages.App');
			jQuery.sap.require('com.siemens.tableViewer.test.integration.pages.Browser');
			jQuery.sap.require('com.siemens.tableViewer.test.integration.pages.FilterBar');
			jQuery.sap.require("com.siemens.tableViewer.test.integration.pages.TableViewer");
			jQuery.sap.require("com.siemens.tableViewer.test.integration.pages.Variant");
			jQuery.sap.require("com.siemens.tableViewer.test.integration.pages.Tree");
			sap.ui.test.Opa5.extendConfig({
				arrangements: new com.siemens.tableViewer.test.integration.pages.Common(oConfig),
				viewNamespace: 'com.siemens.tableViewer.view.'
			});
			jQuery.sap.require("com.siemens.tableViewer.test.integration.TableViewerJourney");
			jQuery.sap.require('com.siemens.tableViewer.test.integration.FilterBarJourney');
			jQuery.sap.require('com.siemens.tableViewer.test.integration.VariantJourney');
			jQuery.sap.require('com.siemens.tableViewer.test.integration.TreeJourney');
		}
	});
});
