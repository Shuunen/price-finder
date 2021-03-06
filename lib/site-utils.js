"use strict";

var logger = require("./logger")();

// logger = console;

// Represents the various categories of an online item
module.exports.categories = {
    DIGITAL_MUSIC: "Digital Music",
    MUSIC: "Music",
    VIDEO_GAMES: "Video Games",
    MOBILE_APPS: "Mobile Apps",
    MOVIES_TV: "Movies & TV",
    CAMERA_VIDEO: "Camera & Video",
    TOYS_GAMES: "Toys & Games",
    BOOKS: "Books",
    KINDLE_BOOKS: "Kindle Books",
    HOUSEHOLD: "Household",
    HEALTH_PERSONAL_CARE: "Health & Personal Care",
    TELEVISION_VIDEO: "Television & Video",
    HOME_AUDIO: "Home Audio",
    LUGGAGE: "Luggage",
    OTHER: "Other"
};

/**
 * Finds content on a page, returning either the text or null.
 *
 * @param  {Object} $         jQuery-like object
 * @param  {Array} selectors  An array of selectors to search with
 * @return {String}           The content found (or null)
 */
module.exports.findContentOnPage = function ($, selectors) {
    var i, content;

    // logger.log("selectors: " + selectors);

    // loop until we find the content, or we exhaust our selectors
    for (i = 0; i < selectors.length; i++) {
        content = $(selectors[i]);
        if (content && content.length) {
            logger.log("found content with selector: " + selectors[i]);

            if (content.length > 1) {
                content = content.first();
            }

            var str = content.text().trim();
            logger.log('content : ' + str);

            str = module.exports.cleanPrice(str);

            return str;
        }
    }

    // if we've not found anything, return null to signify that
    return null;
};


module.exports.cleanPrice = function (str) {

    /* Remove non-digital except ',' */
    // from (string) "EUR 44,99 ! exceptional price \o/"
    // to   (string) "44,99"
    str = str.replace(/[^\,\d]/g,'');

    /* Parse string as float */
    // from (string) "44,99"
    // to   (float)  44.99
    str = parseFloat(str.replace(',', '.'));

    /* Force 2 decimals */
    // from (float)  44.9385
    // to   (string) "44.94"
    str = str.toFixed(2);

    return str;
}

module.exports.cleanString = function (str) {

    /* Remove non-char */
    // from "JEU SONY PS3 *** RAYMAN!!! $ORIGINS *** Version Française * COMPLET * 7+* TTBE"
    // to "jeu sony ps3 rayman origins version fran aise complet 7 ttbe"
    str = str.replace(/\W/g, ' ').replace(/\s+/g, ' ').toLowerCase();

    /* Ellipsis */
    // from "jeu sony ps3 rayman origins version fran aise complet 7 ttbe"
    // to "jeu sony ps3 rayman origins ve..."
    var limit = 30;
    str = (str === str.substr(0, limit) ? str : str.substr(0, limit) + '...');

    /* Uppercase first letter */
    // from "jeu sony ps3 rayman origins ve..."
    // to "Jeu sony ps3 rayman origins ve..."
    str = str.charAt(0).toUpperCase() + str.slice(1);

    return str;
}
