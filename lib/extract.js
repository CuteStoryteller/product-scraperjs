/**
 * Copyright (c) 2025 CuteStoryteller
 * All Rights Reserved. MIT License
 */

'use strict';

const { convertToAbsolute } = require('./url.js');
const is = require('./is.js');

/**
 * Extract text contents of selected elements.
 * 
 * @static
 * @param {CheerioAPI} $
 * @param {string} selector
 * @returns {Array<string>}
 * @throws {Error} if selection is empty.
 */
function extractTextContents($, selector) {
    is.invalidType('selector', 'string', selector);

    const els = $(selector);

    is.emptySelection(els, selector);

    return Array.from(els, (_, i) => {
        const text = els.eq(i).text();
        return text.trim();
    });
}

/**
 * Extract attribute values of selected elements.
 * 
 * @static
 * @param {CheerioAPI} $
 * @param {string} selector
 * @param {string} attrName
 * @returns {Array<string>}
 * @throws {Error} if selection is empty.
 */
function extractAttrValues($, selector, attrName) {
    is.invalidType('selector', 'string', selector);
    is.invalidType('attrName', 'string', attrName);

    const els = $(selector);

    is.emptySelection(els, selector);

    return Array.from(els, (_, i) => {
        const attrVal = els.eq(i).attr(attrName);

        if (attrVal === undefined) {
            throw new Error(`Element selected by ${selector} does not have an attribute ${attrName}`);
        }

        return attrVal;
    });
}

/**
 * Extract URLs of selected elements.
 * 
 * @static
 * @param {CheerioAPI} $
 * @param {string} selector
 * @param {string} attrName
 * @param {string} [baseUrl] - if present, all relative URLs will be converted to absolute ones.
 * If this parameter is not a base URL, it will be converted to such.
 * @returns {Array<string>}
 * @throws {Error} if selection is empty.
 */
function extractUrls($, selector, attrName, baseUrl) {
    const urls = extractAttrValues($, selector, attrName);
    return baseUrl ? convertToAbsolute(urls, baseUrl) : urls;
}

/**
 * Product ID formats and corresponding regular expressions.
 * 
 * @example
 * numeric: '1_2-3'
 * alphanumeric: '1x_2-y'
 * 
 * @private
 */
const idFormats = {
    'numeric': /\d([\d_\-]*\d)?/g,
    'alphanumeric': /\w([\w_\-]*\w)?/g,
};

/**
 * Extract a product ID from a product page.
 * 
 * @example
 * const cheerio = require('cheerio');
 * const scraper = new ProductScraper();
 * scraper.productPageSelectors.id = '#product-id';
 * 
 * let html, $, id;
 * 
 * html = '<span id="product-id">AAAA0000</span>';
 * $ = cheerio.load(html);
 * id = scraper.extractProductId($); // id = 'AAAA0000'
 * 
 * scraper.productPageOptions = { idFormat: 'alphanumeric', idMatchIndex: 2 };
 * html = '<span id="product-id">Product id: AAAA0000</span>';
 * $ = cheerio.load(html);
 * id = scraper.extractProductId($); // id = 'AAAA0000'
 * 
 * @param {CheerioAPI} $
 * @param {string} this.productPageSelectors.id
 * @param {string} [this.productPageOptions.idFormat]
 * @param {number} [this.productPageOptions.idMatchIndex]
 * @returns {string}
 */
function extractProductId($) {
    const text = extractTextContents($, this.productPageSelectors.id)[0];
    const regex = idFormats[this.productPageOptions.idFormat];

    if (!regex) return text;

    const matches = text.match(regex);

    if (!matches) {
        throw new Error(`No matches against ${this.productPageOptions.idFormat} pattern were found in the string ${text}`);
    }

    return matches[this.productPageOptions.idMatchIndex];
}

/**
 * Extract a product name from a product page.
 * 
 * @param {CheerioAPI} $
 * @param {string} this.productPageSelectors.name
 * @returns {string}
 */
function extractProductName($) {
    return extractTextContents($, this.productPageSelectors.name)[0];
}

/**
 * Extract a product description from a product page.
 * 
 * @example
 * const cheerio = require('cheerio');
 * const scraper = new ProductScraper();
 * scraper.productPageSelectors.description = '#description';
 * 
 * let html, $, id;
 * 
 * scraper.productPageOptions.hasDescriptionLabel = false;
 * html = '<div id="description">This is a description of the product.</div>';
 * $ = cheerio.load(html);
 * description = scraper.extractProductDescription($); // description = 'This is a description of the product.'
 * 
 * scraper.productPageOptions.hasDescriptionLabel = true;
 * html = '<div id="description">Description: This is a description of the product.</div>';
 * $ = cheerio.load(html);
 * description = scraper.extractProductDescription($); // description = 'This is a description of the product.'
 * 
 * @param {CheerioAPI} $
 * @param {string} this.productPageSelectors.description
 * @param {boolean} [this.productPageOptions.hasDescriptionLabel]
 * @returns {string}
 */
