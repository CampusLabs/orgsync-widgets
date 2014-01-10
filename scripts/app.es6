import $ from 'jquery';
import _ from 'underscore';
import config from 'config';
import dpr from 'dpr';
import elementQuery from 'elementQuery';
import herit from 'herit';
import jstz from 'jstz';
import moment from 'moment';
import api from 'api';
module Portal from 'entities/portal';
import Olay from 'olay';
import OrgSyncApi from 'orgsync-javascript-api';
import React from 'react';

// requestAnimationFrame shim.
_.each(['webkit', 'moz'], function (vendor) {
  if (window.requestAnimationFrame) return;
  window.requestAnimationFrame = window[vendor + 'RequestAnimationFrame'];
  window.cancelAnimationFrame =
    window[vendor + 'CancelAnimationFrame'] ||
    window[vendor + 'CancelRequestAnimationFrame'];
});
if (!window.requestAnimationFrame) {
  var lastTime = 0;
  window.requestAnimationFrame = function (cb) {
    var now = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (now - lastTime));
    var id = window.setTimeout(_.partial(cb, now + timeToCall), timeToCall);
    lastTime = now + timeToCall;
    return id;
  };
  window.cancelAnimationFrame = clearTimeout;
}

// Tell elementQuery to keep track of sizes for `.orgsync-widget`s
elementQuery(config.elementQuery);

// Fixing the updateOffset method for some wonky DST issues.
moment.updateOffset = function (date) {
  if (!date._z) return;
  var delta = date.zone();
  var offset = date._z.offset(date);
  if (!(delta -= offset)) return;
  date.zone(offset);
  if (Math.abs(delta) <= 60) date.subtract('minutes', delta);
};

// Views will add themselves to this map with their corresponding selectors.
// i.e. {'.js-osw-index-portals': app.IndexPortalsView}
var selectorViewMap = {};

var scan = function () {
  $('html').addClass('dpr-' + dpr());
  $('.osw-albums').each(function () {
    var portalId = $(this).data('portalId');
    var albums = (new Portal.Model({id: portalId})).get('albums');
    var AlbumsIndex = require('components/albums/index').default;
    React.renderComponent(AlbumsIndex({albums: albums}), this);
  });
  _.each(selectorViewMap, function (view, selector) {
    $(selector).each(function () { new view({el: this}); });
  });
  elementQuery();
};

$(scan);

export {api, selectorViewMap, scan};

// Require each widget designated in the build.
_.each(config.build.include, require);
