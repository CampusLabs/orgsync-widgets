module Base from 'entities/base';

var Model = Base.Model.extend({
  defaultPicture: 'https://orgsync.com/assets/profile_blank_64.gif',

  picture: function () {
    return this.get('picture_url') || this.defaultPicture;
  }
});

var Collection = Base.Collection.extend({
  model: Model
});

export {Model, Collection};
