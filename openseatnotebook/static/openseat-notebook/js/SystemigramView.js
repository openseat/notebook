define([
  "underscore",
  "../lib/d3/d3",
  "../lib/webcola/WebCola/cola",
  "nbextensions/widgets/widgets/js/widget",
  "base/js/events",
  "base/js/namespace",
  "./constants",
  "./mixins"
], function(_, d3, webcola, widget, events, IPython, constants, mixins){

  var SystemigramView = widget.DOMWidgetView.extend({
    className: "openseat openseat-systemigram",

    render: function(){
      if(!this.model.comm_live){
        return this.remove();
      }
      this.d3 = d3.select(this.el);
      this.svg = this.d3.append("svg");

      this.defs = this.svg.append("defs")
        .append("marker")
          .attr({
            id: "systemigram-end-arrow",
            viewBox: "0 -5 10 10",
            refX: 12,
            markerWidth: 15,
            markerHeight: 4,
            orient: "auto"
          })
        .append("path")
          .attr({
            d: "M0,-5L15,0L0,5L0,0",
          });

      this.regions = this.svg.append("g").classed({regions: 1});

      this.links = this.svg.append("g").classed({links: 1});
      this.nodes = this.svg.append("g").classed({nodes: 1});


      _.bindAll(this, "update");

      _.defer(this.update);
    },

    arrowId: function(){
      return 'end-arrow-' + this.cid;
    },

    relationshipGraph: function(){
      var view = this;

      var noRelation = view.model.get("no_relation");

      var concepts = this.model.get("concepts"),
        relationships = this.model.get("relationships")
          .map(function(rel){
            if(!rel.get("relation")){
              rel.set("relation", noRelation);
            }
            return rel;
          });


      // nodes for concepts
      var nodes = concepts.map(function(concept){
        return {
          width: 60,
          height: 60,
          original: concept,
          is_concept: true
        };
      });

      var links = [];

      // nodes for relationships
      relationships.map(function(rel){
        var i = nodes.length,
          label = {
            width: 60,
            height: 60,
            original: rel
          },
          synth = {
            width: 60,
            height: 60
          };

        nodes.push(label);
        nodes.push(synth);

        var inlink = {
          source: nodes[concepts.indexOf(rel.get("source"))],
          target: synth,
          original: rel
        };

        links.push(inlink);

        links.push({
          source: synth,
          target: nodes[concepts.indexOf(rel.get("target"))],
          original: rel,
          inlink: inlink
        });

        links.push({
          source: synth,
          target: label,
          original: rel,
          linkDistance: 10
        });
      });

      return {
        links: links,
        nodes: nodes
      };
    },

    tick: function(link, label, node, rect, graph){
      var view = this,
        pad = 10,
        makeEdge = cola.vpsc.makeEdgeBetween,
        noRelation = this.model.get("no_relation");



      var path = d3.svg.line()
        .x(function(d){ return d.x; })
        .y(function(d){ return d.y; })
        .interpolate("basis");

      var getName = function (d) {
        if(!d.original){ return; }

        var concept = d.is_concept ? d.original : d.original.get("relation");

        if(concept !== noRelation){
          return concept.get("name");
        }
      };

      return function(){
        label
          .text(getName)
          .each(function(d){
            var bb = this.getBBox();
            d.height = bb.height + (2 * pad);
            d.width = bb.width + (2 * pad);
          });

        rect
          .attr({
            width: function (d) { return d.width; },
            height: function (d) { return d.height; },
            transform: function(d){
              return "translate(" + [ d.width / -2, d.height / -2] + ")";
            }
          })
          .style({
            fill: function (d) { return d.original.get("color"); }
          });

        node.each(function(d){
          d.innerBounds = d.bounds.inflate(2);
        });

        graph.links.forEach(function(d){
          makeEdge(d, d.source.bounds, d.target.innerBounds, 5);
        });

        link
          .attr({
            d: function (d) {
              return path([
                d.inlink.sourceIntersection,
                d.source,
                d.targetIntersection
              ]);
            }
          })
          .style({
            stroke: function(d){
              return d3.rgb(d.original.get("relation").get("color")).darker();
            }
          });

        node.attr({
          transform: function(d){
            return "translate(" + [d.x, d.y] + ")";
          }
        });
      };
    },

    update: function(){
      var view = this;

      var graph = this.relationshipGraph();

      if(this.cola){
        this.cola.stop();
      }

      var linkDistance = view.model.get("link_distance");

      this.cola = cola.d3adaptor()
        .linkDistance(function(d){
          return d.linkDistance || linkDistance;
        })
        .avoidOverlaps(this.model.get("avoid_overlaps"))
        .handleDisconnected(this.model.get("handle_disconnected"))
        .size([this.model.get("width"), this.model.get("height")])
        .links(graph.links)
        .nodes(graph.nodes)
        .start();

      this.svg.attr({
        width: this.model.get("width"),
        height: this.model.get("height")
      });

      var node = this.nodes.selectAll(".node")
        .data(graph.nodes)
        .call(function(node){
          node.exit().remove();

          node = node
            .enter().append("g")
              .classed({node: 1, concept: function(d){
                return d.is_concept;
              }});

          node.append("text")
            .classed({"node-label": 1})
            .attr({
              "text-anchor": "middle",
              dy: ".35em"
            });

          node
            .filter(function(d){
              return d.is_concept;
            })
            .insert("rect", ":first-child")
            .attr({
              rx: 5,
              ry: 5
            });
        });

      node.call(view.cola.drag);

      var label = node.select(".node-label");

      var rect = node.select("rect");

      // only make paths for the target
      var link = this.links.selectAll(".link")
        .data(graph.links.filter(function(d){ return d.inlink; }))
        .call(function(link){
          link.exit().remove();
          link.enter().append("path")
            .classed({link: 1});
        });

      this.cola.on("tick", this.tick(link, label, node, rect, graph));
    }
  });

  return SystemigramView;
});
