sap.ui.define([
        "sap/m/TablePersoDialog",
        "sap/m/InputListItem",
        "jquery.sap.global"
    ],
    function(TablePersoDialog, InputListItem, q) {
        "use strict";

        return TablePersoDialog.extend("com.siemens.tableViewer.control.CustomTablePersoDialog", {
            init: function() {
                var t = this;
                sap.m.TablePersoDialog.prototype.init.apply(this, arguments);

                this._fnUpdateCheckBoxes = q.proxy(function(e) {
                    var s = e.getParameter('selected'),
                        d = this._oP13nModel.getData();
                    if (e.getSource().getId() === this._getSelectAllCheckboxId()) {
                        d.aColumns.forEach(function(c) {
                            if (c.supportHidden) {
                                c.visible = s;
                            }
                        });
                    } else {
                        var S = !d.aColumns.some(function(c) {
                            return !c.visible;
                        });
                        d.aHeader.visible = S;
                    }
                    this._oP13nModel.setData(d);
                }, this);

                this._oColumnItemTemplate = new InputListItem({
                    label: '{Personalization>text}',
                    content: new sap.m.CheckBox({
                        enabled: '{Personalization>supportHidden}',
                        selected: '{Personalization>visible}',
                        select: this._fnUpdateCheckBoxes
                    })
                }).addStyleClass('sapMPersoDialogLI');
                
                this._oList.detachSelectionChange(this._fnUpdateArrowButtons);
                
                this._fnUpdateArrowButtons = function() {
                    var b = true
                      , c = true
                      , v = t._oSearchField.getValue()
                      , i = t._oList.getItems().length;
                    if (!!v || t._oList.getSelectedItems().length === 0) {
                        c = false;
                        b = false;
                    } else {
                        if (t._oList.getItems()[0].getSelected()) {
                            c = false;
                            b = false;
                            q.sap.focus(t._oButtonDown.getDomRef());
                        }
                        if (t._oList.getItems()[1].getSelected()) {
                            c = false;
                            q.sap.focus(t._oButtonDown.getDomRef());
                        }
                        if (t._oList.getItems()[i - 1].getSelected()) {
                            b = false;
                            q.sap.focus(t._oButtonUp.getDomRef());
                        }
                    }
                    t._oButtonUp.setEnabled(c);
                    t._oButtonDown.setEnabled(b);
                };
                
                this._oList.attachSelectionChange(this._fnUpdateArrowButtons, this);
            },
            renderer: {}
        });
    });
