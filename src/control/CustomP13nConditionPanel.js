sap.ui.define([
	"sap/m/P13nConditionPanel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "com/siemens/tableViewer/model/formatter"
	], function(P13nConditionPanel, Filter, FilterOperator, formatter) {
	"use strict";

	return P13nConditionPanel.extend("com.siemens.tableViewer.control.CustomP13nConditionPanel", {
		// Beginning of changes
        metadata: {
            properties: {
                fieldID: "string",
                entitySet: "string",
                columnType: "float"
            }
        },

        /**
         * Handle inputed items into input field in the Value Help Dialog
         * @private
         * @param {object} oEvent
         */
        _handleSuggestionItems: function(oEvent) {
			var sTerm = oEvent.getParameter("suggestValue"),
				oInput = oEvent.getSource();

			oInput.destroySuggestionItems();
			//tolower included for case insensitive search
			this.getModel().read(this.getEntitySet(), {
				filters: [new Filter("tolower(" + this.getFieldID() + ")", FilterOperator.StartsWith, "tolower('" + sTerm + "')")],
				urlParameters: {
					"$select": this.getFieldID()
				},
				success: function(oData, response) {
					oData.results.map(function(oObject) {
						oInput.addSuggestionItem(new sap.ui.core.Item({text: oObject[this.getFieldID()]}));
					}.bind(this));
				}.bind(this)
			});
        },
        // End of changes

        _createField: function (c, f, o) {
            var b;
            var s = c ? c.type : '';
            var that = this;
            var p = {
                value: f['Value'],
                width: '100%',
                placeholder: f['Label'],

                // Beginning of changes
                showSuggestion: !(this.getColumnType() === 3 || this.getColumnType() === 7 || this.getColumnType() === 20 || this.getColumnType() === 21 || this.getColumnType() === 22),
                startSuggestion: 2,
                suggest: this._handleSuggestionItems.bind(this),
                // End  of changes

                change: function () {
                    that._changeField(o);
                },
                layoutData: new sap.ui.layout.GridData({
                    span: f['Span']
                })
            };
            switch (s) {
                case 'numeric':
                    var F;
                    if (c.precision || c.scale) {
                        F = {};
                        if (c.precision) {
                            F['maxIntegerDigits'] = parseInt(c.precision, 10);
                        }
                        if (c.scale) {
                            F['maxFractionDigits'] = parseInt(c.scale, 10);
                        }
                    }
                    o.oFormatter = sap.ui.core.format.NumberFormat.getFloatInstance(F);
                    b = new sap.m.Input(p);
                    break;
                case 'date':
                    o.oFormatter = sap.ui.core.format.DateFormat.getDateInstance();
                    b = new sap.m.DatePicker(p);
                    break;
                default:
                    o.oFormatter = null;
                    b = new sap.m.Input(p);
            }
            if (c && c.maxLength && b.setMaxLength) {
                var l = -1;
                if (typeof c.maxLength === 'string') {
                    l = parseInt(c.maxLength, 10);
                }
                if (typeof c.maxLength === 'number') {
                    l = c.maxLength;
                }
                if (l > 0) {
                    b.setMaxLength(l);
                }
            }
            return b;
        },
        renderer: {}
	});
});
