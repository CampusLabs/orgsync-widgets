// = require ./start
// = require node_modules/amdainty/amdainty.js
// = requireself
// = require ./components/**/*
// = require ./end

import $ from 'jquery';
import _ from 'underscore';
import Cache from 'cache';
import config from 'config';
import elementQuery from 'element-query';
import React from 'react';
import ReactDOM from 'react-dom';
import require from 'require';

// Tell elementQuery to keep track of sizes for `.orgsync-widget`s
elementQuery(config.elementQuery);

$(window).on('ready resize load', () => elementQuery());

const eachEl = fn => _.each($('.orgsync-widget'), fn);

export const mount = function (el) {
  if (el.widgetIsMounted) return;
  const data = $(el).data();
  if (!data.moduleName) return;
  const Component = require('components/' + data.moduleName);
  el.widgetIsMounted = true;
  ReactDOM.render(<Component {...data} />, el);
  elementQuery();
};

export const mountAll = _.partial(eachEl, mount);

export const unmount = el => {
  if (ReactDOM.unmountComponentAtNode(el)) el.widgetIsMounted = false;
};

export const unmountAll = _.partial(eachEl, unmount);

export const cache = new Cache({useLocalStorage: false});

export {require};

$(mountAll);
