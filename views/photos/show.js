//= require ../view

(function () {
  'use strict';

  var app = window.OrgSyncWidgets;

  var View = app.View;
  var jst = window.jst;

  app.PhotosShowView = View.extend({
    className: 'js-osw-photos-show osw-photos-show',

    template: jst['photos/show']
  });
})();
