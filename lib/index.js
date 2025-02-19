/**
 * Copyright (c) 2025 CuteStoryteller
 * All Rights Reserved. MIT License
 */

'use strict'; 

const ProductScraper = require('./constructor.js');
require('./extract.js')(ProductScraper);
require('./filter.js')(ProductScraper);
require('./search.js')(ProductScraper);

module.exports = ProductScraper;