import BaseView from 'views/base';
import CommentsShowTemplate from 'jst/comments/show';

export default BaseView.extend({
  template: CommentsShowTemplate,

  classes: [
    'orgsync-widget',
    'js-osw-comments-show',
    'osw-comments-show'
  ],

  toTemplate: function () {
    var model = this.model;
    var creator = model.get('creator');
    return {
      avatar: creator.get('picture_url'),
      name: creator.get('display_name'),
      time: model.time(),
      content: model.get('content')
    };
  }
});
