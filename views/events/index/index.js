//= require ../../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var $ = window.jQuery;
  var _ = window._;
  var jst = window.jst;
  var View = app.View;

  app.selectorViewMap['.js-osw-events-index'] =
  app.EventsIndexView = View.extend({
    template: jst['events/index/index'],

    options: ['communityId', 'portalId', 'events', 'date'],

    classes: [
      'orgsync-widget',
      'js-osw-events-index',
      'osw-events-index'
    ],

    initialize: function () {
      View.prototype.initialize.apply(this, arguments);
      this.$el.append($('<div>').addClass('js-loading'));
    }
  });
})();
