sap.ui.define([
	"sap/ui/table/TreeTable",
    "com/siemens/tableViewer/control/CustomV2ODataTreeBinding"
], function(TreeTable) {
	"use strict";
	return TreeTable.extend("com.siemens.tableViewer.control.CustomTreeTable", {
		renderer : {}
	});
});