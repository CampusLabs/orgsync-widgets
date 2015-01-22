//= require ./start.frag
//= require bower_components/amdainty/amdainty.js
//= requireSelf
//= require ./components/**/*
//= require ./end.frag

import $ from 'jquery';
import _ from 'underscore';
import Cache from 'cache';
import config from 'config';
import elementQuery from 'elementQuery';
import socket from 'socket.io';
import React from 'react';
import require from 'require';

// Tell elementQuery to keep track of sizes for `.orgsync-widget`s
elementQuery(config.elementQuery);

$(window).on('ready resize load', function () { elementQuery(); });

var eachEl = function (fn) {
  _.each($('.orgsync-widget'), fn);
};

export var mount = function (el) {
  if (el.widgetIsMounted) return;
  var data = $(el).data();
  if (!data.moduleName) return;
  var component = require('components/' + data.moduleName);
  el.widgetIsMounted = true;
  React.render(React.createFactory(component)(_.clone(data)), el);
  elementQuery();
};

export var mountAll = _.partial(eachEl, mount);

export var unmount = function (el) {
  if (React.unmountComponentAtNode(el)) el.widgetIsMounted = false;
};

export var unmountAll = _.partial(eachEl, unmount);

export var io = socket(config.io.uri, config.io);
io.on('connect', function () { io.emit('auth', config.api.key); });

export var cache = new Cache({useLocalStorage: false});

export {require};

$(mountAll);
