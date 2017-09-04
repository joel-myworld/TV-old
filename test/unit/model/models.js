/*eslint-disable */
sap.ui.define([
	"com/siemens/tableViewer/model/models",
	"sap/m/MessageBox",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function (models, MessageBox) {
	"use strict";

	module("createDeviceModel", {
		teardown: function () {
			this.oDeviceModel.destroy();
		}
	});

	function isPhoneTest(assert, bIsPhone) {
		// Arrange
		this.stub(sap.ui.Device, "system", {
			phone: bIsPhone
		});

		this.oDeviceModel = models.createDeviceModel();
		// Assert
		assert.strictEqual(this.oDeviceModel.getData().system.phone, bIsPhone, "IsPhone property test is success");
	}

	test("test to initialize a device model for desktop", function (assert) {
		isPhoneTest.call(this, assert, false);
	});

	test("test to initialize a device model for phone", function (assert) {
		isPhoneTest.call(this, assert, true);
	});

	function isTouchTest(assert, bIsTouch) {
		// Arrange
		this.stub(sap.ui.Device, "support", {
			touch: bIsTouch
		});

		this.oDeviceModel = models.createDeviceModel();

		// Assert
		assert.strictEqual(this.oDeviceModel.getData().support.touch, bIsTouch, "IsTouch property test is success");
	}

	test("test to initialize a device model for non touch devices", function (assert) {
		isTouchTest.call(this, assert, false);
	});

	test("test to initialize a device model for touch devices", function (assert) {
		isTouchTest.call(this, assert, true);
	});

	test("test for the binding mode of the device model to be one way", function (assert) {

		// System under test
		this.oDeviceModel = models.createDeviceModel();

		// Assert
		assert.strictEqual(this.oDeviceModel.getDefaultBindingMode(), "OneWay", "Binding mode test is success");
	});

	module("module to execute _createODataModel");

	test("test to execute to _createODataModel", function (assert) {
		//Arrange
		var sUrl = "/siemens/COMMON_DEV/xs/services/tableViewerOData/srv1.xsodata",
			oMetadata = {
				"sap-documentation": "heading",
				"sap-language": "en-GB"
			},
			oConfig = {
				metadataUrlParams: oMetadata
			},
			oDataModel;

		//Act
		oDataModel = models._createODataModel(sUrl, oConfig);
		//Assert
		if (oDataModel && oDataModel !== "null" && oDataModel !== "undefined") {
			assert.ok(true, "oDataModel is returned successfully");
		} else {
			assert.ok(false, "oDataModel is not returned");
		}

	});

	module("createODataModel", {
		setup: function () {
			this.oODataModel = {};
			this.oDataModelStub = sinon.stub(models, "_createODataModel").returns(this.oODataModel);
		},
		teardown: function () {
			this.oDataModelStub.restore();
		}
	});

	test("Should create an ODataModel when only a url is provided", function (assert) {
		// Arrange
		var sUrl = "/siemens/COMMON_DEV/xs/services/tableViewerOData/srv1.xsodata",
			oResult;

		// Act
		oResult = models.createODataModel({
			url: sUrl
		});

		// Assert
		assert.strictEqual(oResult, this.oODataModel, "Did return the created instance");
		sinon.assert.calledWith(this.oDataModelStub, sUrl, sinon.match({}));
	});

	test("Should create an ODataModel when only a url is provided", function (assert) {
		// Arrange
		var sUrl = "/siemens/COMMON_DEV/xs/services/tableViewerOData/srv1.xsodata",
			oResult;

		// Act
		oResult = models.createODataModel({
			url: sUrl
		});

		// Assert
		assert.strictEqual(oResult, this.oODataModel, "Did return the created instance");
		sinon.assert.calledWith(this.oDataModelStub, sUrl, sinon.match({}));
	});

	test("Should add url parameters that are present in the url", function (assert) {
		// Arrange
		var sUrl = "/siemens/COMMON_DEV/xs/services/tableViewerOData/srv1.xsodata",
			sSapServerParameter = "sap-server",
			sNonExistingValue = "nonExistingValue",
			oExpectedConfig = {
				metadataUrlParams: {
					"sap-server": "someServer"
				}
			},
			getUrlParameterStub = this.stub(),
			sServerValue = oExpectedConfig.metadataUrlParams[sSapServerParameter];

		getUrlParameterStub.withArgs(sSapServerParameter)
			.returns(sServerValue);
		getUrlParameterStub.withArgs(sNonExistingValue)
			.returns(null);

		this.stub(jQuery.sap, "getUriParameters").returns({
			get: getUrlParameterStub
		});

		// Act
		models.createODataModel({
			url: sUrl,
			urlParametersForEveryRequest: [
				"sap-server",
				"nonExistingValue"
			]
		});

		// Assert
		sinon.assert.calledWith(this.oDataModelStub, sUrl + "?" + sSapServerParameter + "=" + sServerValue, sinon.match(oExpectedConfig));
	});

	test("Should overwrite existing values when in the url", function (assert) {
		// Arrange
		var sUrl = "/siemens/COMMON_DEV/xs/services/tableViewerOData/srv1.xsodata",
			sSapServerParameter = "sap-server",
			oExpectedConfig = {
				metadataUrlParams: {
					"sap-server": "someServer",
					"static": "value"
				}
			},
			sServerValue = oExpectedConfig.metadataUrlParams[sSapServerParameter],
			getUrlParameterStub = this.stub();

		getUrlParameterStub.withArgs(sSapServerParameter)
			.returns(sServerValue);

		this.stub(jQuery.sap, "getUriParameters").returns({
			get: getUrlParameterStub
		});

		// Act
		models.createODataModel({
			url: sUrl,
			urlParametersForEveryRequest: [
				"sap-server"
			],
			config: {
				metadataUrlParams: {
					"sap-server": "anotherServer",
					"static": "value"
				}
			}
		});

		// Assert
		sinon.assert.calledWith(this.oDataModelStub, sUrl + "?" + sSapServerParameter + "=" + sServerValue, sinon.match(oExpectedConfig));
	});

	test("Should add sap-language if a user is logged in the shell", function (assert) {
		// Arrange
		var sUrl = "/siemens/COMMON_DEV/xs/services/tableViewerOData/srv1.xsodata",
			oExpectedConfig = {
				metadataUrlParams: {
					"sap-language": "us"
				}
			},
			getUrlParameterSpy = this.spy();

		sap.ushell = {
			Container: {
				getUser: this.stub().returns({
					getLanguage: this.stub().returns(oExpectedConfig.metadataUrlParams["sap-language"])
				})
			}
		};

		this.stub(jQuery.sap, "getUriParameters").returns({
			get: getUrlParameterSpy
		});

		// Act
		models.createODataModel({
			url: sUrl,
			urlParametersForEveryRequest: [
				"sap-language"
			]
		});

		// Assert
		sinon.assert.calledWith(this.oDataModelStub, sUrl, sinon.match(oExpectedConfig));
		assert.strictEqual(getUrlParameterSpy.callCount, 0, "Did not check the url");
		//wrap up the ushell to avoid issues for other test cases where it is used
		delete sap.ushell;
	});

	QUnit.test("Should log an error if no url is provided", function (assert) {
		// Arrange
		var 
			oOptions = {
				config: {
					metadataUrlParams: {
						"sap-server": "server",
						"static": "value"
					}
				}
			},
			oModel = {};

		// Act
		oModel = models.createODataModel(oOptions);

		// Assert
		if (oModel === null) {
			ok(true, "Error logged successfully");
		}
		//sinon.assert.calledWith(oModel, sinon.match.string, "oil/ups/fc/manageproject.model.models.createODataModel");
	});

	module("Module to test models", {
		setup: function () {
		},
		teardown: function () {
		}
	});

	test("To check if share in Jam is active or not and should return a model", function (assert) {
		//Arrange
		sap.ushell = {
			Container: {
				getUser: this.stub().returns({
					isJamActive: this.stub().returns(true)
				})
			}
		};
		var oModel = {};
		//Act
		oModel = models.createFLPModel();

		//Assert
		if (oModel && oModel !== null && oModel !== undefined) {
			assert.ok(true, "Returned a model for Jam and share in Jam is " + oModel.getData().isShareInJamActive);
		} else {
			assert.ok(false, "Didnt Returned a model for Jam");
		}

		delete sap.ushell;
	});

	test("Test to check if Resource model is returned from createResourceModel", function (assert) {
		//Arrange
		var oResourceModel = {
			"bundleName": "com.siemens.tableViewer.i18n.i18n"
		}, oModel;
		//Act
		oModel = models.createResourceModel("com.siemens.tableViewer.i18n.i18n");
		//Assert
		if (oModel && oModel !== null && oModel !== undefined) {
			assert.ok(true, "Resource model is returned");
		} else {
			assert.ok(false, "Resource model is not returned");
		}
	});

	test("Test to check if JSON model is returned from createChartButtonsModel", function (assert) {
		//Arrange
		var oResourceModel = {
			getText: function (sKey) {
				if (sKey === "chart.barChartText") {
					return "Bar Chart";
				} else if (sKey === "chart.lineChartText") {
					return "Line Chart";
				} else if (sKey === "chart.bubbleChartText") {
					return "Bubble Chart";
				}
			}
		}, oModel;
		//Act
		oModel = models.createChartButtonsModel(oResourceModel);
		//Assert
		if (oModel && oModel !== null && oModel !== undefined) {
			assert.ok(true, "Returned the JSON Model with Buttons for bar, line and bubble");
		} else {
			assert.ok(false, "failed to return the JSON Model with Buttons");
		}
	});

	test("Test to check if chart dimensions and measures are stored", function (assert) {
		//Arrange
		var oConfigModel = {
				getProperty: function (sPath) {
					return [{
						"__metadata": {
							"id": "/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='CALMONTH')",
							"type": "siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType",
							"uri": "/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='CALMONTH')"
						},
						"CTRLID": "CTRL1",
						"COLUMN": "CALMONTH",
						"LABEL": "Calmonth",
						"DESCRIPTION": "Description",
						"IS_KFG": 1,
						"FILTERTYPE": "",
						"STDRD": 0,
						"SORTORDER": 10,
						"FILTER": 1,
						"CTYPE": 11,
						"CWIDTH": "107px",
						"COLOR_CODE": "#0048ab"
					},
						{
							"__metadata": {
								"id": "/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='TESTL')",
								"type": "siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType",
								"uri": "/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='TESTL')"
							},
							"CTRLID": "CTRL1",
							"COLUMN": "TESTL",
							"LABEL": "Material",
							"DESCRIPTION": "Description",
							"IS_KFG": 0,
							"FILTERTYPE": "",
							"STDRD": 0,
							"SORTORDER": 20,
							"FILTER": 1,
							"CTYPE": 11,
							"CWIDTH": "107px"
						}, {
							"__metadata": {
								"id": "/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='LOCAT_CAL')",
								"type": "siemens.COMMON_DEV.xs.services.tableViewerOData.main.ColumnType",
								"uri": "/siemens/COMMON_DEV/xs/services/tableViewerOData/main.xsodata/Column(CTRLID='CTRL1',COLUMN='LOCAT_CAL')"
							},
							"CTRLID": "CTRL1",
							"COLUMN": "LOCAT_CAL",
							"LABEL": "Location",
							"DESCRIPTION": "Description",
							"IS_KFG": 0,
							"FILTERTYPE": "",
							"STDRD": 1,
							"SORTORDER": 30,
							"FILTER": 1,
							"CTYPE": 11,
							"CWIDTH": "107px"
						}];
				}
			}, sPath = "/ServiceColumns/results",
			oMeasureDimension = {dimensions: [], measures: []},
			oExpected = {
				dimensions: [{"LABEL": "Material", "COLUMN": "TESTL", "SELECTED": false, "CTYPE": 11},
					{"LABEL": "Location", "COLUMN": "LOCAT_CAL", "SELECTED": false, "CTYPE": 11}],
				measures: [{"LABEL": "Calmonth", "COLUMN": "CALMONTH", "SELECTED": true, "CTYPE": 11}]
			};
		//Act
		oMeasureDimension = models.createDimensionMeasures(oConfigModel, sPath);
		//Assert
		assert.strictEqual(JSON.stringify(oMeasureDimension.dimensions), JSON.stringify(oExpected.dimensions), "chart dimensions are stored successfully");
		assert.strictEqual(JSON.stringify(oMeasureDimension.measures), JSON.stringify(oExpected.measures), "chart measures are stored successfully");
	});

	test("To execute requestData to read backend for creating chart model", function (assert) {
		//Arrange
		var oModel = {},
			sEntitySet = "/FreeDateCrossPlant",
			sSelect = "Test,Test",
			bOrder = true,
			aFilters = [{"aFilters": [1, 2]}];
		oModel.read = sinon.stub();
		//Act
		models.requestData(oModel, sEntitySet, sSelect, function (oData, response) {
		}, function (oError) {
		}, bOrder, aFilters);
		//Assert
		ok(true, "requestChartData executed successfully to create chart model");
	});


	test("Test to create configuration model", function (assert) {
		//Arrange
		var sUrl = "",
			//var sUrl = "/siemens/COMMON_DEV/xs/services/tableViewerOData/srv1.xsodata",
			sCalcId = "CTRL1", oConfigModel;
		//Act
		oConfigModel = models.createConfigurationModel(sUrl, sCalcId);
		//Assert
		if (oConfigModel && oConfigModel !== null && oConfigModel !== undefined) {
			assert.ok(true, "Configuration model has been created");
		} else {
			assert.ok(false, "Configuration model has not been created");
		}

	});

	test("Test to createVariantManagerModel", function (assert) {
		//Arrange
		var oVariantModel = {};
		//Act
		oVariantModel = models.createVariantManagerModel();
		//Assert
		if (oVariantModel && oVariantModel !== null && oVariantModel !== undefined) {
			assert.ok(true, "Variant model has been created");
		} else {
			assert.ok(false, "Variant model has not been created");
		}
	});
});
