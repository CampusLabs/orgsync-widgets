//= require ./start.frag
//= require bower_components/amdainty/amdainty.js
//= requireself
//= requireTree ./components
//= require ./end.frag

import $ from 'jquery';
import require from 'require';
import scan from 'scan';

$(scan);

export {require};
