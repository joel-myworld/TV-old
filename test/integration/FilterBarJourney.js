sap.ui.define(['sap/ui/test/opaQunit'], function () {
  'use strict';
  QUnit.module('FilterBar Module');

  opaTest('Should find FilterBar', function (Given, When, Then) {
    // Arrangements
    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheFilterBar.iFoundFilterBar();
    // Assertions
    Then.onTheFilterBar.theFilterBarFound().and.iTeardownMyAppFrame();
  });

  opaTest('FilterBar should hide/show', function (Given, When, Then) {
    // Arrangements
    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheFilterBar.iFoundFilterBarHideButton();
    // Assertions
    Then.onTheFilterBar.theFilterBarHidden().and.iTeardownMyAppFrame();
  });
  
  opaTest('On click of Filters button in filter bar, should open filter options', function (Given, When, Then) {
    // Arrangements
    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheFilterBar.iClickFiltersButton();
    // Assertions
    Then.onTheFilterBar.theFiltersDialogOpens();
  });
  
  opaTest('To open value help dialog and select define conditions button should show Define Condition dialog', function (Given, When, Then) {
    //Arrangements
    //Actions
    When.onTheFilterBar.iSelectMultiInputFilterControl();
    //Assertions
    Then.onTheFilterBar.iShouldSeeSelectedValueHelpDialog();
  });
  
  opaTest('To check suggestion list is available for Include or exclude condition', function (Given, When, Then) {
    //Arrangements
    //Actions
    When.onTheFilterBar.iEnterIncludeData();
    //Assertions
    Then.onTheFilterBar.iShouldSeeSuggestionList();
  });
  
  opaTest('To define Include and exclude conditions in the define conditions dialog', function (Given, When, Then) {
    //Arrangements
    //Actions
    When.onTheFilterBar.iSetIncludeExcludeCondition();
    //Assertions
    Then.onTheFilterBar.iShouldSeeConditionsInFilterDialog().and.iTeardownMyAppFrame();
  });
  
  opaTest('Selecting a Field under Filters Dialog', function (Given, When, Then) {
		// Arrangements
	Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	//Actions
	When.onTheFilterBar.iClickFiltersButton();
	When.onTheFilterBar.iSelectMaterialField();
	// Assertions
	Then.onTheFilterBar.iShouldSeeMaterialFieldChecked();
  });
  
  opaTest('Closing the Select Filters Dialog', function (Given, When, Then) {
	// Arrangements
//    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	//Actions
//	When.onTheFilterBar.iClickFiltersButton();
	When.onTheFilterBar.iPressCancelOnFiltersDialog();
	// Assertions
	Then.onTheFilterBar.theFiltersDialogShouldBeClosed();
  });
  
  opaTest('Local busy indicator should be displayed while loading data in filter value help', function (Given, When, Then) {
	// Arrangements
//	Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	//Actions
	When.onTheFilterBar.iOpenValueHelp();
	// Assertions
	Then.onTheFilterBar.iSeeBusyIndicator();
  });  
});
