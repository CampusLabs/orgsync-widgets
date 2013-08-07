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
      'change .js-search-input': 'updateQueryFilter'
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
      this.portals.url = this.community.url() + '/portals';
      this.filtered = new app.Portal.Collection();
      this.displayed = new app.Portal.Collection();
      this.filters = {};
      var self = this;
      this.fetch(function (er) {
        if (er) return self.$el.text('Load failed...');
        self.community.set('umbrellas', self.portals.pluck('umbrella'));
        self.community.set('categories', self.portals.pluck('category'));
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
          return {id: model.id, text: model.get('name') || 'Umbrellas'};
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
      _.defer(_.bind(this.updateQueryFilter, this));
    },

    updateQueryFilter: function () {
      var q = this.$('.js-search-input').val();
      var words = _.str.words(q.toLowerCase());
      if (_.isEqual(words, this.lastWords)) return;
      this.lastWords = words;
      this.filters.query = words.length ? q : null;
      this.updateFiltered();
    },

    updateUmbrellaFilter: function () {
      this.updateSelectorFilter('umbrella');
    },

    updateCategoryFilter: function () {
      this.updateSelectorFilter('category');
    },

    updateSelectorFilter: function (key) {
      var id = this.$('.js-' + key + '-selector').select2('val');
      this.filters[key + 'Id'] = id;
      this.updateFiltered();
    },

    updateFiltered: function () {
      var query = this.filters.query;
      var umbrellaId = this.filters.umbrellaId;
      var categoryId = this.filters.categoryId;
      this.filtered.set(
        this.portals.filter(function (portal) {
          return portal.matchesQuery(query) &&
            (!umbrellaId || portal.get('umbrella_id') === umbrellaId) &&
            (!categoryId || portal.get('category_id') === categoryId);
        })
      );
      this.page = 1;
      this.displayed.set(this.filtered.first(this.pageSize));
    },

    nextPage: function () {
      if (this.displayed.length >= this.filtered.length) return false;
      this.displayed.set(this.filtered.first(++this.page * this.pageSize));
      return true;
    },

    listScroll: function (ev) {
      var $el = $(ev.currentTarget);
      var maxScroll = $el.prop('scrollHeight') - $el.height();
      var tolerance = $el.children().first().height() * 2;
      if ($el.scrollTop() >= maxScroll - tolerance) this.nextPage();
    }
  });
})();
