"use strict";

var siteUtils = require("../site-utils"),
    logger = require("../logger")();

function EbaySite(uri) {

    this._reg = /(http)[s]*(\:\/\/www.ebay.[\w]+)\/(.)*/;
    this._arrayNames = [];
    this._arrayPrices = [];
    this._lowest = null;
    this._uri = uri;

    // error check to make sure this is a valid uri for Ebay
    if (!this._uri.match(this._reg)) {
        throw new Error("uri not recognized please use one of these formats : http://www.ebay.fr/XXXXXX");
    }

    this.getURIForPageData = function () {
        return this._uri;
    };

    this.isJSON = function () {
        return false;
    };

    this.findPriceOnPage = function ($) {

        var self = this;

        var results = $('#mainContent > .rsw .lvresult');
        var lowestPrice;

        logger.log('found ' + results.length + ' results on the page');

        results.each(function (i) {
            var result = $(this);
            // remove useless tags
            result.find('.newly').remove();
            // get title
            var name = result.find('.lvtitle a').text().trim();
            name = siteUtils.cleanString(name);
            self._arrayNames.push(name);
            // get price
            var price = result.find('.lvprice .bold').text().trim().split(' ')[0];
            price = parseFloat(price.trim().replace(',', '.'));
            self._arrayPrices.push(price);
            // compare to other prices
            if(!lowestPrice | price < lowestPrice){
                self._lowest = i;
                lowestPrice = price;
            }
        });

        var price = this._arrayPrices[this._lowest];

        if (!price) {
            logger.error("price was not found on Ebay page, uri: " + this._uri);
            return -1;
        }

        logger.log("price: " + price);

        return price;
    };

    this.findCategoryOnPage = function ($) {
        var category;
        category = siteUtils.categories.VIDEO_GAMES;
        logger.log("category: " + category);
        return category;
    };

    this.findNameOnPage = function ($, category) {

        var name = this._arrayNames[this._lowest];

        if (!name || name.length < 1) {
            logger.error("name not found on Ebay page, uri: " + this._uri);
            return null;
        }

        logger.log("name: " + name);

        return name;
    };
}

EbaySite.isSite = function (uri) {
    if (uri.indexOf("www.ebay.fr") > -1) {
        return true;
    } else {
        return false;
    }
};

module.exports = EbaySite;
