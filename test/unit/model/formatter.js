/*eslint-disable */
sap.ui.define([
	"com/siemens/tableViewer/model/formatter"
], function (formatter) {
	"use strict";

	module("Test for formatters");

	//Qunit test for numberUnit()

	function numberUnitValueTestCase(assert, sValue, fExpectedNumber) {
		// Act
		var fNumber = formatter.numberUnit(sValue);
		// Assert
		assert.strictEqual(fNumber, fExpectedNumber, "number unit test function success");
	}

	test("test for numberUnit - Should round down a 3 digit number", function (assert) {
		numberUnitValueTestCase.call(this, assert, "3.312", "3.31");
	});

	test("test for numberUnit - Should return ", function (assert) {
		numberUnitValueTestCase.call(this, assert, null, "");
	});

	//Qunit test for shareTileData()

	test("Test for setting the share tile title", function (assert) {
		var sTitle = "Shortcut to Table Viewer",
			oExpected = {
				title: sTitle
			};

		//Act
		var oTileData = formatter.shareTileData(sTitle);
		//Assert
		assert.strictEqual(oTileData.title, oExpected.title, "Share Tile title has been set");
	});

	//Qunit test for hideTableTab()
	test("Test for hideTableTab", function (assert) {
		var isTree = 0, isODataEnabled = 1;

		//Act
		var bVisible = formatter.hideTableTab(isTree, isODataEnabled);
		//Assert
		assert.strictEqual(bVisible, true, "hideTableTab should returns true");
	});

	test("Test for hideTableTab", function (assert) {
		var isTree = 1, isODataEnabled = 0;

		//Act
		var bVisible = formatter.hideTableTab(isTree, isODataEnabled);
		//Assert
		assert.strictEqual(bVisible, false, "hideTableTab should returns false");
	});

	//Qunit test for hideChartTab()
	test("Test for hideChartTab", function (assert) {
		var isTree = 0, isODataEnabled = 1, isChartHidden = 0;

		//Act
		var bVisible = formatter.hideChartTab(isTree, isODataEnabled, isChartHidden);
		//Assert
		assert.strictEqual(bVisible, true, "hideChartTab should return true");
	});

	test("Test for hideChartTab", function (assert) {
		var isTree = 1, isODataEnabled = 0, isChartHidden = 1;

		//Act
		var bVisible = formatter.hideChartTab(isTree, isODataEnabled);
		//Assert
		assert.strictEqual(bVisible, false, "hideChartTab should return false");
	});

	//Qunit test for hideTreeTab()
	test("Test for hideTreeTab", function (assert) {
		var isTree = 1, isODataEnabled = 0;

		//Act
		var bVisible = formatter.hideTreeTab(isTree, isODataEnabled);
		//Assert
		assert.strictEqual(bVisible, true, "hideTreeTab should returns true");
	});

	test("Test for hideChartTab", function (assert) {
		var isTree = 0, isODataEnabled = 1;

		//Act
		var bVisible = formatter.hideTreeTab(isTree, isODataEnabled);
		//Assert
		assert.strictEqual(bVisible, false, "hideTreeTab should returns false");
	});

	//Qunit test for formatOptions()

	test("Test for formatOptions with type Integer", function (assert) {
		var sType = "Integer",
			oFormatOptions = {
				groupingEnabled: true
			};

		//Act
		var oActual = formatter.formatOptions(sType);
		//Assert
		if (JSON.stringify(oActual) === JSON.stringify(oFormatOptions)) {
			assert.ok(true, "formatOptions for integer type is matching");
		}
	});

	test("Test for formatOptions with type Float", function (assert) {
		var sType = "Float",
			oFormatOptions = {
				groupingEnabled: true,
				minFractionDigits: 0,
				maxFractionDigits: 2
			};

		//Act
		var oActual = formatter.formatOptions(sType);
		//Assert
		if (JSON.stringify(oActual) === JSON.stringify(oFormatOptions)) {
			assert.ok(true, "formatOptions for float type is matching");
		}
	});

	test("Test for formatOptions with type DateTime", function (assert) {
		var sType = "DateTime",
			oFormatOptions = {
				pattern: "dd.MM.yyyy",
				source: {
					pattern: "yyyy-MM-ddTHH:mm:ss.fffZ"
				}
			};

		//Act
		var oActual = formatter.formatOptions(sType);
		//Assert
		if (JSON.stringify(oActual) === JSON.stringify(oFormatOptions)) {
			assert.ok(true, "formatOptions for DateTime type is matching");
		}
	});

	test("Test for formatOptions with type Date", function (assert) {
		var sType = "Date",
			oFormatOptions = {
				pattern: "dd.MM.yyyy",
				source: {
					pattern: "yyyyMMdd"
				}
			};

		//Act
		var oActual = formatter.formatOptions(sType);
		//Assert
		if (JSON.stringify(oActual) === JSON.stringify(oFormatOptions)) {
			assert.ok(true, "formatOptions for Date type is matching");
		}
	});

	test("Test for formatOptions with type MonthDate", function (assert) {
		var sType = "MonthDate",
			oFormatOptions = {
				pattern: "MM.yyyy",
				source: {
					pattern: "yyyyMM"
				}
			};

		//Act
		var oActual = formatter.formatOptions(sType);
		//Assert
		if (JSON.stringify(oActual) === JSON.stringify(oFormatOptions)) {
			assert.ok(true, "formatOptions for MonthDate type is matching");
		}
	});

	test("Test for formatOptions with type EdmDate", function (assert) {
		var sType = "EdmDate",
			oFormatOptions = {
				pattern: "dd.MM.yyyy",
				source: {}
			};

		//Act
		var oActual = formatter.formatOptions(sType);
		//Assert
		if (JSON.stringify(oActual) === JSON.stringify(oFormatOptions)) {
			assert.ok(true, "formatOptions for EdmDate type is matching");
		}
	});

	test("Test for formatOptions with type EdmShortDate", function (assert) {
		var sType = "EdmShortDate",
			oFormatOptions = {
				pattern: "MM.yyyy",
				source: {}
			};

		//Act
		var oActual = formatter.formatOptions(sType);
		//Assert
		if (JSON.stringify(oActual) === JSON.stringify(oFormatOptions)) {
			assert.ok(true, "formatOptions for EdmShortDate type is matching");
		}
	});

	test("Test for formatOptions with type EdmTime", function (assert) {
		var sType = "EdmTime",
			oFormatOptions = {
				pattern: "HH:mm",
				source: {}
			};

		//Act
		var oActual = formatter.formatOptions(sType);
		//Assert
		if (JSON.stringify(oActual) === JSON.stringify(oFormatOptions)) {
			assert.ok(true, "formatOptions for EdmTime type is matching");
		}
	});

	test("Test for formatOptions for default type", function (assert) {
		var sType = "",
			oFormatOptions;

		//Act
		var oActual = formatter.formatOptions(sType);
		//Assert
		if (oActual === oFormatOptions) {
			assert.ok(true, "formatOptions for default type is matching");
		}
	});

	//Qunit test for isDefaultMeasure()
	test("Test for isDefaultMeasure", function (assert) {
		var iValue = 1;

		//Act
		var isDefaultMeasure = formatter.isDefaultMeasure(iValue);
		//Assert
		assert.strictEqual(isDefaultMeasure, true, "isDefaultMeasure should return true");
	});

	//Qunit test for isDefaultDimension()
	test("Test for isDefaultDimension", function (assert) {
		var iValue = 2;

		//Act
		var isDefaultDimension = formatter.isDefaultDimension(iValue);
		//Assert
		assert.strictEqual(isDefaultDimension, true, "isDefaultDimension should return true");
	});

	//Qunit test for alignColumn()
	test("Test for alignColumn for left alignment", function (assert) {
		var isKFG = 2;

		//Act
		var sAlign = formatter.alignColumn(isKFG);
		//Assert
		assert.strictEqual(sAlign, "Left", "alignColumn should return Left alignment");
	});

	//Qunit test for alignColumn()
	test("Test for alignColumn for right alignment", function (assert) {
		var isKFG = 1;

		//Act
		var sAlign = formatter.alignColumn(isKFG);
		//Assert
		assert.strictEqual(sAlign, "Right", "alignColumn should return Right alignment");
	});

	//Qunit test for columnLabelDesign()
	test("Test for columnLabelDesign for Bold design", function (assert) {
		var isKFG = 1;

		//Act
		var sDesign = formatter.columnLabelDesign(isKFG);
		//Assert
		assert.strictEqual(sDesign, "Bold", "columnLabelDesign should return Bold design");
	});

	//Qunit test for columnLabelDesign()
	test("Test for columnLabelDesign for Standard design", function (assert) {
		var isKFG = 2;

		//Act
		var sDesign = formatter.columnLabelDesign(isKFG);
		//Assert
		assert.strictEqual(sDesign, "Standard", "columnLabelDesign should return Standard design");
	});

	//Qunit test for rowAlign()
	test("Test for rowAlign for right alignment", function (assert) {
		var isKFG = 1;

		//Act
		var sAlign = formatter.rowAlign(isKFG);
		//Assert
		assert.strictEqual(sAlign, "Right", "rowAlign should return right alignment");
	});

	//Qunit test for rowAlign()
	test("Test for rowAlign for left alignment", function (assert) {
		var isKFG = 2;

		//Act
		var sAlign = formatter.rowAlign(isKFG);
		//Assert
		assert.strictEqual(sAlign, "Left", "rowAlign should return left alignment");
	});

	//Qunit test for getDateTimeInstance()
	test("Test for getDateTimeInstance for date formating", function (assert) {
		var sPattern = "yyyyMMdd",
			oFormatOptions = {
				style: "medium",
				pattern: "yyyyMMdd",
				calendarType: "Gregorian"
			};

		//Act
		var oFormat = formatter.getDateTimeInstance(sPattern);

		//Assert
		if (JSON.stringify(oFormat.oFormatOptions) === JSON.stringify(oFormatOptions)) {
			assert.ok(true, "date format for yyyyMMdd pattern is matching");
		}
	});

	//Qunit test for getThreshold()
	test("Test for getThreshold function", function (assert) {
		//Arrange
		var iValue = 150;
		//Act
		var iThreshold = formatter.getThreshold(iValue);
		//Assert
		assert.strictEqual(iThreshold, iValue, "Threshold value is set");
	});

	//Qunit for hideVariant()
	test("Test for hideVariant", function (assert) {
		//Arrange
		var iValue = 0, bVariant;
		//Act
		bVariant = formatter.hideVariant(iValue);
		//Assert
		assert.strictEqual(bVariant, true, "hideVariant returned true");
	});

	//Qunit for setVariantGlobal()
	test("Test for setVariantGlobal", function (assert) {
		//Arrange
		var iValue = 1, bVariant;
		//Act
		bVariant = formatter.setVariantGlobal(iValue);
		//Assert
		assert.strictEqual(bVariant, true, "setVariantGlobal returned true");
	});
});
