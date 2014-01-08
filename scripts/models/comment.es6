import {Model, Collection} from 'models/base';
import moment from 'moment';

var Comment = Model.extend({
  relations: {
    'creator': {hasOne: 'account', fk: 'creator_id'}
  },

  time: function () {
    return moment(this.get('created_at')).fromNow();
  },
});

Comment.Collection = Collection.extend({
  model: Comment
});

export default = Comment;
