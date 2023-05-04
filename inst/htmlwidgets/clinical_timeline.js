HTMLWidgets.widget({

  name: 'clinical_timeline',

  type: 'output',

  factory: function(el, width, height) {

    let instance;

    return {

      renderValue: function(x) {
        console.log(x);

        instance = clinicalTimelines('#' + el.id, {}).init(x.data);

      },

      resize: function(width, height) {

      }

    };
  }
});
