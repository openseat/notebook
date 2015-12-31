define([
  "underscore",
  "../lib/d3/d3",
  "nbextensions/widgets/widgets/js/widget",
  "nbextensions/widgets/widgets/js/manager"
], function(_, d3, widget, wm){
  "use strict";

  var RelationshipModel = widget.WidgetModel.extend({
    toLinkedData: function(){
      return Promise.resolve({
        "@type": ["openseat-notebook:Relationship"],
        "source": this.get("source").get("uri"),
        "target": this.get("target").get("uri"),
        "relation": this.get("relation").get("uri")
      });
    }
  }, {
    serializers: _.extend({
      source: {deserialize: widget.unpack_models},
      target: {deserialize: widget.unpack_models},
      relation: {deserialize: widget.unpack_models}
    }, widget.WidgetModel.serializers)
  });

  wm.WidgetManager.register_widget_model(
    "RelationshipModel", RelationshipModel);

  return RelationshipModel;
});
