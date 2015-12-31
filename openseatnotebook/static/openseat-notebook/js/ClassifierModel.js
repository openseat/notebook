define([
  "underscore",
  "../lib/d3/d3",
  "nbextensions/widgets/widgets/js/widget",
  "nbextensions/widgets/widgets/js/manager",
  "base/js/events",
  "base/js/namespace",
  "./constants",
  "./mixins",
  "./context"
], function(_, d3, widget, wm, events, IPython,
            constants, mixins, context){
  "use strict";

  var ClassifierModel = widget.WidgetModel.extend({}, {
    serializers: _.extend({
      book: {deserialize: widget.unpack_models},
      rows: {deserialize: widget.unpack_models},
      columns: {deserialize: widget.unpack_models}
    }, widget.WidgetModel.serializers),
  });

  wm.WidgetManager.register_widget_model("ClassifierModel", ClassifierModel);

  return ClassifierModel;
});
