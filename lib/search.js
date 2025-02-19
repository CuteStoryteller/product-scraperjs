/**
 * Copyright (c) 2025 CuteStoryteller
 * All Rights Reserved. MIT License
 */

'use strict';

const { fuseSearchProduct } = require('./fuse-product.js');
const is = require('./is.js');

/**
 * Did a search engine find any results?
 *  
 * @param {string} query - search query.
 * @param {string} this.paginations.search[0]
 * @param {{names?: string, links?: string, images?: string, descriptions?: string}} this.productListSelectors - at least one of its values
 * must be defined.
 * @returns {Promise<boolean>}
 */
async function hasSearchResult(query) {
    is.invalidType('query', 'string', query);

    const $ = await this.fetchCheerioAPI(this.paginations.search[0] + query);
    const selector = this.productListSelectors.names ||
                    this.productListSelectors.links ||
                    this.productListSelectors.images ||
                    this.productListSelectors.descriptions;
    return !!$(selector).length;
}

/**
 * Get a maximum substring of a search query such that search results are non-empty.
 * 
 * @param {string} query - search query.
 * @param {string} this.paginations.search[0]
 * @param {{names?: string, links?: string, images?: string, descriptions?: string}} this.productListSelectors - at least one of its values
 * must be defined.
 * @returns {Promise<string>}
 */
async function getOptimalForSearchSubstring(query) {
    is.invalidType('query', 'string', query);

    let hasResult = await this.hasSearchResult(query);
    if (hasResult) return query;

    let left = 1;
    let right = query.length;
    let middle;
    let substr;

    while (right - left > 1) {
        middle = Math.floor((left + right) / 2);
        substr = query.substring(0, middle + 1);

        hasResult = await this.hasSearchResult(substr);
        hasResult ? left = middle : right = middle;
    }

    return query.substring(0, left + 1);
}

/**
 * Search for a product by its basic info.
 * 
 * @param {Object} basicInfo
 * @param {string} basicInfo.name
 * @param {string} [basicInfo.brand]
 * @param {string} [basicInfo.url]
 * @param {Array<string>} this.paginations.search
 * @param {string} this.productListSelectors.names
 * @param {string} this.productListSelectors.links
 * @param {Object} this.fuseOptionsBrand
 * @param {Object} this.fuseOptionsBrandless
 * @returns {Promise<string>} product page URL of the closest search result.
 */
async function searchProduct(basicInfo) {
    is.invalidType('basicInfo', 'object', basicInfo);
    is.invalidType('basicInfo.brand', 'string', basicInfo.brand, true);
    is.invalidType('basicInfo.brand', 'string', basicInfo.url, true);

    if (basicInfo.url) return basicInfo.url;

    const nameSubstr = await this.getOptimalForSearchSubstring(basicInfo.name);
    const url = this.paginations.search[0] + nameSubstr + this.paginations.search[1];
    const basicInfoList = await this.iterateOverPagination({ url },
        $ => this.extractProductsBasicInfoFromList($));

    if (basicInfoList.length === 0) {
        throw new Error(`Search engine on the website does not work`);
    }

    const productNames = basicInfoList.map(obj => obj.name);
    const { index, relevance } = fuseSearchProduct(basicInfo, productNames,
        this.fuseOptionsBrand, this.fuseOptionsBrandless);

    if (relevance === 0) {
        throw new Error(`No products close enough were found`);
    }

    return basicInfoList[index].url;    
}

/**
 * Search for product card data by basic info.
 * 
 * Product card data includes image URLs and description.
 * 
 * @param {Object} basicInfo
 * @param {string} basicInfo.name
 * @param {string} [basicInfo.brand]
 * @param {string} [basicInfo.url]
 * @param {Array<string>} this.paginations.search
 * @param {string} this.productListSelectors.names
 * @param {string} this.productListSelectors.links
 * @param {Object} this.fuseOptionsBrand
 * @param {Object} this.fuseOptionsBrandless
 * @param {string} this.productPageSelectors.images
 * @param {string} this.productPageSelectors.description
 * @returns {Promise<{imageUrls: Array<string>, description: string }>}
 */
async function searchProductCardData(basicInfo) {
    const productPageUrl = await this.searchProduct(basicInfo);
    const $ = await this.fetchCheerioAPI(productPageUrl);

    return {
        imageUrls: this.extractProductImageUrls($),
        description: this.extractProductDescription($)
    };
}

module.exports = function (ProductScraper) {
    Object.assign(ProductScraper.prototype, {
        hasSearchResult,
        getOptimalForSearchSubstring,
        searchProduct,
        searchProductCardData
    });
};