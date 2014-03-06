//= require ./start.frag
//= require ./amd-shim.js
//= requireSelf
//= requireTree ./components
//= require ./end.frag

import $ from 'jquery';
import config from 'config';
import elementQuery from 'elementQuery';
import require from 'require';
import scan from 'scan';

// Tell elementQuery to keep track of sizes for `.orgsync-widget`s
elementQuery(config.elementQuery);

$(window).on('ready resize load', function () { elementQuery(); });

$(scan);

export {require};
