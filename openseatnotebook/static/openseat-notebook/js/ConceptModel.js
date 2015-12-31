define([
  "underscore",
  "../lib/d3/d3",
  "nbextensions/widgets/widgets/js/widget",
  "nbextensions/widgets/widgets/js/manager",
  "base/js/events",
  "base/js/namespace",
  "./constants",
  "./mixins",
], function(_, d3, widget, wm, events, IPython, constants, mixins){
  "use strict";

  var ConceptModel = widget.WidgetModel.extend({
    _deipy_model: function(obj){
      if(typeof obj === "string" && obj.indexOf("IPY_MODEL_") === 0){
        return IPython.notebook.kernel.widget_manager.get_model(obj.slice(10));
      }

      return Promise.resolve(obj);
    },

    _propToLinkedData: function(prop, node){
      return this._deipy_model(prop.object)
        .then(function(obj){
          var uri = obj["@id"] || (obj.get && obj.get("uri"));

          switch(prop.predicate){
            case "@type":
            case "rdf:type":
              node["@type"].push(uri);
              break;
            default:
              if(uri){
                node[prop.predicate] = {"@id": uri};
              }else{
                node[prop.predicate] = obj;
              }
          }
        });
    },

    toLinkedData: function(){
      var that = this,
        node = {
          "@id": this.get("uri"),
          "@type": ["openseat:Concept"],
          "name": this.get("name")
        };
      return Promise.all(this.get("properties").map(function(prop){
        that._propToLinkedData(prop, node);
      }))
      .then(function(){
        return node;
      });
    }
  });


  wm.WidgetManager.register_widget_model(
    "ConceptModel", ConceptModel);

  return ConceptModel;
});
