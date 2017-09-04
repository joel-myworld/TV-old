sap.ui.define([
    "sap/ui/core/HorizontalAlign",
    "sap/m/LabelDesign",
    "sap/ui/core/TextAlign",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/format/NumberFormat",
    "sap/ui/model/type/Integer",
    "sap/ui/model/type/Float",
    "sap/ui/model/type/Date",
    "sap/ui/model/odata/type/DateTime",
    "sap/ui/model/odata/type/Time"
], function(HorizontalAlign, LabelDesign, TextAlign, DateFormat, NumberFormat, IntegerType, FloatType, DateType, DateTimeType, TimeType) {
    "use strict";

    return {

        /**
         * Rounds the number unit value to 2 digits
         * @public
         * @param {string} sValue the number string to be rounded
         * @returns {string} sValue with 2 digits rounded
         */
        numberUnit: function(sValue) {
            if (!sValue) {
                return "";
            }
            return parseFloat(sValue).toFixed(2);
        },

        /**
         * Returns a configuration object for the {@link sap.ushell.ui.footerbar.AddBookMarkButton} "appData" property
         * @public
         * @param {string} sTitle the title for the "save as tile" dialog
         * @returns {object} the configuration object
         */
        shareTileData: function(sTitle) {
            return {
                title: sTitle
            };
        },

        hideTableTab: function(isTree, isODataEnabled, isMixed) {
            if (isODataEnabled === 1 && isTree === 0 && isMixed === 0) {
                return true;
            }

            return false;
        },

        hideChartTab: function(isTree, isODataEnabled, isChartHidden, isMixed) {
            if (isODataEnabled === 1 && isTree === 0 && isMixed === 0) {
                return isChartHidden === 0;
            }
            return false;
        },

        hideTreeTab: function(isTree, isODataEnabled, isMixed) {
            if (isODataEnabled === 0 && isTree === 1 && isMixed === 0) {
                return true;
            }
            return false;
        },
        
        hideMixTab: function (isTree, isODataEnabled, isMixed) {
            if (isODataEnabled === 1 && isTree === 0 && isMixed === 1) {
                return true;
            }

            return false;       	
        },

        alignColumn: function(isKFG) {
            return isKFG && isKFG === 1 ? HorizontalAlign.Right : HorizontalAlign.Left;
        },

        columnLabelDesign: function(isKFG) {
            return isKFG && isKFG === 1 ? LabelDesign.Bold : LabelDesign.Standard;
        },

        rowAlign: function(isKFG) {
            return isKFG && isKFG === 1 ? TextAlign.Right : TextAlign.Left;
        },

        formatOptions: function(sType) {
            var oFormatOptions;

            switch (sType) {
                case "Integer":
                    oFormatOptions = {
                        groupingEnabled: true
                    };
                    break;
                case "Float":
                    oFormatOptions = {
                        groupingEnabled: true,
                        minFractionDigits: 0,
                        maxFractionDigits: 2
                    };
                    break;
                case "DateTime":
                    oFormatOptions = {
                        pattern: "dd.MM.yyyy",
                        source: {
                            pattern: "yyyy-MM-ddTHH:mm:ss.fffZ"
                        }
                    };
                    break;
                case "Date":
                    oFormatOptions = {
                        pattern: "dd.MM.yyyy",
                        source: {
                            pattern: "yyyyMMdd"
                        }
                    };
                    break;
                case "MonthDate":
                    oFormatOptions = {
                        pattern: "MM.yyyy",
                        source: {
                            pattern: "yyyyMM"
                        }
                    };
                    break;
                case "EdmDate":
                    oFormatOptions = {
                        pattern: "dd.MM.yyyy",
                        source: {}
                    };
                    break;
                case "EdmShortDate":
                    oFormatOptions = {
                        pattern: "MM.yyyy",
                        source: {}
                    };
                    break;
                case "EdmTime":
                    oFormatOptions = {
                        pattern: "HH:mm:ss",
                        source: {}
                    };
                    break;
                case "Chart":
                    oFormatOptions = {
                        style: "short",
                        maxFractionDigits: 1
                    };
                    break;
                default:
                    break;
            }

            return oFormatOptions;
        },

        getDataTypeInstance: function(sColumnType) {
            var oType;

            switch (sColumnType) {
                case 3:
                    // Integer type
                    oType = new IntegerType(this.formatOptions("Integer"));
                    break;
                case 7:
                    // Float type
                    oType = new FloatType(this.formatOptions("Float"));
                    break;
                case 14:
                    // Date Time Offset format
                    oType = new DateType(this.formatOptions("DateTime"));
                    break;
                case 15:
                    // Date object as string yyyyMMdd
                    oType = new DateType(this.formatOptions("Date"));
                    break;
                case 17:
                    // Date object as string yyyyMM
                    oType = new DateType(this.formatOptions("MonthDate"));
                    break;
                case 20:
                    // Edm.DateTime format
                    oType = new DateTimeType(this.formatOptions("EdmDate"));
                    break;
                case 21:
                    // Edm.DateTime short date format
                    oType = new DateTimeType(this.formatOptions("EdmShortDate"));
                    break;
                case 22:
                    // Edm.Time
                    oType = new TimeType(this.formatOptions("EdmTime"));
                    break;
                default:
                    break;
            }

            return oType;
        },

        getDateTimeInstance: function(sPattern) {
            return DateFormat.getDateTimeInstance({
                pattern: sPattern
            });
        },

        getDateTimeInstanceBasedOnColumnType: function(iColumnType) {
            var oInstance;

            switch (iColumnType) {
                case 20:
                    oInstance = this.getDateTimeInstance("dd.MM.yyyy");
                    break;
                case 21:
                    oInstance = this.getDateTimeInstance("MM.yyyy");
                    break;
                default:
                    oInstance = this.getDateTimeInstance("dd.MM.yyyy");
                    break;
            }

            return oInstance;
        },

        getFloatInstance: function(sType) {
            return NumberFormat.getFloatInstance(this.formatOptions(sType));
        },

        formatDataBasedOnColumnType: function(iColumnType, sValue) {
            var sResult,
                oInstance;

            switch (iColumnType) {
                case 20:
                    oInstance = this.getDateTimeInstance("dd.MM.yyyy");
                    sResult = oInstance.format(new Date(sValue));
                    break;
                case 21:
                    oInstance = this.getDateTimeInstance("MM.yyyy");
                    sResult = oInstance.format(new Date(sValue));
                    break;
                default:
                    sResult = sValue;
                    break;
            }

            return sResult;
        },
        
        /**
		 * Method to format the labels on the range slider to the shortest form with units
		 * @param {Number} iNum - Label passed to be formatted
		 * @returns {Number} iFormattedNo - Formatted number with units
		 * @public
		 */
		formatRangeSliderLabel : function (iNum) {
		    var bIsNegative = false, iFormattedNo;
		    if (iNum < 0) {
		    	bIsNegative = true;
		    }
		    iNum = Math.abs(iNum)
		    if (iNum >= 1000000000) {
		    	iFormattedNo = (iNum / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
		    } else if (iNum >= 1000000) {
		    	iFormattedNo =  (iNum / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
		    } else  if (iNum >= 1000) {
		    	iFormattedNo =  (iNum / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
		    } else {
		    	iFormattedNo = iNum;
		    }
		    if(bIsNegative) { iFormattedNo = '-' + iFormattedNo }
		    return iFormattedNo;
		},

        isDefaultMeasure: function(oValue) {
            return oValue === 1;
        },

        isDefaultDimension: function(oValue) {
            return oValue === 2;
        },

        getThreshold: function(oValue) {
            return oValue ? oValue : 100;
        },

        hideVariant: function(oValue) {
            return oValue === 0;
        },

        setVariantGlobal: function(oValue) {
            return oValue === 1;
        },

        setTrueIfValueEqOne: function(iValue) {
            return iValue === 1;
        },

		isTableInteractive : function(iValue) {
			return iValue === 1 ? "Interactive" : "Fixed";
		}
    };
});
