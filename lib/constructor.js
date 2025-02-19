/**
 * Copyright (c) 2025 CuteStoryteller
 * All Rights Reserved. MIT License
 */

'use strict';

const _ = require('lodash');
const cheerio = require('cheerio');
const is = require('./is.js');

class ProductScraper {
    /**
     * @constructs ProductScraper
     * 
     * @param {Object} [config] - configuration object for an e-marketplace.
     * @param {string} [config.baseUrl] - base URL of the website. If this parameter is not a base URL, it will be converted to one when necessary.
     * @param {Array<string>} [config.brands] - list of all website brands.
     * @param {Object} [config.productPageSelectors] - selectors of a product page.
     * @param {string} [config.productPageSelectors.id] - selector for an element containing a product ID.
     * @param {string} [config.productPageSelectors.name] - selector for an element containing a product name.
     * @param {string} [config.productPageSelectors.images] - selector for product images.
     * @param {string} [config.productPageSelectors.description] - selector for a product description.
     * @param {Object} [config.productListSelectors] - selectors of a product list (a list of product cards on a catalog page or search results page).
     * @param {string} [config.productListSelectors.names] - selector for a product name in each product card.
     * @param {string} [config.productListSelectors.links] - selector for a link to a product page in each product card.
     * @param {string} [config.productListSelectors.images] - selector for a product main image in each product card.
     * @param {string} [config.productListSelectors.descriptions] - selector for a product description in each product card.
     * @param {Object} [config.productPageOptions] - options for the extraction of product page data.
     * @param {string} [config.productPageOptions.idFormat] - format of a product ID, which must be a value from ProductScraper.idFormats.
     * Used when a product ID cannot be extracted solely via config.productPageSelectors.id (e.g. textContent of a selected element is "ID: 0123" and not the "0123"). 
     * @param {number} [config.productPageOptions.idMatchIndex=0] - index specifying which match against config.productPageOptions.idFormat to choose from a textContent
     * of an element selected by config.productPageSelectors.id.
     * @param {boolean} [config.productPageOptions.hasDescriptionLabel=false] - set this to true to remove the first word from a product description.
     * Used when a text has the "description label" (i.e. the word "Description:" in the beginning).
     * @param {Object} [config.placeholders] - placeholders for a product card.
     * @param {string} [config.placeholders.image] - URL of the placeholder image.
     * @param {string} [config.placeholders.description] - full text of the placeholder description.
     * @param {Object} [config.paginations] - pagination URL is divided into two components: a part of a URL before a pagination criteria
     * (e.g. a brand for a catalog page or a search query for a search results page), and a part after the criteria and before a page number.
     * For example, URL of the N-th pagination page when searching product by its name must be:
     * config.paginations.search[0] + productName + config.paginations.search[1] + N.
     * So, each of the following paginations should be an array of two strings.
     * If only one string is provided, then only a search without considering pagination is available.
     * @param {Array<string>} [config.paginations.catalog] - catalog pagination URL.
     * @param {Array<string>} [config.paginations.search] - search pagination URL.
     * @param {Object} [config.fuseOptionsBrand] - options for Fuse.js when searching for a product by name and brand.
     * @param {number} [config.fuseOptionsBrand.firstScore=0.19] - threshold for a first score.
     * This is the maximum first score allowed to consider a first product as similar to what is searched.
     * @param {number} [config.fuseOptionsBrand.firstScoreWarning=0.11] - second threshold for a first score.
     * Used to warn that a first product should be checked, as no guarantees apply.
     * @param {number} [config.fuseOptionsBrand.difference=0.03] - threshold for a difference between first and second scores.
     * @param {Object} [config.fuseOptionsBrandless] - options for Fuse.js when searching for a product solely by name.
     * @param {number} [config.fuseOptionsBrandless.firstScore=0.19] - threshold for a first score.
     * This is the maximum first score allowed to consider a first product as similar to what is searched.
     * @param {number} [config.fuseOptionsBrandless.firstScoreWarning=0.11] - second threshold for a first score.
     * Used to warn that a first product should be checked, as no guarantees apply.
     * @param {number} [config.fuseOptionsBrandless.difference=0.03] - threshold for a difference between first and second scores.
     * @returns {ProductScraper}
     */
    constructor(config = {}) {
        is.invalidType('config', 'object', config);
        is.invalidType('config.baseUrl', 'string', config.baseUrl, true);
        is.invalidType('config.brands', 'array', config.brands, true);
        is.invalidType('config.productPageSelectors', 'object', config.productPageSelectors, true);
        is.invalidType('config.productPageSelectors.id', 'string', config.productPageSelectors?.id, true);
        is.invalidType('config.productPageSelectors.name', 'string', config.productPageSelectors?.name, true);
        is.invalidType('config.productPageSelectors.images', 'string', config.productPageSelectors?.images, true);
        is.invalidType('config.productPageSelectors.description', 'string', config.productPageSelectors?.description, true);
        is.invalidType('config.productListSelectors', 'object', config.productListSelectors, true);
        is.invalidType('config.productListSelectors.names', 'string', config.productListSelectors?.names, true);
        is.invalidType('config.productListSelectors.links', 'string', config.productListSelectors?.links, true);
        is.invalidType('config.productListSelectors.images', 'string', config.productListSelectors?.images, true);
        is.invalidType('config.productListSelectors.descriptions', 'string', config.productListSelectors?.descriptions, true);
        is.invalidType('config.productPageOptions', 'object', config.productPageOptions, true);
        is.invalidType('config.productPageOptions.idFormat', 'string', config.productPageOptions?.idFormat, true);
        is.invalidType('config.productPageOptions.idMatchIndex', 'number', config.productPageOptions?.idMatchIndex, true);
        is.invalidType('config.productPageOptions.hasDescriptionLabel', 'boolean', config.productPageOptions?.hasDescriptionLabel, true);
        is.invalidType('config.placeholders', 'object', config.placeholders, true);
        is.invalidType('config.placeholders.image', 'string', config.placeholders?.image, true);
        is.invalidType('config.placeholders.description', 'string', config.placeholders?.description, true);
        is.invalidType('config.paginations', 'object', config.paginations, true);
        is.invalidType('config.paginations.catalog', 'array', config.paginations?.catalog, true);
        is.invalidType('config.paginations.search', 'array', config.paginations?.search, true);
        is.invalidType('config.fuseOptionsBrand', 'object', config.fuseOptionsBrand, true);
        is.invalidType('config.fuseOptionsBrand.firstScore', 'number', config.fuseOptionsBrand?.firstScore, true);
        is.invalidType('config.fuseOptionsBrand.firstScoreWarning', 'number', config.fuseOptionsBrand?.firstScoreWarning, true);
        is.invalidType('config.fuseOptionsBrand.difference', 'number', config.fuseOptionsBrand?.difference, true);
        is.invalidType('config.fuseOptionsBrandless', 'object', config.fuseOptionsBrandless, true);
        is.invalidType('config.fuseOptionsBrandless.firstScore', 'number', config.fuseOptionsBrandless?.firstScore, true);
        is.invalidType('config.fuseOptionsBrandless.firstScoreWarning', 'number', config.fuseOptionsBrandless?.firstScoreWarning, true);
        is.invalidType('config.fuseOptionsBrandless.difference', 'number', config.fuseOptionsBrandless?.difference, true);

        if (config.brands && !config.brands.every(is.string)) {
            throw is.invalidTypeError('config.brands', 'array of strings', config.brands);
        }

        if (config.paginations?.catalog && !config.paginations.catalog.every(is.string)) {
            throw is.invalidTypeError('config.paginations.catalog', 'array of strings', config.paginations.catalog);
        }

        if (config.paginations?.search && !config.paginations.search.every(is.string)) {
            throw is.invalidTypeError('config.paginations.search', 'array of strings', config.paginations.search);
        }

        this.config = {
            baseUrl: '',
            brands: [],
            productPageSelectors: {
                id: '',
                name: '',
                images: '',
                description: ''
            },
            productListSelectors: {
                names: '',
                links: '',
                images: '',
                descriptions: ''
            },
            productPageOptions: {
                idFormat: '',
                idMatchIndex: 0,
                hasDescriptionLabel: false
            },
            placeholders: {
                image: '',
                description: ''
            },
            paginations: {
                catalog: ['', ''],
                search: ['', '']
            },
            fuseOptionsBrand: {
                firstScore: 0.19,
                firstScoreWarning: 0.11,
                difference: 0.03
            },
            fuseOptionsBrandless: {
                firstScore: 0.19,
                firstScoreWarning: 0.11,
                difference: 0.03
            }
        };

        this.controller = new AbortController();
        this.signal = this.controller.signal;
        
        _.merge(this.config, config);

        // Shortcuts for object values of config
        for (const [key, value] of Object.entries(this.config)) {
            if (is.object(value) && key !== 'config') this[key] = value;
        }

        return this;
    }

