(function () {
  'use strict';

  var _ = window.OrgSyncWidgets._;

  var AlbumsBrowseListItemView = window.OrgSyncWidgets.AlbumsBrowseListItemView;
  var render = AlbumsBrowseListItemView.prototype.render;


  AlbumsBrowseListItemView.prototype.render = function () {
    render.apply(this, arguments);
    var $img = this.$('img');
    this.$el.append(_.times(3, _.bind($img.clone, $img)));
    return this;
  };
})();