function extractProductDescription($) {
    const description = extractTextContents($, this.productPageSelectors.description).join('\n');
    return this.productPageOptions.hasDescriptionLabel ? description.replace(/\S+\s+/, '') : description;
}

/**
 * Extract images URLs from a product page.
 * 
 * @param {CheerioAPI} $
 * @param {string} this.productPageSelectors.images
 * @param {string} [this.config.baseUrl] - if present, all relative URLs will be converted to absolute ones.
 * @returns {Array<string>}
 */
function extractProductImageUrls($) {
    return extractUrls($, this.productPageSelectors.images, 'src', this.config.baseUrl);
}

/**
 * Extract name of each product from a list.
 * 
 * @param {CheerioAPI} $
 * @param {string} this.productListSelectors.names
 * @returns {Array<string>}
 */
function extractProductNamesFromList($) {
    return extractTextContents($, this.productListSelectors.names);
}

/**
 * Extract product page URL of each product from a list.
 * 
 * @param {CheerioAPI} $
 * @param {string} this.productListSelectors.links
 * @param {string} [this.config.baseUrl] - if present, all relative URLs will be converted to absolute ones.
 * @returns {Array<string>}
 */
function extractProductPageUrlsFromList($) {
    return extractUrls($, this.productListSelectors.links, 'href', this.config.baseUrl);
}

/**
* Extract main image URL of each product from a list.
* 
* @param {CheerioAPI} $
* @param {string} this.productListSelectors.images
* @param {string} [this.config.baseUrl] - if present, all relative URLs will be converted to absolute ones.
* @returns {Array<string>}
*/
function extractProductImageUrlsFromList($) {
   return extractUrls($, this.productListSelectors.images, 'src', this.config.baseUrl);
}

/**
 * Extract description of each product from a list.
 * 
 * @param {CheerioAPI} $
 * @param {string} this.productListSelectors.descriptions
 * @returns {Array<string>}
 */
function extractProductDescriptionsFromList($) {
    return extractTextContents($, this.productListSelectors.descriptions);
}

/**
 * Recognize a brand of a product by its name.
 * 
 * @param {string} productName
 * @param {Array<string>} [this.config.brands] - if not present, empty string will be returned.
 * @returns {string}
 */
function recognizeBrand(productName) {
    is.invalidType('productName', 'string', productName);

    const productNameLowerCase = productName.toLowerCase();

    for (const brand of this.config.brands) {
        if (productNameLowerCase.startsWith(brand.toLowerCase())) {
            return brand;
        }
    }

    for (const brand of this.config.brands) {
        if (productNameLowerCase.includes(brand.toLowerCase())) {
            return brand;
        }
    }

    return '';
}

/**
 * Extract a basic info from a product page.
 * 
 * @param {CheerioAPI} $
 * @param {string} this.productPageSelectors.name
 * @param {Array<string>} [this.config.brands] - if not present, brand will not be included.
 * @returns {{name: string, brand?: string}}
 */
function extractProductBasicInfo($) {
    const name = this.extractProductName($);
    return {
        name,
        brand: this.recognizeBrand(name)
    }
}

/**
 * Extract a basic info of each product from a list.
 * 
 * Any basic info includes a name, a brand and a product page url.
 * 
 * @param {CheerioAPI} $
 * @param {string} this.productListSelectors.names
 * @param {string} this.productListSelectors.links
 * @param {Array<string>} [this.config.brands] - if present, brand will be included. Otherwise, brand will be an empty string.
 * @returns {Array<{name: string, brand?: string, url: string}>}
 */
function extractProductsBasicInfoFromList($) {
    const names = this.extractProductNamesFromList($);
    const urls = this.extractProductPageUrlsFromList($);

    if (names.length !== urls.length) {
        throw new Error('Invalid selection: links number and names number are not equal');
    }
    
    return names.map((name, i) => ({
        name,
        brand: this.recognizeBrand(name),
        url: urls[i]
    }));
}

module.exports = function (ProductScraper) {
    Object.assign(ProductScraper.prototype, {
        extractProductId,
        extractProductName,
        extractProductDescription,
        extractProductImageUrls,
        extractProductNamesFromList,
        extractProductPageUrlsFromList,
        extractProductImageUrlsFromList,
        extractProductDescriptionsFromList,
        recognizeBrand,
        extractProductBasicInfo,
        extractProductsBasicInfoFromList
    });
    Object.assign(ProductScraper, {
        idFormats: Object.keys(idFormats),
        extractTextContents,
        extractAttrValues,
        extractUrls
    });
}