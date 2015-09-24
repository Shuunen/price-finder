"use strict";

var async = require("async"),
    request = require("request"),
    cheerio = require("cheerio"),
    extend = require("xtend"),
    siteManager = require("./site-manager"),
    logger = require("./logger")();

function PriceFinder(options) {
    var defaultOptions;

    logger.log("initializing PriceFinder");

    logger.log("user supplied options: " + JSON.stringify(options));

    defaultOptions = {
        headers: {
            "User-Agent": "Mozilla/5.0"
        },
        retryStatusCodes: [503],
        retrySleepTime: 1000
    };

    // merge options, taking the user supplied if duplicates exist
    this._config = extend(defaultOptions, options);

    logger.log("merged config: " + JSON.stringify(this._config));

    /**
     * Scrapes a website specified by the uri and finds the item price.
     *
     * @param  {String}   uri      The uri of the website to scan
     * @param  {Function} callback Callback called when complete, with first argument
     *                             a possible error object, and second argument the
     *                             item price (a Number).
     */
    this.findItemPrice = function(uri, callback) {
        var site;

        logger.log("findItemPrice with uri: " + uri);

        try {
            site = siteManager.loadSite(uri, this._config);
        } catch (error) {
            logger.error("error loading site: " + error);
            if (error.message) {
                callback(error.message);
            } else {
                callback(error);
            }
            return;
        }

        logger.log("scraping the page...");

        // page scrape the site to load the page data
        pageScrape(site, function(err, pageData) {
            var price;

            if (err) {
                logger.error("error retrieving pageData: " + err);
                callback(err);
                return;
            }

            logger.log("pageData found, loading price from site...");

            // find the price on the website
            price = site.findPriceOnPage(pageData);

            // error check
            if (price === -1) {
                logger.error("unable to find price");
                callback("unable to find price for uri: " + uri);
                return;
            }

            logger.log("price found, returning price: " + price);

            // call the callback with the item price (null error)
            callback(null, price);
        });
    };

    /**
     * Scrapes a website specified by the uri and gathers the item details, which
     * consists of the item's name, category, and current price found on the page.
     *
     * @param  {String}   uri      The uri of the website to scan
     * @param  {Function} callback Callback called when complete, with first argument
     *                             a possible error object, and second argument the
     *                             item details. The item details consists of a name,
     *                             category, and price.
     */
    this.findItemDetails = function(uri, callback) {
        var site;

        logger.log("findItemPrice with uri: " + uri);

        try {
            site = siteManager.loadSite(uri, this._config);
        } catch (error) {
            logger.error("error loading site: " + error);
            if (error.message) {
                callback(error.message);
            } else {
                callback(error);
            }
            return;
        }

        logger.log("scraping the page...");

        // page scrape the site to find the item details
        pageScrape(site, function(err, pageData) {
            var itemDetails;

            if (err) {
                logger.error("error retrieving pageData: " + err);
                callback(err);
                return;
            }

            logger.log("pageData found, loading price from site...");

            itemDetails = {};

            // find the price on the website
            itemDetails.price = site.findPriceOnPage(pageData);

            // error check
            if (itemDetails.price === -1) {
                logger.error("unable to find price");
                callback("unable to find price for uri: " + uri);
                return;
            }

            logger.log("price found, loading category from site...");

            // find the category on the page
            itemDetails.category = site.findCategoryOnPage(pageData);

            // find the name on the page (if we have the category)
            if (itemDetails.category) {
                logger.log("category found, loading name from site...");
                itemDetails.name = site.findNameOnPage(pageData, itemDetails.category);
            } else {
                logger.log("unable to find category, skipping name");
            }

            logger.log("returning itemDetails: " + JSON.stringify(itemDetails));

            // call the callback with our item details (null error)
            callback(null, itemDetails);
        });
    };

    // ==================================================
    // ============== PRIVATE FUNCTIONS =================
    // ==================================================
    var priceFinder = this;

    function pageScrape(site, callback) {
        var pageData, config;

        config = priceFinder._config;

        async.whilst(
            function() {
                // run this until we get page data
                return !pageData;
            },
            function(whilstCallback) {
                // hit the site to get the item details
                logger.log("using request to get page data for uri: " + site.getURIForPageData());
                request({
                    uri: site.getURIForPageData(),
                    headers: config.headers
                }, function(err, response, body) {
                    if (err) {
                        whilstCallback(err);
                        return;
                    }
                    if (response) {
                        if (response.statusCode === 200) {
                            logger.log("response statusCode is 200, parsing body to pageData");
                            // good response
                            if (site.isJSON()) {
                                // parse the body to grab the JSON
                                pageData = JSON.parse(body);
                            } else {
                                // build jquery object using cheerio
                                pageData = cheerio.load(body);
                            }
                            whilstCallback();
                            return;
                        } else if (config.retryStatusCodes.indexOf(response.statusCode) > -1) {
                            // if we get a statusCode that we should retry, try again
                            logger.log("response status part of retryStatusCodes, status: " + response.statusCode + ", retrying...");

                            logger.log("sleeping for: " + config.retrySleepTime + "ms");
                            setTimeout(function() {
                                whilstCallback();
                            }, config.retrySleepTime);
                            return;
                        } else {
                            // else it's a bad response status, all stop
                            whilstCallback("response status: " + response.statusCode);
                            return;
                        }
                    } else {
                        whilstCallback("no response object found!");
                        return;
                    }
                });
            },
            function(err) {
                callback(err, pageData);
            }
        );
    }
}

module.exports = PriceFinder;
