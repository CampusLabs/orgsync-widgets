import _ from 'underscore';
import _str from 'underscore.string';
import api from 'api';
import Live from 'live';
import {getTerm, getName} from 'entities/selector/item';
import React from 'react';

var update = React.addons.update;

var FETCH_SIZE = 100;

var live = new Live({
  url: 'ws://orgsync.com.dev/io/websocket',
  fetchAuthKey: function (cb) { cb(null, api.key); }
});

export var cache = {};

var done = {};

export var parse = function (q) {
  return ((q || '') + '').replace(/\s+/g, ' ').trim().toLowerCase();
};

var filter = function (item, q, options) {
  q = parse(q);
  if (!q) return true;
  var fields = options.fields;
  var searchableWords = _.str.words(
    (fields ? _.values(_.pick(item, fields)).join(' ') : getName(item))
      .toLowerCase()
  );
  return _.every(_str.words(q), function (wordA) {
    return _.any(searchableWords, _.partial(_str.startsWith, _, wordA));
  });
};

export var getQueryKey = function (options) {
  return _.compact([
    (options.school_id || '_all'),
    (options.scopes || []).map(getTerm).sort().join() || '_all',
    (options.indices || []).slice().sort().join() || '_all',
    _.invoke(_.pairs(options.indices_boost), 'join', '=').sort().join() ||
      'none',
    (options.fields || []).slice().sort().join() || 'name',
    parse(options.q)
  ]).join(':');
};

var cacheItems = function (items, options) {
  var key = getQueryKey(options);
  var cached = cache[key] ? cache[key].slice() : [];
  items.forEach(function (item) { cache[getTerm(item)] = item; });
  cache[key] = _.unique(cached.concat(items.map(getTerm)));
};

var getItemFromId = function (id) {
  return cache[id];
};

export var search = function (options) {

  // Store the original query, it will be used for filtering previous results.
  var q = options.q;
  var results = [];
  while (true) {
    var cached = cache[getQueryKey(options)];
    if (cached) {
      cached = cached.map(getItemFromId);

      // If the current query matches the original query, there is an exact
      // match and there is no need to predict results.
      if (options.q === q) return cached;
      results = results.concat(cached.filter(_.partial(filter, _, q, options)));
    }
    if (!options.q) break;
    options = update(options, {q: {$set: parse(options.q.slice(0, -1))}});
  }
  return _.unique(results).slice(0, options.limit);
};

export var fetch = function (options, cb) {
  var key = getQueryKey(options);
  var cached = cache[getQueryKey(options)] || [];
  var from = cached.length;
  var limit = options.limit || Infinity;
  var size = Math.max(0, Math.min(limit - from, FETCH_SIZE));
  options = _.extend({}, options, {from: from, size: size});
  if (done[key] || !size) return cb(null, true, options);
  live.send('search', options, function (er, res) {
    if (er) return cb(er);
    var items = _.map(res.hits.hits, function (hit) {
      return _.extend({_type: hit._type}, hit._source);
    });
    cacheItems(items, options);
    cb(null, done[key] = items.length < options.size, options);
  });
};
