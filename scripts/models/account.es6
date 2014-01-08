import {Model, Collection} from 'models/base';

var Account = Model.extend({});

Account.Collection = Collection.extend({
  model: Account
});

export default = Account;
