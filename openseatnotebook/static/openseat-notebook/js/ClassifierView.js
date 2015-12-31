define([
  "underscore",
  "../lib/d3/d3",
  "nbextensions/widgets/widgets/js/widget",
  "base/js/events",
  "base/js/namespace",
  "./constants",
  "./mixins"
], function(_, d3, widget, events, IPython, constants, mixins){
  var ClassifierView = widget.DOMWidgetView.extend({
    className: "openseat openseat-classifier",

    toggleListen: mixins.toggleListen,
    updateConcept: mixins.updateConcept,
    enterConcept: mixins.enterConcept,

    render: function(){
      if(!this.model.comm_live){
        return this.remove();
      }
      this.d3 = d3.select(this.el)
        .style({position: "relative"});

      this.grid = this.d3.append("table")
        .classed({grid: 1, table: 1, "table-bordered": 1});

      this.grid.append("thead").append("tr").append("td");
      this.grid.append("tbody");

      this.drag = d3.behavior.drag()
        .on("dragstart", this.dragStart)
        .on("drag", this.dragging)
        .on("dragend", this.dragEnd(this));

      _.bindAll(this, "updateConcept", "enterConcept", "draggableConcept", "update");

      _.defer(this.update);
    },

    dragStart: mixins.dragStart,
    dragging: mixins.dragging,
    dragEnd: mixins.dragEnd,

    draggableConcept: function(concept){
      concept.enter()
        .append("span")
        .classed({concept: 1})
        .call(this.enterConcept)
        .call(this.drag);

      concept
        .call(this.updateConcept);

      concept.exit().remove();
    },

    onConceptDrop: function(view){
      return function(d, targetDatum, target){
        var cprop = view.model.get("column_property"),
          rprop = view.model.get("row_property"),
          changed = null,
          props = d.get("properties")
            .filter(function(d){
              return [cprop, rprop].indexOf(d.predicate) == -1;
            });

        if(targetDatum && targetDatum.col && targetDatum.row){
          props = props.concat([
            {predicate: cprop, object: targetDatum.col},
            {predicate: rprop, object: targetDatum.row},
          ]);

          changed = {
            properties: props.slice()
          };
        }else{
          console.log("what is this?", target, targetDatum);
        }

        if(changed){
          d.set(changed);
          d.save_changes(view.callbacks());
          _.defer(function(){
            view.update();
          });
        }
      };
    },

    update: function(){
      var view = this,
        rows = this.model.get("rows"),
        columns = this.model.get("columns"),
        concepts = this.model.get("book").get("concepts");

      this.grid.select("thead tr")
        .selectAll("th")
        .data(columns)
      .enter()
        .append("th")
        .text(function(d){ return d.get("name"); });

      var tr = this.grid.select("tbody").selectAll("tr")
        .data(rows)
        .call(function(row){
          row.enter().append("tr")
            .append("th")
            .text(function(d){ return d.get("name"); });
          row.exit().remove();
        });

      var td = tr.selectAll("td")
        .data(function(row){
          return columns.map(function(col){
            return {
              row: row,
              col: col,
              onConceptDrop: view.onConceptDrop(view)
            };
          });
        })
        .call(function(col){
          col.enter().append("td")
            .classed({col: 1});
          col.exit().remove();
        });

      var concept = td.selectAll(".concept")
        .data(function(d){
          return concepts.filter(function(concept){
            var props = concept.get("properties"),
              cprop = view.model.get("column_property"),
              rprop = view.model.get("row_property");

            return props.filter(function(prop){
              return (prop.predicate === cprop) &&
                  (prop.object === d.col) ||
                  (prop.object["@id"] === d.col.get("uri"));
              }).length && props.filter(function(prop){
                return (prop.predicate === rprop) &&
                  (prop.object === d.row) ||
                  (prop.object["@id"] === d.row.get("uri"));
              }).length;
          });
        });

      concept.call(this.draggableConcept);
    }
  });

  return ClassifierView;
});
