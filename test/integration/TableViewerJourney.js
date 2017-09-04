sap.ui.define(['sap/ui/test/opaQunit'], function () {
  'use strict';
  QUnit.module('Test Module');
  
  opaTest('Should find a Button with an id', function (Given, When, Then) {
    // Arrangements
    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheTableViewerPage.iFoundButton();
    // Assertions
    Then.onTheTableViewerPage.iShouldSeeResult().and.iTeardownMyAppFrame();
  });
  
  opaTest('Table should be filled with data', function (Given, When, Then) {
    // Arrangements
    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheTableViewerPage.iWaitUntilTheTableIsLoaded();
    // Assertions
    Then.onTheTableViewerPage.iDataLengthMoreThenOne();
  });
  
  opaTest('Table title should display all items', function (Given, When, Then) {
    // Arrangements
    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheTableViewerPage.iWaitUntilTheTableIsLoaded();
    // Assertions
    Then.onTheTableViewerPage.theTitleShouldDisplayTheTotalAmountOfItems().and.iTeardownMyAppFrame();
  });
 
  opaTest('Test Export to Excel', function (Given, When, Then) {
        // Arrangements
    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
        //Actions
    When.onTheTableViewerPage.iSetValueForCalmonth();
    When.onTheTableViewerPage.iClickExportToExcel();
        // Assertions
    Then.onTheTableViewerPage.thenExportToExcel().and.iTeardownMyAppFrame();
  });
  
  opaTest('Test Report to report', function (Given, When, Then) {
	  // Arrangements
	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	  //Actions
	    When.onTheTableViewerPage.iWaitUntilTheTableIsLoaded();
	  // Assertions
	    Then.onTheTableViewerPage.iClickShowDetailsButton().and.iTeardownMyAppFrame();
	});
  
  opaTest('Should open cell color configuration dialog', function (Given, When, Then) {
	  // Arrangements
	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	  //Actions
	    When.onTheTableViewerPage.iClickCellColoringButton();
	  // Assertions
	    Then.onTheTableViewerPage.thenCellColoringDialogOpens();
	});
  
  opaTest('Test min and max range values on slider', function (Given, When, Then) {
	  // Arrangements
//	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	  //Actions
	    When.onTheTableViewerPage.iSetValuesRange();
	  // Assertions
	    Then.onTheTableViewerPage.iSeeSliderEndValuesChange();
	});
  
  opaTest('Test change in input Value1 and Value2 on movement of slider', function (Given, When, Then) {
	  // Arrangements
//	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	  //Actions
	    When.onTheTableViewerPage.iMoveSlider();
	  // Assertions
	    Then.onTheTableViewerPage.iSeeChangeInInputValues();
	});
  
  opaTest('Test dropdown fields based on the available condition range in slider', function (Given, When, Then) {
	  // Arrangements
//	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	  //Actions
	    When.onTheTableViewerPage.iMoveSlider1();
	  // Assertions
	    Then.onTheTableViewerPage.iSeeDropdownFields();
	});
  
  opaTest('Test set default red color for first dropdown', function (Given, When, Then) {
	  // Arrangements
//	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	  //Actions
	    When.onTheTableViewerPage.iSetDefaultColorForDropDown();
	  // Assertions
	    Then.onTheTableViewerPage.iSeeDefaultColorForDropDown();
	});
  
  opaTest('Test color for each range of values in table', function (Given, When, Then) {
	  // Arrangements
//	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	  //Actions
	    When.onTheTableViewerPage.iClickOnOKButton();
	    When.onTheTableViewerPage.iWaitUntilTheTableIsLoaded();  
	  // Assertions
	    Then.onTheTableViewerPage.iCheckColorForTableValues();
	});
  

//  opaTest('Test Define sorting for columns', function (Given, When, Then) {
//	    // Arrangements
//	Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
//	    //Actions
//	When.onTheTableViewerPage.iClickDefineSorting();
//	    // Assertions
//	Then.onTheTableViewerPage.thenISortTheColumns().and.iTeardownMyAppFrame();
//  });
  
  opaTest('Clicking on chart tab, it should change to active tab', function (Given, When, Then) {
    // Arrangements
//    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    // Actions
    When.onTheTableViewerPage.iClickOnTab();
    // Assertions
    Then.onTheTableViewerPage.iTabBecomesActive('siemens.ui.chart', 'Chart');
  });
  
  opaTest('Test Pop up on "Change Chart Type" button click', function (Given, When, Then) {
    //Arrangements
    //Given.iStartMyApp();
    //Actions
    When.onTheTableViewerPage.iClickChartTypeButton();
    //Assertions
    Then.onTheTableViewerPage.thePopUpOpens();
  });
  
  opaTest('Test Bar chart on opening of pop up', function (Given, When, Then) {
    //Arrangements
    //Given.iStartMyApp();
    //Actions
    When.onTheTableViewerPage.iClickChartTypeButton();
    //Assertions
    Then.onTheTableViewerPage.iSetBarChart();
  });
  
  opaTest('Test Line chart on opening of pop up', function (Given, When, Then) {
    //Arrangements
    //Given.iStartMyApp();
    //Actions
    When.onTheTableViewerPage.iClickChartTypeButton();
    //Assertions
    Then.onTheTableViewerPage.iSetLineChart();
  });
  
  opaTest('Test Pie chart on opening of pop up', function (Given, When, Then) {
	 //Arrangements
	 //Given.iStartMyApp();
	 //Actions
	 When.onTheTableViewerPage.iClickChartTypeButton();
	 //Assertions
	 Then.onTheTableViewerPage.iSetPieChart();
  });
  
  opaTest('Test Radar chart on opening of pop up', function (Given, When, Then) {
	  //Arrangements
	  //Given.iStartMyApp();
	  //Actions
	  When.onTheTableViewerPage.iClickChartTypeButton();
	  //Assertions
	  Then.onTheTableViewerPage.iSetRadarChart();
  });
  
  opaTest('Test default dimension and measure', function (Given, When, Then) {
    //Arrangements
    //Given.iStartMyApp();
    //Actions
    When.onTheTableViewerPage.iOpenFilterByDialog();
    //Assertions
    Then.onTheTableViewerPage.iSeeDefaultDimensionMeasure();
  });  
});
