"use strict";

var siteUtils = require("../site-utils"),
    logger = require("../logger")();

logger = console;

function EbaySite(uri) {

    this._reg = /(http)[s]*(\:\/\/www.ebay.[\w]+)\/(.)*/;
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

        var results = $('#mainContent > .rsw .lvresult');
        var arrayNames = [];
        var arrayPrices = [];
        console.log(results.length);
        results.each(function (i) {
            var result = $(this);
            console.log(i);
            // remove useless tags
            result.find('.newly').remove();
            // get title
            var name = result.find('.lvtitle a').text().trim();
            arrayNames.push(name);
            console.log(' => ' + name);
            // get price
            var price = result.find('.lvprice .bold')[0].childNodes[0].textContent;
            var shipping = result.find('.lvshipping .fee').text().trim().split(' ')[0].replace('+', '');


            console.log(' => ' + price);
            console.log(' => ' + shipping);
        });

        return 42;

        if (!price) {
            logger.error("price was not found on Ebay page, uri: " + this._uri);
            return -1;
        }

        // get the number value (remove euro sign)
        price = parseFloat(price.trim().replace(',', '.'));
        shipping = parseFloat(shipping.replace(',', '.'));

        if (!isNaN(shipping)) {
            price += shipping;
        }

        logger.log("price: " + price);

        return price.toFixed(2);
    };

    this.findCategoryOnPage = function ($) {
        var category;
        category = siteUtils.categories.VIDEO_GAMES;
        logger.log("category: " + category);
        return category;
    };

    this.findNameOnPage = function ($, category) {

        // Get name from the url is safer and does not contain too long titles or accents
        var name = '';
        if (this._originalUri.match(this._inputReg)) {
            name = this._originalUri.match(this._inputReg)[4].replace(/\-/g, ' ');
        }

        // remove first slash if any
        if (name.substr(0, 1) === '/') {
            name = name.substr(1);
        }
        // remove last slash if any
        if (name.substr(-1) === '/') {
            name = name.substr(0, name.length - 1);
        }

        if (!name || name.length < 1) {
            logger.error("name not found on Ebay page, uri: " + this._uri);
            return null;
        }

        // uppercase first letter
        name = name.charAt(0).toUpperCase() + name.slice(1);

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
