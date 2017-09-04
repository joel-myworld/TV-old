sap.ui.define([
		"sap/ui/table/Table"
	],
	/* global $ */
	function (Table) {
		"use strict";
		return Table.extend("com.siemens.tableViewer.control.CustomTable", {
			renderer: {},
			onAfterRendering: function () {
				if (Table.prototype.onAfterRendering) {
					Table.prototype.onAfterRendering.apply(this, arguments);
				}
				// Get Columns
				var aColumns = this.getColumns();
				// Get Visible Columns
				var aVisibleColumns = jQuery.grep(aColumns, function (oItem) {
					if (oItem.getProperty("visible")) {
						return oItem;
					}
				});
/*eslint-disable */
				for (var iColumn = 0; iColumn < aVisibleColumns.length; iColumn++) {
					var oColumn = aVisibleColumns[iColumn];
					// Get Column color property
					var sColumnColor = oColumn.getColoredStyleClass();
					//check if column exist in the DOM
					if (oColumn.getDomRef()) {
						var aRows = this.getRows();
						for (var iRow = 0; iRow < aRows.length; iRow++) {
							//Changes for cell color formatting starts
							//check if the cell formating for this column is enabled.
							if (oColumn.getIsCellFormat()) {
								//get all the cells and custom data aggregated in those cell to set the cell colors.
								var aCells = aRows[iRow].getCells();
								aCells.forEach(function (oCells) {
									var aData = oCells.getCustomData(),
										iStart, iLast, iParseStart, iParseLast, iParseValue, sValue = oCells.getText();
									for (var i = 0; i < aData.length; i++) {
										//only custom data that was added has to be checked
										if (typeof aData[i].getValue() === "string")  {
											//check for value with range
											if ((aData[i].getValue()).match(/([:*])/g) !== null) {

												iStart = (aData[i].getValue()).split(":")[0];
												iLast = (aData[i].getValue()).split(":")[1];

												//check if sValue is numeric or not
												//split if comma is part of the value for numbers and check if it is a number
												if (typeof sValue === "string") {
													if (!isNaN(Number(sValue.split(",").join("")))) {
														sValue = sValue.split(",").join("");
													}
												} else {
													sValue = sValue.toString();
													if (!isNaN(Number(sValue.split(",").join("")))) {
														sValue = sValue.split(",").join("");
													}
												}
												//check if the first range is integer, if yes then parseInt value
												if (Number(iStart) % 1 === 0) {
													iParseStart = parseInt(iStart, 10);
													iParseValue = parseInt(sValue, 10);
												} else {
													//check if the first range is float, if yes then parseFloat value
													if (Number(iStart) % 1 !== 0) {
														iParseStart = parseFloat(iStart);
														iParseValue = parseFloat(sValue);
													}
												}
												//check if the second range is integer, if yes then parseInt value
												if (Number(iLast) % 1 === 0) {
													iParseLast = parseInt(iLast, 10);
													iParseValue = parseInt(sValue, 10);
												} else {
													//check if the second range is float, if yes then parseFloat value
													if (Number(iLast) % 1 !== 0) {
														iParseLast = parseFloat(iLast);
														iParseValue = parseFloat(sValue);
													}
												}
												//set cell value color for integer or float values
												if (!isNaN(iParseStart && iParseLast)) {
													//check if iParseStart and iParseLast is greater or lesser
													if (iParseStart > iParseLast) {
														var iTemp = iParseStart;
														iParseStart = iParseLast;
														iParseLast = iTemp;
													}
													//check if the value is in the below range else set the background to none
													if (iParseValue >= iParseStart && iParseValue <= iParseLast) {
														jQuery("#" + oCells.getId()).parent().parent().css("background-color", aData[i].getKey());
														break;
													} else {
														jQuery("#" + oCells.getId()).parent().parent().css("background-color", "");
													}
												} else if (isNaN(parseInt(iStart, 10) && parseInt(iLast, 10))) {
												//set cell value color for string values
													if (sValue >= iStart && sValue <= iLast) {
														jQuery("#" + oCells.getId()).parent().parent().css("background-color", aData[i].getKey()); //green
														break;
													} else {
														jQuery("#" + oCells.getId()).parent().parent().css("background-color", "");
													}
												} else {
													$("#" + oCells.getId()).parent().parent().css("background-color", "");
													break;
												}

											} else {
												//for single value condition
												var iLast = aData[i].getValue(),
													iParseLast, iParseValue;

												if (!isNaN(Number(sValue.split(",").join("")))) {
													sValue = sValue.split(",").join("");
												}

												if (Number(iLast) % 1 === 0) {
													iParseLast = parseInt(iLast, 10);
													iParseValue = parseInt(sValue, 10);
												} else {
													if (Number(iLast) % 1 !== 0) {
														iParseLast = parseFloat(iLast);
														iParseValue = parseFloat(sValue);
													}
												}

												//set cell value color for integer or float values
												if (!isNaN(iParseLast)) {
													//for numeric
													if (iParseValue === iParseLast) {
														jQuery("#" + oCells.getId()).parent().parent().css("background-color", aData[i].getKey()); //red
														break;
													} else {
														jQuery("#" + oCells.getId()).parent().parent().css("background-color", ""); //none
													}
												}
												//set cell value color for string values
												if (isNaN(parseFloat(iLast))) {
													//for string
													if (sValue === iLast) {
														jQuery("#" + oCells.getId()).parent().parent().css("background-color", aData[i].getKey()); //red
														break;
													} else {
														jQuery("#" + oCells.getId()).parent().parent().css("background-color", ""); //none
													}
												}
											}
										}
									}
								});
							} else {
							//Changes for cell color formatting ends
								// Check if color property exist and column exist in the DOM
								if (sColumnColor && oColumn.getDomRef() && !(oColumn.getIsCellFormat())) {
									// Get row DOM
									var domRow = aRows[iRow].getDomRef();
									// Get row cells
									var aRowCells = jQuery(domRow).find("td");
									// Add color to table row cell
									jQuery(aRowCells[iColumn + 1]).css("background-color", sColumnColor);
								}
							}
						}
					}
				}
			}
		});
		/*eslint-enable */
	});