    /**
     * @param {string} url
     * @returns {Promise<CheerioAPI>}
     */
    async fetchCheerioAPI(url) {
        try {
            const response = await fetch(url, { signal: this.signal });
            const html = await response.text();
            return cheerio.load(html);
        } catch(e) {
            throw new Error(`${url} is not a valid URL or is currently unavailable`);
        }
    }

    /**
     * @async
     * @param {string} query
     * @returns {Promise<CheerioAPI>}
     */
    search(query) {
        return this.fetchCheerioAPI(this.paginations.search[0] + query);
    }

    /**
     * @returns {void}
     */
    abort() {
        this.controller.abort();
    }

    /**
     * @returns {void}
     */
    reset() {
        this.controller = new AbortController();
        this.signal = this.controller.signal;
    }

    /**
     * Iterate over pagination.
     * 
     * @param {Object} pagination - pagination options.
     * @param {string} pagination.url - part of the pagination URL before a page number (so URL of the N-th page will be: pagination.url + N).
     * @param {number} [pagination.first=1] - first page number to start iteration from.
     * @param {number} [pagination.last] - if present, last page number to stop iteration. Otherwise the iteration will stop once it reaches the end.
     * The end of a pagination is determined by one of two factors. When fetch a pagination page that goes after the last one:
     * 1. Either it doesn't have a product list and the callback throws an error (so it must throw it when a product list is empty).
     * 2. Or a website's server sends one of paginations page again.
     * @param {Function<CheerioAPI>: Array} callback
     * @returns {Promise<Array>} array that accumulates results of callback from each page.
     */
    async iterateOverPagination(pagination, callback) {
        is.invalidType('pagination', 'object', pagination);
        is.invalidType('pagination.url', 'string', pagination.url);
        is.invalidType('pagination.first', 'number', pagination.first, true);
        is.invalidType('pagination.last', 'number', pagination.last, true);
        is.invalidType('callback', 'function', callback);

        const { url, first, last } = pagination;
        let acc = [];

        const startPageNum = (first == undefined) ? 1 : first;
        let pageNum = startPageNum;

        while (last == undefined ? true : pageNum <= last) {
            const $ = await this.fetchCheerioAPI(url + pageNum);

            try {
                const data = callback($);

                /*  A simple check that the pagination range is exceeded: If a page reoccurs,
                    one of selected elements will already be included in acc.
                */
                if (acc.find(val => _.isEqual(val, data[0]))) break;

                acc = acc.concat(data);
            } catch (e) {
                if (pageNum === startPageNum) throw e;
                break; // The pagination range is probably exceeded
            }

            pageNum++;
        }

        return acc;
    }
}

module.exports = ProductScraper;