/**
 * Copyright (c) 2025 CuteStoryteller
 * All Rights Reserved. MIT License
 */

'use strict';

const is = require('./is.js');

/**
 * @param {string} url
 * @returns {string}
 */
function getBaseUrl(url) {
    try {
        const parsedUrl = new URL(url);
        return `${parsedUrl.protocol}//${parsedUrl.host}`;
    } catch (e) {
        throw new Error(`${url} is not a valid URL`);
    }
}

/**
 * Convert URLs to absolute ones.
 * 
 * @param {Array<string>} urls - relative/absolute URLs.
 * @param {string} baseUrl - if this parameter is not a base URL, it will be converted to such.
 * @returns {Array<string>}
 */
function convertToAbsolute(urls, baseUrl) {
    is.invalidType('urls', 'array', urls);

    const validatedBaseUrl = getBaseUrl(baseUrl);

    return urls.map(url => {
        try {
            return new URL(url, validatedBaseUrl).toString();
        } catch (e) {
            throw new Error(`${url} and ${baseUrl} do not represent a valid URL`);
        }
    });
}

module.exports = {
    convertToAbsolute,
};