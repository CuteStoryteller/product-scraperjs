/**
 * Copyright (c) 2025 CuteStoryteller
 * All Rights Reserved. MIT License
 */

'use strict';

const is = require('./is.js');

/**
 * Filter all product cards from a page that satisfy filterFunction.
 * 
 * @example
 * const scraper = new ProductScraper();
 * scraper.productListSelectors = { links: '.product-card a', images: '.product-card img', descriptions: '.product-card p' };
 * scraper.placeholders = { image: 'placeholder-image-url', description: 'Lorem ipsum...' };
 * 
 * const html = `
 * <div id="product-list">
 *      <div class="product-card">
 *          <a href="first-url"><img src="first-image-url" /></a>
 *          <p>This is the description of the first product.</p>
 *      </div>
 *      <div class="product-card">
 *          <a href="second-url"><img src="placeholder-image-url" /></a>
 *          <p>This is the description of the second product.</p>
 *      </div>
 *      <div class="product-card">
 *          <a href="third-url"><img src="third-image-url" /></a>
 *          <p>Lorem ipsum...</p>
 *      </div>
 *      <div class="product-card">
 *          <a href="fourth-url"><img src="placeholder-image-url" /></a>
 *          <p>Lorem ipsum...</p>
 *      </div>
 * </div>`;
 * const $ = require('cheerio').load(html);
 * 
 * let filterFunction, filteredUrls;
 * 
 * filterFunction = (x, y) => !x; // product cards without a main image
 * filteredUrls = scraper.filterProductCardsFromPage($, scraper.extractProductPageUrlsFromList, filterFunction); // ["second-url", "fourth-url"];
 * 
 * filterFunction = (x, y) => !y; // product cards without a description
 * filteredUrls = scraper.filterProductCardsFromPage($, scraper.extractProductPageUrlsFromList, filterFunction); // ["third-url", "fourth-url"];
 * 
 * filterFunction = (x, y) => !x && !y; // product cards without a main image and a description
 * filteredUrls = scraper.filterProductCardsFromPage($, scraper.extractProductPageUrlsFromList, filterFunction); // ["fourth-url"];
 * 
 * filterFunction = (x, y) => !x || !y; // product cards without a main image or a description
 * filteredUrls = scraper.filterProductCardsFromPage($, scraper.extractProductPageUrlsFromList, filterFunction); // ["second-url", "third-url", "fourth-url"];
 * 
 * @param {CheerioAPI} $
 * @param {Function<CheeioAPI>: Array} callback - function that returns an array of product cards data from page.
 * @param {Function<imgExist: boolean, desExist: boolean>: boolean} filterFunction
 * @param {string} [this.productListSelectors.images] - if not present, then imageExist parameter in filterFunction is false for all products.
 * @param {string} [this.productListSelectors.descriptions] - if not present, then descriptionExist parameter in filterFunction is false for all products.
 * @param {string} [this.placeholders.image] - if not present, then imageExist parameter in filterFunction is false for all products.
 * @param {string} [this.placeholders.description] - if not present, then descriptionExist parameter in filterFunction is false for all products.
 * @param {string} [this.config.baseUrl] - if present, all relative URLs will be converted to absolute ones.
 * @param {Object} [thisArg=this] - "this" arg to use in callback.
 * @returns {Array<string>} data of product cards satisfying filterFunction.
 */
function filterProductCardsFromPage($, callback, filterFunction, thisArg = this) {
    is.invalidType('callback', 'function', callback);
    is.invalidType('filterFunction', 'function', filterFunction);

    const data = callback.call(thisArg, $);
    is.invalidType('data', 'array', data);

    const imgExist = Array(data.length).fill(false);
    const desExist = Array(data.length).fill(false);

    if (this.productListSelectors.images && this.placeholders.image) {
        const imgUrls = this.extractProductImageUrlsFromList($);

        if (imgUrls.length !== data.length) {
            throw new Error('Invalid selection: images number and product cards number are not equal');
        }

        for (let i = 0; i < imgUrls.length; i++) {
            imgExist[i] = imgUrls[i] !== this.placeholders.image;
        }
    }

    if (this.productListSelectors.descriptions && this.placeholders.description) {
        const descriptions = this.extractProductDescriptionsFromList($);

        if (descriptions.length !== data.length) {
            throw new Error('Invalid selection: descriptions number and product cards number are not equal');
        }

        for (let i = 0; i < descriptions.length; i++) {
            desExist[i] = descriptions[i] !== this.placeholders.description;
        }
    }

    return data.filter((_, i) => filterFunction(imgExist[i], desExist[i]));
}

