import Model from 'models/model';
import moment from 'moment';

var Comment = Model.extend({
  relations: {
    'creator': {hasOne: 'account', fk: 'creator_id'}
  },

  time: function () {
    return moment(this.get('created_at')).fromNow();
  },
});

Comment.Collection = Model.Collection.extend({
  model: Comment
});

export default = Comment;
