HTMLWidgets.widget({

  name: 'clinical_timeline',

  type: 'output',

  factory: function(el, width, height) {

    let instance;

    return {

      renderValue: function(x) {
        x.settings = x.settings || {};
        instance = clinicalTimelines('#' + el.id, x.settings).init(x.data);
      },

      resize: function(width, height) {

      }

    };
  }
});
