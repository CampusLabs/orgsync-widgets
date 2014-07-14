import _ from 'underscore';
import Base from 'entities/base';
import Account from 'entities/account';
import Album from 'entities/album';
import Category from 'entities/category';
import NewsPost from 'entities/news-post';
import Event from 'entities/event';

var Model = Base.Model.extend({
  relations: {
    umbrella: {hasOne: __exports__, fk: 'umbrella_id'},
    category: {hasOne: Category, fk: 'category_id'},
    albums: {hasMany: Album, fk: 'portal_id'},
    newsPosts: {hasMany: NewsPost, fk: 'portal_id', urlRoot: '/news'},
    accounts: {hasMany: Account, fk: 'portal_id', urlRoot: '/people'}
  },

  defaultPicture: 'https://orgsync.com/assets/no_org_profile_150.png',

  urlRoot: '/portals',

  picture: function () {
    return this.get('picture_url') || this.defaultPicture;
  },

  isUmbrella: function () {
    var id = this.get('umbrella').id;
    return !id || id === this.id;
  },

  umbrellaName: function () {
    return this.isUmbrella() ? 'Umbrella' : this.get('umbrella').get('name');
  }
});

var Collection = Base.Collection.extend({
  model: Model,

  url: '/portals',

  comparator: function (a, b) {
    var aName = (a.get('name') || '').toLowerCase();
    var bName = (b.get('name') || '').toLowerCase();
    var aIsUmbrella = a.isUmbrella();
    var bIsUmbrella = b.isUmbrella();
    if (aIsUmbrella === bIsUmbrella) return aName < bName ? -1 : 1;
    return aIsUmbrella ? -1 : 1;
  }
});

export {Model, Collection};
