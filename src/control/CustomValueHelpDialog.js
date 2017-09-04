sap.ui.define([
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    "com/siemens/tableViewer/control/CustomP13nFilterPanel",
    "sap/ui/table/Table",
    "com/siemens/tableViewer/model/formatter",
    'jquery.sap.global'
], function(ValueHelpDialog, P13nFilterPanel, c, formatter, jGlobal) {
    "use strict";
    /* global $ */
    return ValueHelpDialog.extend("com.siemens.tableViewer.control.CustomValueHelpDialog", {
        // Beginning of changes
        metadata: {
            properties: {
                fieldID: "string",
                entitySet: "string",
                columnType: "float"
            }
        },

        formatter: formatter,

        updateTable: function() {
            var i, j, o, d;

            this.oRows = this.theTable.getBinding('rows');
            this.ignoreSelectionChange = true;
            this.theTable.clearSelection();
            //condition to handle clear icon press in search field
            if (this._bClearButtonPressed) {
              //get all the row indices and make it selected
              var aIndices = this.theTable._aIndices;
              aIndices = aIndices ? aIndices : []; 
              for (var iIndex = 0; iIndex < aIndices.length; iIndex++) {
                this.theTable.addSelectionInterval(aIndices[iIndex], aIndices[iIndex]);
              }
              //reset the flag
              this._bClearButtonPressed = false;
              //refresh the binding to remember the selections
              this.theTable.getBinding("rows").refresh(true);
              //this.theTable.getModel().refresh(true);
            } else if (this._bSearchButtonPressed) {
              //condition to handle search icon press in search field
              var e1 = this._oSelectedItems.getItems();
              for (var j1 = 0; j1 < e1.length; j1++) {
                var k1 = e1[j1];
                var sSelValue = this._oSelectedItems.getModelData()[0][this.getKey()];
                for (var i1 = 0; i1 < this.oRows.aKeys.length; i1++) {
                  if (this.oRows.oModel.getProperty("/" + this.oRows.aKeys[i1])[this.getKey()]) {
                    // Check if selected Items match received value
                    if (sSelValue.toString() === this.oRows.oModel.getProperty("/" + this.oRows.aKeys[i1])[this.getKey()].toString()) {
                      // Get Matched Path
                      var s1 = this.oRows.aKeys[i1];
                      // Remove old path from selected items
                      this._oSelectedItems.remove(k1);
                      // Get Selected token (by old path)
                      var t1 = this._getTokenByKey(k1, this._oSelectedTokens);
                      if (t1) {
                        // Set new key to old Path
                        t1.setKey(s1);
                      }
                      var d1 = this.theTable.getContextByIndex(i1);
                      if (d1) {
                        var o1 = d1.getObject();
                        this._oSelectedItems.add(s1, o1);
                      }
                      this.theTable.addSelectionInterval(i1, i1);
                      break;
                    }
                  }
                }
              }
              //reset the flag
              this._bSearchButtonPressed = false;
              //refresh the binding to remember the selection
              this.theTable.getBinding("rows").refresh(true);
              //this.theTable.getModel().refresh(true);
            } else {
              // Get Selected Items
              var e = this._oSelectedItems.getItems();
              // Check if table received data
              if (this.oRows.aKeys) {
                for (j = 0; j < e.length; j++) {
                  // Get Selected Path
                  var k = e[j],
                  sSelectedValue;
                  // Get Selected Value
                  if (new Date(k).toString() !== "Invalid Date") {
                    sSelectedValue = k;
                  } else {
                    sSelectedValue = this._oSelectedItems.getModelData()[0][this.getKey()];
                  }
                  // Go trough all received items
                  for (i = 0; i < this.oRows.aKeys.length; i++) {
                    // Check if value not null
                    if (this.oRows.oModel.getProperty("/" + this.oRows.aKeys[i])[this.getKey()]) {
                      // Check if selected Items match received value
                      if (sSelectedValue.toString() === this.oRows.oModel.getProperty("/" + this.oRows.aKeys[i])[this.getKey()].toString()) {
                        // Get Matched Path
                        var s = this.oRows.aKeys[i];
                        // Remove old path from selected items
                        this._oSelectedItems.remove(k);
                        // Get Selected token (by old path)
                        var t = this._getTokenByKey(k, this._oSelectedTokens);
                        if (t) {
                          // Set new key to old Path
                          t.setKey(s);
                        }
                        d = this.theTable.getContextByIndex(i);
                        if (d) {
                          o = d.getObject();
                          this._oSelectedItems.add(s, o);
                        }
                        this.theTable.addSelectionInterval(i, i);
                        break;
                      }else {
                        //above if condition takes only the zero index value, for other selected items to be marked loop in again and mark as selected.
                        for (var j2 = 0; j2 < e.length; j2++) {
                          var sValue = this._oSelectedItems.getModelData()[j2][this.getKey()];
                          if (sValue.toString() === this.oRows.oModel.getProperty("/" + this.oRows.aKeys[i])[this.getKey()].toString()) {
                            this.theTable.addSelectionInterval(i, i);
                            break;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }

            this.ignoreSelectionChange = false;
            this._updateTitles();
        },
        // End of changes

        _createRanges: function() {
            this._oFilterPanel = new P13nFilterPanel({
                // Beginning of changes
                fieldID: this.getFieldID(),
                entitySet: this.getEntitySet(),
                columnType: this.getColumnType(),
                // End of changes

                maxIncludes: this.getMaxIncludeRanges(),
                maxExcludes: this.getMaxExcludeRanges(),
                containerQuery: true,
                addFilterItem: $.proxy(function(E) {
                    var p = E.mParameters;
                    var o = {
                        exclude: p.filterItemData.exclude,
                        keyField: p.filterItemData.columnKey,
                        operation: p.filterItemData.operation,
                        value1: p.filterItemData.value1,
                        value2: p.filterItemData.value2
                    };
                    this._oSelectedRanges[p.key] = o;
                    var t = this._getFormatedRangeTokenText(o.operation, o.value1, o.value2, o.exclude, o.keyField);
                    this._addToken2Tokenizer(p.key, t, o.exclude ? this._oExcludedTokens : this._oSelectedTokens);
                    this._updateTokenizer();
                }, this),
                removeFilterItem: $.proxy(function(E) {
                    var p = E.mParameters;
                    delete this._oSelectedRanges[p.key];
                    this._removeToken(p.key);
                    this._updateTokenizer();
                }, this),
                updateFilterItem: $.proxy(function(E) {
                    var p = E.mParameters;
                    var o = this._oSelectedRanges[p.key];
                    o.exclude = p.filterItemData.exclude;
                    o.keyField = p.filterItemData.columnKey;
                    o.operation = p.filterItemData.operation;
                    o.value1 = p.filterItemData.value1;
                    o.value2 = p.filterItemData.value2;
                    var t = this._getFormatedRangeTokenText(o.operation, o.value1, o.value2, o.exclude, o.keyField);
                    this._addToken2Tokenizer(p.key, t, o.exclude ? this._oExcludedTokens : this._oSelectedTokens);
                    this._updateTokenizer();
                }, this)
            });
            if (this.getColumnType() === 11) {
                this._aIncludeRangeOperations = ["EQ", "BT", "LT", "LE", "GT", "GE", "Contains", "StartsWith", "EndsWith"];
                //this._aExcludeRangeOperations = ["EQ", "Contains", "StartsWith", "EndsWith"];
            }
            this._oFilterPanel.setIncludeOperations(this._aIncludeRangeOperations);
            this._oFilterPanel.setExcludeOperations(this._aExcludeRangeOperations);
            if (this._aRangeKeyFields) {
                this._aRangeKeyFields.forEach(function(i) {
                    i["text"] = i.label;
                });
                this._oFilterPanel.setKeyFields(this._aRangeKeyFields);
            }
            var d = [];
            if (this._oSelectedRanges) {
                for (var r in this._oSelectedRanges) {
                    var e = this._oSelectedRanges[r];
                    d.push({
                        key: r,
                        exclude: e.exclude,
                        keyField: e.keyField,
                        operation: e.operation,
                        value1: e.value1,
                        value2: e.value2
                    });
                }
            }
            this._oFilterPanel.setConditions(d);
            this._oRangeScrollContainer = new sap.m.ScrollContainer({
                vertical: true,
                horizontal: false,
                width: "100%",
                height: "300px",
                content: [this._oFilterPanel]
            });
            var R = new sap.ui.layout.Grid({
                width: "100%",
                defaultSpan: "L12 M12 S12",
                vSpacing: 0,
                hSpacing: 0,
                content: [this._oRangeScrollContainer]
            });
            this._sValidationDialogTitle = this._oRb.getText("VALUEHELPVALDLG_TITLE");
            this._sValidationDialogMessage = this._oRb.getText("VALUEHELPVALDLG_MESSAGE");
            this._sValidationDialogFieldMessage = this._oRb.getText("VALUEHELPVALDLG_FIELDMESSAGE");
            return R;
        },
        _createTable: function() {
            var that = this,
            //toolbar to the table to contain search field
            oToolbar = this._getTableToolbar();
            var o = new c({
                title: 'Items',
                selectionBehavior: sap.ui.table.SelectionBehavior.Row,
                selectionMode: this.getSupportMultiselect() ? sap.ui.table.SelectionMode.MultiToggle : sap.ui.table.SelectionMode.Single,
                noDataText: this._oRb.getText('VALUEHELPDLG_TABLE_PRESSSEARCH'),
                toolbar : oToolbar,
                rowHeight: 32,
                rowSelectionChange: function(d) {

                    if (that.ignoreSelectionChange) {
                        return;
                    }
                    var e = d.getSource();
                    var f = d.getParameter('rowIndices');
                    this._aIndices = f; //global variable declared, used during clear selection of search field
                    var i, n = f.length;
                    var g;
                    var h;
                    var r;
                    var newR;
                    var oDateFormat2;
                    for (i = 0; i < n; i++) {
                        g = f[i];
                        h = e.getContextByIndex(g);
                        r = h ? h.getObject() : null;
                        //if (!r && f[i] === -1) {
                        //show error message when the object is undefined and select all is selected.
                        if (!r && this.getBinding("rows").iLength === n) {
                            sap.m.MessageBox.show(that._oRb.getText('VALUEHELPDLG_SELECTIONFAILED'), {
                                icon: sap.m.MessageBox.Icon.ERROR,
                                title: that._oRb.getText('VALUEHELPDLG_SELECTIONFAILEDTITLE'),
                                actions: [sap.m.MessageBox.Action.OK],
                                styleClass: !!this.$().closest('.sapUiSizeCompact').length ? 'sapUiSizeCompact' : ''
                            });
                            return;
                        }
                    }
                    var u = false;
                    if (that.theTable.getBinding('rows').aKeys) {
                        u = true;
                    }
                    for (i = 0; i < n; i++) {
                        g = f[i];
                        h = e.getContextByIndex(g);
                        r = h ? h.getObject() : null;
                        if (r) {
                            var k;
                            if (u) {
                                k = h.sPath.substring(1);
                            } else {
                                k = r[that.getKey()];
                            }
                            if (e.isIndexSelected(g)) {
                                newR = r[that.theTable.getAggregation("columns")[0].oBindingContexts.columns.oModel.oData.cols[0].template];
                                if ( typeof newR === "object" && newR.__edmType === "Edm.Time"){
                                    var timeObj = new sap.ui.model.odata.type.Time({ source : { __edmtype: "Edm.Time" }, pattern: "HH:mm:ss"});
                                    var timeVal = timeObj.formatValue(newR,"string");
                                    var cpr = $.extend({}, r);
                                    cpr[that.theTable.getAggregation("columns")[0].oBindingContexts.columns.oModel.oData.cols[0].template] = timeVal;
                                    //import filterprovider
                                    jGlobal.sap.require('sap.ui.comp.smartfilterbar.FilterProvider');
                                    that._oSelectedItems.add(k,cpr);
                                    that._addToken2Tokenizer(k, timeVal, that._oSelectedTokens);
                                } else {
                                	var sTokenTooltip;
                                    that._oSelectedItems.add(k, r);
                                  //convert formatted token text to string for integer data type. Defect fix for CO-598
                                    if (this.getParent().getParent().getParent().getColumnType() === 3) {
                                        sTokenTooltip = (that._getFormatedTokenText(k)).toString();
                                    }else {
                                        sTokenTooltip = that._getFormatedTokenText(k);
                                    }
                                    //that._addToken2Tokenizer(k, that._getFormatedTokenText(k), that._oSelectedTokens);
                                    that._addToken2Tokenizer(k, sTokenTooltip, that._oSelectedTokens);
                                }
                                if (newR instanceof Date) {
                                    oDateFormat2 = that.formatter.getDateTimeInstance("dd.MM.yyyy");
                                    for (var iLength = 0; iLength < that._oSelectedTokens.getAggregation("tokens").length; iLength++) {
                                        //ignore if the token text is already in the format based on the regex match
                                        if (((that._oSelectedTokens.getAggregation("tokens")[iLength].mProperties.text).match(/(\d{1,2}).(\d{1,2}).(\d{4})/)) === null) {
                                            var oDate = new Date(that._oSelectedTokens.getAggregation("tokens")[iLength].mProperties.text);
                                            if (!isNaN(oDate.getDate())) {
                                                that._oSelectedTokens.getAggregation("tokens")[iLength].mProperties.text = oDateFormat2.format(oDate);
                                            }
                                        }
                                    }
                                }
                                if (this.getParent().getParent().getParent().getColumnType() === 17) {
                                    for (var iLen = 0; iLen < that._oSelectedTokens.getAggregation("tokens").length; iLen++) {
                                    //ignore if the token text is already in the format based on the regex match
                                    if ((that._oSelectedTokens.getAggregation("tokens")[iLen].mProperties.text).match(/(\d{4}).(\d{1,2})$/) !== null) {
                                          var oMonthDate = that._oSelectedTokens.getAggregation("tokens")[iLen].mProperties.text;
                                          that._oSelectedTokens.getAggregation("tokens")[iLen].mProperties.text = oMonthDate.substring(4,oMonthDate.length) + "." + oMonthDate.substring(0,4);
                                    }
                                  }
                                }
                            } else {
                              //since the path of the token keeps changing get the data from the token and items of the table
                              //compare it. if it is equal get the path of the matched condition and use it to remove the items from selected items
                              //and to remove the tokens from tokenizer
                              for (var key in that._oSelectedItems.items) {
                                for (var key1 in that._oSelectedItems.items[key]) {
                                  if (that._oSelectedItems.items[key][key1] === r[that.getKey()]) {
                                    //key is path ex. ('FreeCrossPlant.....')
                                    //key1 is column name ex. TESTL
                                    that._oSelectedItems.remove(key);
                                    that._removeTokenFromTokenizer(key, that._oSelectedTokens);
                                    break;
                                  }
                                }
                              }
                              that._updateTokenizer();
                            }
                          }
                        }
                        that._updateTitles();
                        if (!that.getSupportMultiselect()) {
                          that._onCloseAndTakeOverValues()();
                        }
                      }
                    }).addStyleClass('compVHMainTable');

            o.bindAggregation('columns', 'columns>/cols', function(i, d) {
                var e, f;
                if (d.getProperty('type') === 'string') {
                    f = {
                        path: d.getProperty('template')
                    };
                }
                if (d.getProperty('type') === 'boolean') {
                    e = new sap.m.CheckBox({
                        enabled: false,
                        selected: {
                            path: d.getProperty('template')
                        }
                    });
                } else {
                    e = new sap.m.Text({
                        wrapping: false,
                        text: {
                            path: d.getProperty('template'),
                            type: d.getProperty('oType')
                        },
                        tooltip: f
                    });
                }
                return new sap.ui.table.Column(i, {
                    label: '{columns>label}',
                    tooltip: '{columns>label}',
                    template: e,
                    width: '{columns>width}',
                    hAlign: e instanceof sap.m.CheckBox ? sap.ui.core.HorizontalAlign.Center : sap.ui.core.HorizontalAlign.Begin,
                    filterProperty: d.getProperty('filter')
                });
            });

            this.theTable = o;
        },

        /**
          *Method to generate toolbar for filter dialog table
          *@returns {object} oToolbar - toolbar control for table
          *@private
          *
        **/

        _getTableToolbar : function() {
          var oToolbar = new sap.m.Toolbar({enabled : {
            path : "",
            formatter : function() {
              var oValueHelpDialog = this.getParent().getParent().getParent().getParent();
              var sColumnType = oValueHelpDialog.getColumnType();
              var bEnable = false;

              if (sColumnType === 11) {
                bEnable = true;
              }else {
                bEnable = false;
              }

              return bEnable;

            }
          }});
          oToolbar.addContent(
            new sap.m.SearchField({ width : "100%",
                search : function (oEvent) {
                  var sSearch = oEvent.getParameter("query"),
                  oTable = this.getParent().getParent(),
                  aColumns = oTable.getAggregation("columns"),
                  oBinding = oTable.getBinding("rows"),
                  sPath,
                  oObject,
                  sFilterPath,
                  oFilter,
                  oValueHelpDialog = this.getParent().getParent().getParent().getParent().getParent(),
                  sColumnType = oValueHelpDialog.getColumnType(),
                  sOperator;

                  //check if clear button search field is pressed
                  if (oEvent.getParameter("refreshButtonPressed") === undefined && oEvent.getParameter("query") === "") {
                    oValueHelpDialog._bClearButtonPressed = true;
                    //set flag for search of table is done
                    oValueHelpDialog._bSearchButtonPressed = false;
                  }else {
                    oValueHelpDialog._bClearButtonPressed = false;
                    //set flag for search of table is done
                    oValueHelpDialog._bSearchButtonPressed = true;
                  }

                  if (sColumnType === 11) {
                    sOperator = "Contains";
                  }else {
                    sOperator = "EQ";
                  }

                  if (sSearch == undefined) {
                    sSearch = oEvent.getParameters().newValue;
                  }
                  if (!sSearch && sSearch.length === 0) {
                    //if clearing the search field, reload binding of table
                    oBinding.filter(null);
                    return;
                  }

                  sPath = aColumns[0].getBindingContext("columns").getPath();
                  oObject = aColumns[0].getBindingContext("columns").getModel().getObject(sPath);

                  //get the column for which the search is triggered
                  sFilterPath = "tolower(" + oObject.template + ")";
                  sSearch = "tolower('" + sSearch + "')";
                  //prepare the filter
                  oFilter = new sap.ui.model.Filter({
                      path : sFilterPath,
                      operator : sOperator,
                      value1 : sSearch,
                      value2 : ""
                  });
                  //apply the filter to the binding rows of the table
                  oBinding.filter(oFilter);
                }
            })
          );

          return oToolbar;
        },
        //rewriting below standard function for Defect fix for CO-598
        //two if conditions added for integer type for value conversions
        _onCloseAndTakeOverValues : function() {
            var t = this;
            return function(e) {
                var f = function() {
                    var r;
                    //convert integer to string to avoid issues while setting integer value to tooltip of the token
                    if (t.getColumnType() === 3) {
                          for (var i in t._oSelectedItems.items) {
                                var o = t._oSelectedItems.items[i];
                                var sValue = o[t.getKey()].toString();
                                o[t.getKey()] = sValue;
                            }
                    }
                    var d = t._oSelectedItems.getSelectedItemsTokenArray(t.getKey(), t.getDescriptionKey(), t.getTokenDisplayBehaviour());
                  //convert string to integer for prior conversion
                    if (t.getColumnType() === 3) {
                          for (var i in t._oSelectedItems.items) {
                                var o = t._oSelectedItems.items[i];
                                var sValue = o[t.getKey()];
                                o[t.getKey()] = parseInt(sValue);
                            }
                    }
                    if (t._oSelectedRanges) {
                        var i = 0;
                        for (var g in t._oSelectedRanges) {
                            r = t._oSelectedRanges[g];
                            var s = r.tokenValue;
                            if (!s) {
                                s = t._getFormatedRangeTokenText(r.operation, r.value1, r.value2, r.exclude, r.keyField);
                            }
                            if (!r._oGrid || r._oGrid.select.getSelected()) {
                                d.push(new sap.m.Token({
                                    key: 'range_' + i,
                                    text: s,
                                    tooltip: s
                                }).data('range', {
                                    'exclude': r.exclude,
                                    'operation': r.operation,
                                    'keyField': r.keyField,
                                    'value1': r.value1,
                                    'value2': r.value2
                                }));
                                i++;
                            }
                        }
                    }
                    t.fireOk({
                        'tokens': d
                    });
                };
                t._validateRanges(f);
            };
        },

        renderer: {}
    });
});
