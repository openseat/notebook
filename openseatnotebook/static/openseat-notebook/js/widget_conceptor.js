define([
  "underscore",
  "jquery",
  "../lib/d3/d3",
  "nbextensions/widgets/widgets/js/widget",
  "base/js/events",
  "base/js/namespace",
  "./constants",
  "./ConceptBookView",
  "./ClassifierView",
  "./RelaterView",
  "./SystemigramView",
  "./ConceptModel",
  "./RelationshipModel",
  "./RelaterModel",
  "./ClassifierModel",
  "./ConceptBookModel"
], function(
  _, $, d3,
  widget, events, IPython,
  constants,
  ConceptBookView, ClassifierView, RelaterView, SystemigramView,
  ConceptModel, RelationshipModel,
  RelaterModel, ClassifierModel, ConceptBookModel
){
  "use strict";

  function init(){
    d3.select("#notebook-container")
      .classed({"openseat-notebook": 1});

    d3.select("head").selectAll("link[href='" + constants.CSS_URL + "']")
      .data([constants.CSS_URL])
      .enter()
      .append("link")
      .attr({
        rel: "stylesheet",
        href: Object
      });
  }

  return {
    load_ipython_extension: init,
    ConceptModel: ConceptModel,
    RelationshipModel: RelationshipModel,

    ConceptBookModel: ConceptBookModel,
    RelaterModel: RelaterModel,
    ClassifierModel: ClassifierModel,

    RelaterView: RelaterView,
    ConceptBookView: ConceptBookView,
    SystemigramView: SystemigramView,
    ClassifierView: ClassifierView,
  };
});
