import {Model, Collection} from 'entities/base';
import moment from 'moment-timezone';

import Base from 'entities/base';
import Account from 'entities/account';

var Model = Base.Model.extend({
  relations: {
    creator: {hasOne: Account, fk: 'creator_id'}
  },

  time: function () {
    return moment(this.get('created_at')).fromNow();
  }
});

var Collection = Base.Collection.extend({
  model: Model
});

export {Model, Collection};
