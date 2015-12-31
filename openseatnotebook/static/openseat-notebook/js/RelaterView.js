define([
  "underscore",
  "../lib/d3/d3",
  "nbextensions/widgets/widgets/js/widget",
  "base/js/events",
  "base/js/namespace",
  "./constants",
  "./mixins"
], function(_, d3, widget, events, IPython, constants, mixins){
  "use strict";
  var RelaterView = widget.DOMWidgetView.extend({
    className: "openseat openseat-relater",

    updateConcept: mixins.updateConcept,
    enterConcept: mixins.enterConcept,
    enterRelationship: mixins.enterRelationship,
    updateRelationship: mixins.updateRelationship,

    book: function(){
      return this.model.get("book");
    },

    render: function(){
      if(!this.model.comm_live){
        return this.remove();
      }

      this.d3 = d3.select(this.el)
        .style({position: "relative"});

      this.table = this.d3.append("table")
        .classed({table: 1, "table-bordered": 1, "table-condensed": 1})
        .call(function(table){
          table.append("thead")
            .append("tr")
            .append("th");
          table.append("tbody");
        });

      this.drag = d3.behavior.drag()
        .on("dragstart", this.dragStart)
        .on("drag", this.dragging)
        .on("dragend", this.dragEnd(this));

      this.listenTo(this.model, "change", this.update);

      _.bindAll(this, "updateConcept", "enterConcept",
                      "enterRelationship", "updateRelationship");

      this.update();
    },

    dragStart: mixins.dragStart,
    dragging: mixins.dragging,
    dragEnd: mixins.dragEnd,

    onConceptDrop: function(view){
      return function(d, targetDatum){
        if(targetDatum.row && targetDatum.col){
          var found = _.find(view.book().get("relationships"), function(rel){
            return rel.get("source") === targetDatum.row &&
                   rel.get("target") === targetDatum.col;
          });
          if(found){
            if(found.get("relation") === view.book().get("no_relation")){
              found.set("relation", d);
              view.update();
            }
          }else{
            view.book().newRelationship({
              source: targetDatum.row,
              target: targetDatum.col,
              relation: d
            });
          }
        }
      };
    },

    update: function(){
      var view = this,
        concepts = this.book().get("concepts"),
        byCid = function(d){ return d.cid; };


      var th = this.table.select("thead tr")
        .selectAll("th:not(:first-child)")
        .data(concepts, byCid)
        .call(function(th){
          th.enter().append("th")
            .append("div")
            .call(view.enterConcept)
            .call(view.updateConcept);

          th.exit().remove();
        });

      th.selectAll(".concept").call(this.updateConcept);

      var tr = this.table.select("tbody")
        .selectAll("tr")
        .data(concepts, byCid)
        .call(function(tr){
          tr.enter().append("tr")
            .append("th")
            .append("div")
            .call(view.enterConcept)
            .call(view.updateConcept);

          tr.exit().remove();
        });

      tr.select("th").select(".concept")
        .call(this.updateConcept);


      var td = tr.selectAll("td")
        .data(function(d){
          return concepts.map(function(col){
            return {
              row: d,
              col: col,
              onConceptDrop: view.onConceptDrop(view)
            };
          });
        })
        .call(function(td){
          td.enter().append("td");
          td.exit().remove();
        });

      var relationships = this.book().get("relationships");

      var rel = td.selectAll(".relationship")
        .data(function(d){
          return relationships.filter(function(rel){
            return rel.get("source") === d.row &&
              rel.get("target") === d.col;
          });
        })
        .call(function(rel){
          rel.enter().append("span")
            .call(view.enterRelationship);
        })
        .call(view.updateRelationship);
    }
  });

  return RelaterView;
});
