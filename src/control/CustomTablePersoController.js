sap.ui.define([
        "sap/ui/table/TablePersoController",
        "com/siemens/tableViewer/control/CustomTablePersoDialog",
        "jquery.sap.global"
    ],
    function(TablePersoController, TablePersoDialog, q) {
        "use strict";

        return TablePersoController.extend("com.siemens.tableViewer.control.CustomTablePersoController", {
            renderer: {},
            openDialog: function(s) {
                if (!this._oDialog) {
                    this._aColumnProperties.push("supportHidden");

                    var that = this;
                    this._oDialog = new TablePersoDialog({
                        persoService: this.getPersoService(),
                        showSelectAll: false,
                        showResetAll: false,
                        grouping: false,
                        contentWidth: s && s.contentWidth,
                        contentHeight: s && s.contentHeight || "20rem",
                        initialColumnState: this._oInitialPersoData.aColumns,
                        columnInfoCallback: function(o, p, P) {
                            return that._getCurrentTablePersoData(true).aColumns;
                        },
                        confirm: function() {
                            this.retrievePersonalizations().aHeader = {};
                            that._adjustTable(this.retrievePersonalizations());
                            if (that.getAutoSave()) {
                                that.savePersonalizations();
                            }
                        }
                    });
                    this._oDialog._oDialog.removeStyleClass("sapUiPopupWithPadding");
                    q.sap.syncStyleClass("sapUiSizeCompact", this._getTable(), this._oDialog._oDialog);
                }
                this._oDialog.open();
            },
            _getCurrentTablePersoData: function(f) {
                var t = this._getTable()
                  , c = t.getColumns();
                var d = {
                    aColumns: []
                };
                for (var i = 0, l = c.length; i < l; i++) {
                    var C = c[i];
                    var p = this._getColumnPersoKey(C);
                    var o = {
                        id: p,
                        order: i
                    };
                    var m = C.getMetadata();
                    for (var j = 0, a = this._aColumnProperties.length; j < a; j++) {
                        var P = this._aColumnProperties[j];
                        if (m.hasProperty(P)) {
                            o[P] = C.getProperty(P);
                        }
                    }
                    if (f) {
                        if (o.order === 0) {
                            o.text = C.getLabel().getFixContent()[0].getText();
                        } else {
                            o.text = C.getLabel() && C.getLabel().getText() || p;
                        }
                    }
                    d.aColumns.push(o);
                }
                return d;
            }
        });
    });
