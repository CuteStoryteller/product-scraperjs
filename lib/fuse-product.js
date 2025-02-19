/**
 * Copyright (c) 2025 CuteStoryteller
 * All Rights Reserved. MIT License
 */

'use strict';

const Fuse = require('fuse.js');

/**
 * Options for Fuse.js.
 * 
 * @private
 */
const FUSE_DEFAULT_OPTIONS = {
    isCaseSensitive: false,
    includeScore: true,
    includeMatches: false,
    minMatchCharLength: 1,
    shouldSort: true,
    findAllMatches: false,
    threshold: 1.0,
    ignoreLocation: true,
    useExtendedSearch: true,
    fieldNormWeight: 0,
};

/**
 * @param {string} str 
 * @returns {string}
 * @private
 */
function normalize(str) {
    return str.replace(/[\{\}\[\]()\.,+\-]/g, "").replace(/[\s/|\\]+/g, " ");
}

/**
 * Assess a relevance of a first Fuse.js result.
 * 
 * @param {Array} results
 * @param {Object} thresholds
 * @param {string} thresholds.firstScore
 * @param {string} thresholds.firstScoreWarning
 * @param {string} thresholds.difference
 * @returns {number}
 * @private
 */
function assessRelevance(results, thresholds) {
    const firstScore = results[0].score;

    if (firstScore >= thresholds.firstScore) {
        return 0;
    }
    
    if (firstScore >= thresholds.firstScoreWarning) {
        return 1;
    }

    if (results.length > 1 && results[1].score - firstScore < thresholds.difference) {
        return 2;
    }

    return 3;
}

/**
 * Search for the product among the array of product names by its basic info using Fuse.js.
 * Returns
 * 1. the index of the array such that productNames[index] is the most close to productName;
 * 2. relevance of productNames[index]. Relevance = 0 means that product names doesn't have any close enough name.
 * 
 * @param {Object} basicInfo
 * @param {string} basicInfo.name
 * @param {string} [basicInfo.brand]
 * @param {Array<string>} productNames
 * @returns {{index: number, relevance: number}}
 * @private
 */
function fuseSearchProduct(basicInfo, productNames, fuseOptionsBrand, fuseOptionsBrandless) {
    const name = normalize(basicInfo.name);
    const names = productNames.map(name => normalize(name));

    const options = FUSE_DEFAULT_OPTIONS;
    let fuse = new Fuse(names, options);
    let query;
    let result = [];
    let thresholds;

    // Search by a name and a brand to get more precise result.
    if (basicInfo.brand) {
        const brand = normalize(basicInfo.brand);
        query = " '" + name.replace(/\s/, " '") + " '" + brand.replace(/\s/g, " '");
        result = fuse.search(query);
        thresholds = fuseOptionsBrand;
    }

    // Search only by a name.
    if (result.length === 0) {
        query = name;
        result = fuse.search(query);
        thresholds = fuseOptionsBrandless;

        if (result.length === 0) {
            throw new Error(`Fuse.js cannot find ${basicInfo.name}`);
        }
    }

    const relevance = assessRelevance(result, thresholds);

    /*  The first result is close, but the second one is also close.
        Increase the significance of the name length to better distinguish between the two scores. */
    if (relevance === 2) {
        options.fieldNormWeight = 0.5;
        fuse = new Fuse(names, options);
        result = fuse.search(query);
    }

    return {
        index: result[0].refIndex,
        relevance
    }
}

module.exports = {
    fuseSearchProduct
};