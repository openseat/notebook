define([
  "../lib/d3/d3",
  "./constants"
], function(d3, constants){
  "use strict";
  var mixins = {};

  mixins.toggleListen = function(oldModel, newModel, event, fn){
    try{
      var unListened = oldModel && this.stopListening(oldModel);
    } catch(err) {
      // noop
    }
    var listened = newModel && this.listenTo(newModel, "change", fn);
    return this;
  };

  mixins.enterConcept = function(concept){
    var view = this;

    concept.text("")
      .style({opacity: 0})
      .append("i")
      .classed({fa: 1});

    concept.append("span");

    concept.each(function(d){
      var el = d3.select(this);
      view.listenTo(d, "change", function(){
        el.call(view.updateConcept);
      });
    });
  };

  mixins.updateConcept = function(concept){
    var noop = function(){},
      book = this.model.conceptColor ? this.model : this.model.get("book");

    concept
      .classed({hide: 0, concept: 1})
      .transition()
      .style({
        "background-color": function(d){
          return book.conceptColor(d);
        },
        opacity: 1
      });

    concept.select("span")
      .text(function(d){ return d.get("name"); });

    concept.select("i.fa")
      .attr("class", function(d){
        return "fa fa-fw fa-" + (
            book.conceptIcon(d) || constants.ICON_CONCEPT_DEFAULT
        );
      });

    concept.attr({title: function(d){
      return d.get("uri");
    }});
  };

  mixins.enterRelationship = function(relationship){
    var view = this;

    relationship.text("")
      .style({opacity: 0})
      .append("i")
      .classed({fa: 1});

    relationship.append("span");

    relationship.each(function(d){
      var el = d3.select(this);
      view.listenTo(d, "change", function(){
        el.call(view.updateConcept);
      });
      if(!d.get("relation")){
        d.set("relation", view.book().get("no_relation"));
      }else {
        view.listenTo(d.get("relation"), "change", function(){
          el.call(view.updateConcept);
        });
      }
    });
  };

  mixins.updateRelationship = function(relationship){
    var view = this;

    relationship
      .classed({hide: 0, relationship: 1})
      .each(function(d){
        if(!d.get("relation")){
          d.set("relation", view.book().get("no_relation"));
        }
      })
      .transition()
      .style({
        "background-color": function(d){
          return d.get("relation").get("color");
        },
        opacity: 1
      });

    relationship.select("span")
      .text(function(d){ return d.get("relation").get("name"); });

    relationship.select("i.fa")
      .attr("class", function(d){
        return "fa fa-fw fa-" + (
            d.get("relation").get("icon") || constants.ICON_CONCEPT_DEFAULT
        );
      });
  };

  mixins.dragStart = function(d){
    d3.select(this)
      .classed({dragging: 1})
      .transition()
      .style({
        "left": (d3.event.x + 2) + "px",
        "top": (d3.event.y + 2) + "px"
      });
  };

  mixins.dragging = function(d){
    d3.select(this)
      .style({
        "left": (d3.event.x + 2) + "px",
        "top": (d3.event.y + 2) + "px"
      });
  };

  mixins.dragEnd = function(view, callback){
    return function(d){
      var el = d3.select(this)
        .classed({dragging: 0})
        .style({
          "left": null,
          "top": null
        });

      var target = d3.event.sourceEvent.target,
        targetDatum = d3.select(target).datum();

      if(callback && !callback.call(view, d, targetDatum, target)){
        return;
      }

      if(targetDatum && targetDatum.onConceptDrop){
        targetDatum.onConceptDrop(d, targetDatum, target);
      }
    };
  };

  return mixins;
});
