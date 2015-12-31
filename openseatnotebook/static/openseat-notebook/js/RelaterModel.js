define([
  "underscore",
  "../lib/d3/d3",
  "nbextensions/widgets/widgets/js/widget",
  "nbextensions/widgets/widgets/js/manager"
], function(_, d3, widget, wm){
  "use strict";

  var RelaterModel = widget.WidgetModel.extend({}, {
    serializers: _.extend({
      book: {deserialize: widget.unpack_models}
    }, widget.WidgetModel.serializers)
  });

  wm.WidgetManager.register_widget_model("RelaterModel", RelaterModel);

  return RelaterModel;
});
