sap.ui.define([
	"sap/m/P13nFilterPanel",
	"com/siemens/tableViewer/control/CustomP13nConditionPanel"
	], function(P13nFilterPanel, P13nConditionPanel) {
	"use strict";

	return P13nFilterPanel.extend("com.siemens.tableViewer.control.CustomP13nFilterPanel", {
		// Beginning of changes
        metadata: {
            properties: {
                fieldID: "string",
                entitySet: "string",
                columnType: "float"
            }
        },
        // End of changes

        _updatePanel: function () {
            var m = this.getMaxIncludes() === '-1' ? 1000 : parseInt(this.getMaxIncludes(), 10);
            var M = this.getMaxExcludes() === '-1' ? 1000 : parseInt(this.getMaxExcludes(), 10);

            // Beginning of changes
            this._oIncludeFilterPanel.setFieldID(this.getFieldID());
            this._oIncludeFilterPanel.setEntitySet(this.getEntitySet());
            this._oIncludeFilterPanel.setColumnType(this.getColumnType());

            this._oExcludeFilterPanel.setFieldID(this.getFieldID());
            this._oExcludeFilterPanel.setEntitySet(this.getEntitySet());
            this._oExcludeFilterPanel.setColumnType(this.getColumnType());

            // End of changes

            if (m > 0) {
                if (M <= 0) {
                    this._oIncludePanel.setHeaderText(null);
                    this._oIncludePanel.setExpandable(false);
                    this._oIncludePanel.addStyleClass('panelTopMargin');
                }
            }
            if (M === 0) {
                this._oExcludePanel.setHeaderText(null);
                this._oExcludePanel.setExpandable(false);
            }
        },
        init: function () {
            sap.ui.getCore().loadLibrary('sap.ui.layout');
            jQuery.sap.require('sap.ui.layout.Grid');
            sap.ui.layout.Grid.prototype.init.apply(this);
            this._aKeyFields = [];
            this.addStyleClass('sapMFilterPanel');
            this._oRb = sap.ui.getCore().getLibraryResourceBundle('sap.m');
            if (!this._aIncludeOperations) {
                this.setIncludeOperations([sap.m.P13nConditionOperation.Contains, sap.m.P13nConditionOperation.EQ, sap.m.P13nConditionOperation.BT, sap.m.P13nConditionOperation.StartsWith, sap.m.P13nConditionOperation.EndsWith, sap.m.P13nConditionOperation.LT, sap.m.P13nConditionOperation.LE, sap.m.P13nConditionOperation.GT, sap.m.P13nConditionOperation.GE]);
            }
            if (!this._aExcludeOperations) {
                this.setExcludeOperations([sap.m.P13nConditionOperation.EQ]);
            }
            this._oIncludePanel = new sap.m.Panel({
                expanded: true,
                expandable: true,
                headerText: this._oRb.getText('FILTERPANEL_INCLUDES'),
                width: 'auto'
            }).addStyleClass('sapMFilterPadding');

            // Beginning of changes
			// Change standard P13nConditionPanel control for CustomP13nConditionPanel
			this._oIncludeFilterPanel = new P13nConditionPanel({
				// End of changes
                maxConditions: this.getMaxIncludes(),
                autoAddNewRow: true,
                alwaysShowAddIcon: false,
                layoutMode: this.getLayoutMode(),
                dataChange: this._handleDataChange()
            });

            this._oIncludeFilterPanel.setOperations(this._aIncludeOperations);
            this._oIncludeFilterPanel.setOperations([sap.m.P13nConditionOperation.Contains, sap.m.P13nConditionOperation.EQ, sap.m.P13nConditionOperation.BT, sap.m.P13nConditionOperation.StartsWith, sap.m.P13nConditionOperation.EndsWith, sap.m.P13nConditionOperation.LT, sap.m.P13nConditionOperation.LE, sap.m.P13nConditionOperation.GT, sap.m.P13nConditionOperation.GE], 'string');
            this._oIncludeFilterPanel.setOperations([sap.m.P13nConditionOperation.EQ, sap.m.P13nConditionOperation.BT, sap.m.P13nConditionOperation.LT, sap.m.P13nConditionOperation.LE, sap.m.P13nConditionOperation.GT, sap.m.P13nConditionOperation.GE], 'date');
            this._oIncludeFilterPanel.setOperations([sap.m.P13nConditionOperation.EQ, sap.m.P13nConditionOperation.BT, sap.m.P13nConditionOperation.LT, sap.m.P13nConditionOperation.LE, sap.m.P13nConditionOperation.GT, sap.m.P13nConditionOperation.GE], 'numeric');
            this._oIncludePanel.addContent(this._oIncludeFilterPanel);
            this.addAggregation('content', this._oIncludePanel);
            this._oExcludePanel = new sap.m.Panel({
                expanded: false,
                expandable: true,
                headerText: this._oRb.getText('FILTERPANEL_EXCLUDES'),
                width: 'auto'
            }).addStyleClass('sapMFilterPadding');
            // Beginning of changes
            // Change standard P13nConditionPanel control for CustomP13nConditionPanel
            this._oExcludeFilterPanel = new P13nConditionPanel({
				// End of changes
                exclude: true,
                maxConditions: this.getMaxExcludes(),
                autoAddNewRow: true,
                alwaysShowAddIcon: false,
                layoutMode: this.getLayoutMode(),
                dataChange: this._handleDataChange()
            });

            this._oExcludeFilterPanel.setOperations(this._aExcludeOperations);
            this._oExcludePanel.addContent(this._oExcludeFilterPanel);
            this.addAggregation('content', this._oExcludePanel);
            this._updatePanel();
        },
        
        renderer: {}
	});
});
