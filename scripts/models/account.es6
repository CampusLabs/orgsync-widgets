import Model from 'models/model';

var Account = Model.extend({});

Account.Collection = Model.Collection.extend({
  model: Account
});

export default = Account;
