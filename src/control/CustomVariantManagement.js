sap.ui.define([
       "sap/ui/comp/variants/VariantManagement"
   ], function(VariantManagement) {
	"use strict";
	return VariantManagement.extend("com.siemens.tableViewer.control.CustomVariantManagement", {
		renderer : {},
		exit: function() {
			VariantManagement.prototype.exit.apply(this, arguments);
			// Add missing VariantManagement objects which not removed
			if (this.oActionSheet) {
	            this.oActionSheet.destroy();
	            this.oActionSheet = undefined;
	        }
			if (this.oExecuteOnSelect) {
	            this.oExecuteOnSelect.destroy();
	            this.oExecuteOnSelect = undefined;
	        }
			if (this.oVariantManage) {
	            this.oVariantManage.destroy();
	            this.oVariantManage = undefined;
	        }
		}
	});
});