import _ from "underscore";
import $ from "jquery";
import d3 from "d3";

import {Model} from "backbone";

import {WidgetView} from "nbextensions/widgets/widgets/js/widget";
import events from "base/js/events";
import Jupyter from "base/js/namespace";

import constants from "./constants";
import mixins from "./mixins";

let inkscape = "http://www.inkscape.org/namespaces/inkscape",
  sodipodi: "http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd";

_.extend(d3.ns.prefix, {inkscape, sodipodi});

export class ConceptBookView extends WidgetView {

}

define([
  "underscore",
  "jquery",
  "../lib/d3/d3",
  "backbone",
  "nbextensions/widgets/widgets/js/widget",
  "base/js/events",
  "base/js/namespace",
  "./constants",
  "./mixins",
], function(_, $, d3, Backbone, widget, events, IPython, constants, mixins){
  "use strict";

  _.extend(d3.ns.prefix, {
    inkscape: "http://www.inkscape.org/namespaces/inkscape",
    sodipodi: "http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
  });

  var ConceptBookView = widget.WidgetView.extend({
    className: "openseat widget-concept-book",

    toggleListen: mixins.toggleListen,
    updateConcept: mixins.updateConcept,
    enterConcept: mixins.enterConcept,
    dragStart: mixins.dragStart,
    dragging: mixins.dragging,
    dragEnd: mixins.dragEnd,

    render: function(){
      if(!this.model.comm_live){
        return this.remove();
      }
      var view = this;

      this.d3 = d3.select(this.el);

      _.bindAll(this,
        "conceptMap",
        "draggableConcept",
        "enterConcept",
        "initConcept",
        "onMarkdown",
        "processAllCells",
        "update",
        "updateConcept",
        "updateMarkdownConcept"
      );

      events.on("before_save.Notebook",
        _.bind(this.model.updateMeta, this.model));

      this.viewModel = new Backbone.Model({
        docked: false,
        expanded: false
      });
      this.listenTo(this.viewModel, "change", this.update);

      this.drag = d3.behavior.drag()
        .on("dragstart", this.dragStart)
        .on("drag", this.dragging)
        .on("dragend", this.dragEnd(this));

      this.displayed.then(function(){
        view.initToolbar();
        view.initLoading();
        view.initBank();
      });
    },

    initBank: function(){
      this.bank = this.d3.append("div")
        .classed({bank: 1, well: 1});
    },

    initToolbar: function(){
      var that = this;

      this.toolbar = this.d3.append("div")
        .classed({"btn-toolbar": 1, "pull-right": 1});

      this.viewGroup = this.toolbar.append("div")
        .classed({"btn-group": 1, "btn-group-xs": 1})
        .selectAll(".btn")
        .data(d3.entries({
          docked: {
            label: ["Dock", "Undock"],
            icon: ["caret-square-o-down", "angle-double-up"]
          },
          expanded: {
            label: ["Expand", "Collapse"],
            icon: ["chevron-down", "chevron-up"]
          }
        }))
      .enter()
        .append("button")
        .classed({btn: 1, "btn-default": 1})
        .call(function(btn){
          btn.append("i").classed({fa: 1});
          btn.append("span");
        })
        .on("click", function(d){
          that.viewModel.set(d.key, !that.viewModel.get(d.key));
        });
    },

    initLoading: function(){
      var that = this;
      var loading = $("<div/>").append(
        $("<span/>").text("Loading Concepts from Metadata..."),
        $("<div/>", {"class": "progress"}).append(
        $("<div/>", {"class": "progress-bar progress-bar-striped active"})
          .css({width: "100%"}))
        );

      loading.appendTo(this.$el);

      this._load_meta_lock = this.model.loadMeta()
        .then(function(){
          loading
            .addClass("text-muted")
            .text([
              that.model.get("concepts").length,
              "Concepts &",
              that.model.get("relationships").length,
              "Relationships Loaded"
            ].join(" "));
          events.on("rendered.MarkdownCell", that.onMarkdown);
          that.processAllCells();

          // TODO: better UI
          that._load_meta_lock = null;
        });
    },

    remove: function(){
      d3.selectAll(".rendered_html .concept")
        .each(function(){
          var link = d3.select(this),
            label = link.select("span").text();

          link.text(label)
            .classed({concept: 0});
        });
    },

    getCells: function(){
      return IPython.notebook.get_cells()
        .filter(function(cell){
          return cell.cell_type === "markdown";
        });
    },

    processAllCells: function(){
      var view = this;
      this.getCells()
        .map(function(cell){
          view.onMarkdown(null, {cell: cell});
        });
    },

    onMarkdown: function(evt, data){
      var view = this,
        cell = d3.select(data.cell.element[0]);

      this.markdownCellLinks(cell);

      _.delay(function(){
        view.markdownCellSVG(cell);
      }, 1000);
    },

    updateMarkdownConcept: function(concept){
      concept
        .transition()
        .style("background-color", function(d){
          return d && d.get ? d.get("color") : null;
        });

      concept.select(".concept-name")
        .text(function(d){ return d.get("name"); });

      concept.select("i.fa")
        .attr("class", function(d){
          var cls = "fa fa-fw";
          if(d && d.get){
            cls += " fa-" + (d.get("icon") || constants.ICON_CONCEPT_DEFAULT);
          }
          return cls;
        });
    },

    initConcept: function(link){
      var view = this;
      link
        .classed({concept: 1, "concept-pending": 0})
        .text(null)
        .call(function(cell){
          cell.append("i")
            .classed({fa: 1, "fa-fw": 1});
          cell.append("span")
            .classed({"concept-name": 1})
            .text(function(d){ return d.get("name"); });
        })
        .each(function(d){
          view.listenTo(d, "change", view.update);
        });
    },

    markdownCellLinks: function(cell){
      var view = this;

      var link = cell
        .selectAll("a:not(.anchor-link):not(.concept):not(.concept-pending)")
        .each(function(d){
          var concept = d3.select(this);

          var name = concept.text(),
            uri = concept.attr("href");

          if(!uri){
            uri = "#" + name;
            concept.attr("href", uri);
          }

          view.model.newConcept({uri: uri, name: name})
            .then(function(model){
              concept.datum(model)
                .call(view.initConcept)
                .call(view.updateMarkdownConcept);
            });
        })
        .on("click", function(){
          d3.event.preventDefault();
        });

      // finally, do the cll updates
      cell.selectAll(".concept").call(this.updateMarkdownConcept);

      return this;
    },

    conceptMap: function(){
      return this.model.get("concepts")
        .reduce(function(m, d){
          m[d.get("uri")] = d;
          return m;
        }, {});
    },

    markdownCellSVG: function(cell){
      /*
        parse all svg images, and add their concepts
        TODO: relationships!
      */
      var view = this;

      var noRelation = view.model.get("no_relation");

      if(!noRelation){
        return _.defer(function(){ view.markdownCellSVG(cell); });
      }

      cell.selectAll("img[src*='svg']:not(.openseat-whiteboard)")
        .each(function(d){
          var img = d3.select(this)
              .classed({"openseat-whiteboard": 1}),
            src = img.attr("src")
              .replace(constants.HASH_URL_FRAG, "#" + (+new Date()));

          img.transition().style({opacity: 0.5});

          d3.xml(src, function(xml){
            var svg = d3.select(xml);
            // update for cache
            img.attr({src: src})
              .transition().style({opacity: 1.0});

            // find text in groups
            svg.selectAll("g:not([*|groupmode]) > text")
              .each(function(){
                view.gToConcept(d3.select(this.parentNode));
              });

            svg.selectAll("[*|connection-start][*|connection-start]")
              .each(function(){
                var el = d3.select(this),
                  xStart = svg.select(el.attr("inkscape:connection-start")),
                  xEnd = svg.select(el.attr("inkscape:connection-end"));

                var src, tgt;

                view.gToConcept(xStart)
                  .then(function(_src){
                    src = _src;
                    return view.gToConcept(xEnd);
                  })
                  .then(function(tgt){
                    view.model.newRelationship({
                      source: src,
                      target: tgt
                    });
                  });

              });
          });
        });
      return this;
    },

    gToConcept: function(el){
      var name = el.selectAll("tspan")[0]
          .map(function(d){ return d.textContent; })
          .join(" "),
        title = el.select("title"),
        uri = title.node() && title.text();

      if(!uri){
        // naming things hard... see if an concept has this name
        var byName = _.find(this.model.get("concepts"), function(concept){
          return concept.get("name") === name;
        });
        uri = (byName && byName.get("uri")) || "#" + name;
      }

      return this.model.newConcept({uri: uri, name: name});
    },

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


    onConceptDrop: function(d, target, targetDatum){
      console.log("dropped!", d, target, targetDatum);
    },

    update: function(){
      var view = this;

      if(!this._load_meta_lock){
        this.processAllCells();
      }

      // these are the buttons
      this.viewGroup.each(function(d){
        var val = view.viewModel.get(d.key),
          el = d3.select(this);

        // update the wrapper
        view.d3.classed(d.key, val);

        el.select(".fa")
          .classed("fa-" + d.value.icon[0], !val)
          .classed("fa-" + d.value.icon[1], val);

        el.select("span")
          .text(" " + d.value.label[+val]);
      });


      var concepts = this.model.get("concepts");

      this.bank.selectAll(".concept")
        .data(concepts)
        .call(this.draggableConcept);
    }
  // end of view class
  });

  return ConceptBookView;
});