/**
 * Filter all product cards from a pagination that satisfy filterFunction.
 * 
 * @param {Object} pagination - pagination options.
 * @param {string} pagination.url - part of the pagination URL before a page number (so URL of the N-th page will be: pagination.url + N).
 * @param {number} [pagination.first=1] - first page number to start from.
 * @param {number} [pagination.last] - last page number to stop.
 * @param {Function<CheeioAPI>: Array} callback - function that returns an array of product cards data from page.
 * @param {Function<imgExist: boolean, desExist: boolean>: boolean} filterFunction
 * @param {string} [this.productListSelectors.images] - if not present, then imageExist parameter in filterFunction is false for all products.
 * @param {string} [this.productListSelectors.descriptions] - if not present, then descriptionExist parameter in filterFunction is false for all products.
 * @param {string} [this.placeholders.image] - if not present, then imageExist parameter in filterFunction is false for all products.
 * @param {string} [this.placeholders.description] - if not present, then descriptionExist parameter in filterFunction is false for all products.
 * @param {string} [this.config.baseUrl] - if present, all relative URLs will be converted to absolute ones.
 * @returns {Promise<Array<string>>} data of product cards satisfying filterFunction.
 */
async function filterProductCardsFromPagination(pagination, callback, filterFunction) {
    return await this.iterateOverPagination(pagination,
        $ => this.filterProductCardsFromPage($, callback, filterFunction));
}

/**
 * Filter all product cards from a catalog section that satisfy filterFunction.
 * 
 * @param {string} criteria - catalog pagination criteria (usually a product brand).
 * @param {Function<CheeioAPI>: Array} callback - function that returns an array of product cards data from page.
 * @param {filterProductCardFunction} filterFunction
 * @param {Array<string>} this.paginations.catalog
 * @param {string} [this.productListSelectors.images] - if not present, then imageExist parameter in filterFunction is false for all products.
 * @param {string} [this.productListSelectors.descriptions] - if not present, then descriptionExist parameter in filterFunction is false for all products.
 * @param {string} [this.placeholders.image] - if not present, then imageExist parameter in filterFunction is false for all products.
 * @param {string} [this.placeholders.description] - if not present, then descriptionExist parameter in filterFunction is false for all products.
 * @param {string} [this.config.baseUrl] - if present, all relative URLs will be converted to absolute ones.
 * @returns {Promise<Array<string>>} data of product cards satisfying filterFunction.
 */
async function filterProductCardsFromCatalog(criteria, callback, filterFunction) {
    is.invalidType('criteria', 'string', criteria);

    const url = this.paginations.catalog[0] + criteria + this.paginations.catalog[1];
    return await this.filterProductCardsFromPagination({ url }, callback, filterFunction);
}

/**
 * Filter all product cards from search results that satisfy filterFunction.
 * 
 * @example
 * const callback = scraper.extractProductPageUrlsFromList;
 * const filterFunction = (x, y) => !x || !y;
 * const data = await scraper.filterProductCardsFromSearch('query', callback, filterFunction);
 * 
 * @param {string} query - search query.
 * @param {Function<CheeioAPI>: Array} callback - function that returns an array of product cards data from page.
 * @param {filterProductCardFunction} filterFunction
 * @param {Array<string>} this.paginations.search
 * @param {string} [this.productListSelectors.images] - if not present, then imageExist parameter in filterFunction is false for all products.
 * @param {string} [this.productListSelectors.descriptions] - if not present, then descriptionExist parameter in filterFunction is false for all products.
 * @param {string} [this.placeholders.image] - if not present, then imageExist parameter in filterFunction is false for all products.
 * @param {string} [this.placeholders.description] - if not present, then descriptionExist parameter in filterFunction is false for all products.
 * @param {string} [this.config.baseUrl] - if present, all relative URLs will be converted to absolute ones.
 * @returns {Promise<Array<string>>} data of product cards satisfying filterFunction.
 */
async function filterProductCardsFromSearch(query, callback, filterFunction) {
    is.invalidType('query', 'string', query);
    
    const url = this.paginations.search[0] + query + this.paginations.search[1];
    return await this.filterProductCardsFromPagination({ url }, callback, filterFunction);
}

module.exports = function (ProductScraper) {
    Object.assign(ProductScraper.prototype, {
        filterProductCardsFromPage,
        filterProductCardsFromPagination,
        filterProductCardsFromCatalog,
        filterProductCardsFromSearch
    });
}