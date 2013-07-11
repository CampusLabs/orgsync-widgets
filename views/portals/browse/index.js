//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var async = window.async;
  var View = app.View;

  app.selectorViewMap['.js-osw-portals-browse'] =
  app.PortalsBrowseView = View.extend({
    template: window.jst['portals/browse/index'],

    page: 1,

    pageSize: 20,

    perPage: 100,

    events: {
      'change .js-umbrella-selector': 'updateUmbrellaFilter',
      'change .js-category-selector': 'updateCategoryFilter',
      'keydown .js-search-input': 'searchKeydown',
      'change .js-search-input': 'updateSearchFilter'
    },

    listeners: {
      portals: {add: 'cacheSearchableWords'}
    },

    initialize: function (options) {
      this.$el.addClass('orgsync-widget osw-portals-browse');
      _.extend(this, _.pick(_.extend({}, this.$el.data(), options),
        'communityId',
        'umbrellaId',
        'categoryId'
      ));
      this.community = new app.Community({id: this.communityId});
      this.portals = this.community.get('portals');
      this.portals.url = this.community.url() + '/orgs';
      this.filtered = new app.Portal.Collection();
      this.displayed = new app.Portal.Collection();
      this.filters = {};
      var self = this;
      this.fetch(function (er) {
        if (er) return self.$el.text('Load failed...');
        self.community.set('umbrellas', self.portals.pluck('umbrella'));
        self.community.set('categories', self.portals.pluck('category'));
        self.portals.each(self.cacheSearchableWords);
        self.render();
      });
    },

    fetch: function (cb) {
      var page = 0;
      var done = false;
      var portals = this.portals;
      var perPage = this.perPage;
      async.doUntil(
        function (cb) {
          portals.fetch({
            remove: false,
            success: function (__, data) {
              if (data.length < perPage) done = true;
              cb();
            },
            error: function (__, er) { cb(er); },
            data: {per_page: perPage, page: ++page}
          });
        },
        function () { return done; },
        cb
      );
    },

    render: function () {
      View.prototype.render.apply(this, arguments);
      this.renderSelectors();
      this.renderPortalList();
      this.updateFiltered();
      return this;
    },

    cacheSearchableWords: function (portal) {
      portal.searchableWords = _.str.words(_.values(
        portal.pick('name', 'short_name', 'keywords')
      ).join(' ').toLowerCase());
    },

    renderSelectors: function () {
      this.renderSelector('umbrella', 'umbrellas');
      this.renderSelector('category', 'categories');
    },

    renderSelector: function (singular, plural) {
      var models = this.community.get(plural);
      var $el = this.$('.js-' + singular + '-selector');
      if (models.length <= 1) return $el.hide();
      $el.select2({
        data: models.map(function (model) {
          return {id: model.id, text: model.get('name')};
        }),
        placeholder: 'Filter by ' + _.str.capitalize(singular),
        minimumResultsForSearch: 5,
        allowClear: true
      });
      var id = this[singular + 'Id'];
      if (!id) return;
      $el.select2('val', id).addClass('js-none');
      this.updateSelectorFilter(singular);
    },

    renderPortalList: function () {
      this.views.portalList = new app.ListView({
        el: this.$('.js-list').scroll(_.bind(this.listScroll, this)),
        collection: this.displayed,
        modelView: app.PortalsBrowseListItemView
      });
    },

    searchKeydown: function () {
      _.defer(_.bind(this.updateSearchFilter, this));
    },

    updateSearchFilter: function () {
      var words = _.str.words(this.$('.js-search-input').val().toLowerCase());
      if (_.isEqual(words, this.lastWords)) return;
      this.lastWords = words;
      if (words.length) {
        this.filters.search = this.portals.reduce(function (map, portal) {
          var match = _.every(words, function (wordA) {
            return _.any(portal.searchableWords, function (wordB) {
              return _.str.startsWith(wordB, wordA);
            });
          });
          if (match) map[portal.id] = portal;
          return map;
        }, {});
      } else {
        delete this.filters.search;
      }
      this.updateFiltered();
    },

    updateUmbrellaFilter: function () {
      this.updateSelectorFilter('umbrella');
    },

    updateCategoryFilter: function () {
      this.updateSelectorFilter('category');
    },

    updateSelectorFilter: function (singular) {
      var id = this.$('.js-' + singular + '-selector').select2('val');
      if (id) {
        this.filters[singular] = this.portals.reduce(function (map, portal) {
          if (portal.get(singular + '_id') === id) map[portal.id] = portal;
          return map;
        }, {});
      } else {
        delete this.filters[singular];
      }
      this.updateFiltered();
    },

    updateFiltered: function () {
      this.filtered.set(
        _.size(this.filters) ?
        this.intersection(_.values(this.filters)) :
        this.portals.models
      );
      this.page = 1;
      this.displayed.set(this.filtered.first(this.pageSize));
    },

    nextPage: function () {
      if (this.displayed.length >= this.filtered.length) return false;
      this.displayed.set(this.filtered.first(++this.page * this.pageSize));
      return true;
    },

    intersection: function (maps) {
      var first = maps[0];
      var rest = maps.slice(1);
      return _.filter(first, function (__, key) {
        return _.all(rest, function (other) { return _.has(other, key); });
      });
    },

    listScroll: function (ev) {
      var $el = $(ev.currentTarget);
      var maxScroll = $el.prop('scrollHeight') - $el.height();
      var tolerance = $el.children().first().height() * 2;
      if ($el.scrollTop() >= maxScroll - tolerance) this.nextPage();
    }
  });
})();
