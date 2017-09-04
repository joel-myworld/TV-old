sap.ui.define([
        "sap/ui/table/Column"
    ],
    function(Column) {
        "use strict";

        return Column.extend("com.siemens.tableViewer.control.CustomColumn", {
            metadata: {
                properties: {
                    coloredStyleClass: "sap.ui.core.CSSColor",
                    supportHidden: {type: "boolean", defaultValue: true},
                    isCellFormat: {type: "boolean", defaultValue: false} //for conditional cell formatting
                }
            }
        });
    });
