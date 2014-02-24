//= require ./start.frag
//= require ./amd-shim.js
//= requireSelf
//= requireTree ./components
//= require ./end.frag

import $ from 'jquery';
import require from 'require';
import scan from 'scan';

$(scan);

export {require};
