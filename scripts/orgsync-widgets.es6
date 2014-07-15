//= require ./start.frag
//= require ./amd-shim.js
//= requireSelf
//= require ./components/**/*
//= require ./end.frag

import $ from 'jquery';
import _ from 'underscore';
import api from 'api';
import config from 'config';
import elementQuery from 'elementQuery';
import React from 'react';
import require from 'require';

// Tell elementQuery to keep track of sizes for `.orgsync-widget`s
elementQuery(config.elementQuery);

$(window).on('ready resize load', _.partial(elementQuery, null));

var eachEl = function (fn) {
  _.each($('.orgsync-widget'), fn);
};

export var mount = function (el) {
  var $self = $(el);
  var data = $self.data();
  if (!$self.is(':empty') || !data.moduleName) return;
  var component = require('components/' + data.moduleName).default;
  if (data.apiKey) api.key = data.apiKey;
  if (data.apiUrlRoot) api.urlRoot = data.apiUrlRoot;
  React.renderComponent(component(_.clone(data)), el);
  elementQuery();
};

export var mountAll = _.partial(eachEl, mount);

export var unmount = React.unmountComponentAtNode;

export var unmountAll = _.partial(eachEl, unmount);

export {require};

$(mountAll);
