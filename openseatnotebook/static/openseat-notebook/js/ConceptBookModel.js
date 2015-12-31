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

  var ConceptBookModel = widget.WidgetModel.extend({
    ldKeys: {
      concepts: "openseat:definesConcept",
      relationships: "openseat:definesRelationship",
    },

    byURI: function(uri){
      if(!this._uriRegistry){
        this.updateRegistry();
      }
      return this._uriRegistry[uri];
    },

    updateRegistry: function(){
      var that = this;
      this._uriRegistry = this._uriRegistry || {};
      var promises = _.map(this.widget_manager._models, function(p){
        p.then(function(model){
          that._uriRegistry[model.get("uri")] = model;
        });
      });
    },

    ensureNoRelation: function(){
      var that = this;

      if(this.get("no_relation")){
        return Promise.resolve(this.get("no_relation"));
      }

      return this.createConceptModel()
        .then(function(model){
          model.set({
            name: "NoRelation",
            uri: "openseat:norelation"
          });
          that.set("no_relation", model);
          return model;
        });
    },

    createConceptModel: function(){
      return this.widget_manager.new_widget({
        model_name: "ConceptModel",
        model_module: "nbextensions/openseat-notebook/js/widget_openseat",
        widget_class: "openseatnotebook.widgets.Concept"
      });
    },

    createRelationshipModel: function(){
      return this.widget_manager.new_widget({
        model_name: "RelationshipModel",
        model_module: "nbextensions/openseat-notebook/js/widget_openseat",
        widget_class: "openseatnotebook.widgets.Relationship"
      });
    },

    newConcept: function(props){
      var that = this,
        pending = that._pendingConcepts || (that._pendingConcepts = {}),
        existing = _.find(this.get("concepts"), function(concept){
          return concept.get("uri") === props.uri;
        });

      if(existing){
        return new Promise(function(resolve){
          resolve(existing);
        });
      }

      if(pending[props.uri]){
        return pending[props.uri];
      }

      // TODO: this is a leak... but how bad?
      pending[props.uri] = this.createConceptModel()
        .then(function(model){
          model.set(props);
          that.set("concepts", [].concat(that.get("concepts"), [model]));
          that.save_changes(that.callbacks());
          return model;
        });

      return pending[props.uri];
    },

    newRelationship: function(props){
      var that = this,
        pending = this._pendingRels || (that._pendingRels = []),
        existing = _.find(this.get("relationships"), function(rel){
          return rel.get("source") === props.source &&
            rel.get("target") === props.target;
        });

      if(existing){
        return new Promise(function(resolve){ _.defer(resolve, existing); });
      }

      var isPending = _.find(pending, function(rel){
          return rel.props.source === props.source &&
            rel.props.target === props.target;
        });

      if(isPending){
        return isPending.promise;
      }

      var noRelation = this.get("no_relation");

      // TODO: this is a leak... but how bad?
      var promise = this.createRelationshipModel()
        .then(function(model){
          if(!("relation" in props)){
            props.relation = noRelation;
          }
          model.set(props);

          that.set("relationships",
            [].concat(that.get("relationships"), [model])
          );

          that.save_changes(that.callbacks());

          return model;
        });

      pending.push({
        props: props,
        promise: promise
      });

      return promise;
    },

    load_concept: function(concept, delayed){
      var that = this;

      return this.createConceptModel()
        .then(function(model){
          model.set({
            uri: concept["@id"],
            name: concept.name
          });

          model.save_changes();

          if(!delayed){
            that.set("concepts",
              [].concat(that.get("concepts"), [model])
            );
          }

          return model;
        });
    },

    load_relationship: function(rel, delayed){
      var that = this,
        noRelation = this.get("no_relation");

      function cById(id){
        if(id === noRelation.get("uri")){
          return noRelation;
        }
        return _.find(that.get("concepts"), function(c){
          return c.get("uri") === id;
        });
      }

      // TODO: this is a leak... but how bad?
      return this.createRelationshipModel()
        .then(function(model){
          model.set({
            source: cById(rel.source),
            target: cById(rel.target),
            relation: cById(rel.relation)
          });

          model.save_changes();

          if(!delayed){
            that.set("relationships",
              [].concat(that.get("relationships"), [model])
            );
          }

          return model;
        });
    },

    updateMeta: function(){
      if(!this.comm_live){
        return;
      }
      return this.toLinkedData()
        .then(function(ld){
          // add in the app context
          ld["@context"] = _.extend(
            {
              "@base": window.location.href,
              "@vocab": window.location.href
            },
            context(),
            ld["@context"]
          );

          IPython.notebook.metadata.openseat = ld;
        });
    },

    annotate_concept: function(concept, ld, conceptMap){
      var props = _.reduce(ld, function(memo, value, key){
        switch(key){
          case "@id":
          case "name":
            break;
          case "@type":
          case "rdf:type":
            memo = memo.concat(_.without(value, "openseat:Concept")
              .map(function(type){
                return {
                  predicate: "rdf:type",
                  object: {
                    "@id": type
                  }
                };
              }));
            break;
          default:
            memo = memo.concat({
              predicate: key,
              object: value
            });
        }
        return memo;
      },[]);

      concept.set("properties", props);
      concept.save_changes();
    },

    loadMeta: function(){
      var that = this,
        md = IPython.notebook.metadata.openseat;

      if(!md){
        return Promise.resolve(null);
      }

      var concepts = this.ensureNoRelation()
        .then(function(no_relation){
          return Promise.all(md.concepts.map(function(concept){
            return that.load_concept(concept, false);
          }));
        })
        .then(function(concepts){
          var conceptMap = _.indexBy(concepts,
            function(c){ return c.get("uri");
          });

          md.concepts.map(function(ld){
            that.annotate_concept(conceptMap[ld["@id"]], ld, conceptMap);
          });

          that.set({concepts: concepts});
          return concepts;
        });

      var relationships = concepts.then(function(concepts){
          return Promise.all(md.relationships.map(function(relationship){
            return that.load_relationship(relationship, false);
          }));
        })
        .then(function(relationships){
          that.set({relationships: relationships});
          return true;
        });

      return Promise.all([relationships])
        .then(function(){
          console.log("everything loaded!");
          that.save_changes();
          that.updateRegistry();
        })
        .catch(function(reason){
          console.warn("Some problem", reason);
          return false;
        });
    },

    conceptMark: function(markName, concept){
      var model = this,
        markProp = this.get(markName + "_prop_uri");

      function getNext(concept){
        if(!concept.get && concept["@id"]){
          concept = model.byURI(concept["@id"]);
        }

        var triple = concept && concept.get && _.find(concept.get("properties"),
          function(prop){
            return prop.predicate === markProp ||
              (prop.predicate.get && prop.predicate.get("uri") === markProp);
          });
        var obj = triple && triple.object;
        if(!obj){
          return;
        }

        if(obj["@id"]){
          obj = model.byURI(obj["@id"]);
        }

        return obj;
      }

      var current = null,
        next = concept,
        mark = null;

      while(!mark && next){
        current = next;
        next = getNext(current);
        mark = current && current.get && current.get(markName);
      }

      return mark;
    },

    conceptColor: function(concept){
      return this.conceptMark("color", concept);
    },

    conceptIcon: function(concept){
      return this.conceptMark("icon", concept);
    },

    toLinkedData: function(){
      var that = this,
        ctx = {},
        node = {
          "@context": ctx,
          "@id": window.location.href
        };

      return Promise.all(_.map(this.ldKeys, function(uri, prefix){
        ctx[prefix] = uri;
        return Promise.all(_.invoke(that.get(prefix), "toLinkedData"))
          .then(function(items){
            var node = {};
            node[prefix] = items;
            return node;
          });
      }))
      .then(function(bits){
        return _.extend.apply(null, bits.concat(node));
      });
    }
  }, {
    serializers: _.extend({
      concepts: {deserialize: widget.unpack_models},
      relationships: {deserialize: widget.unpack_models},
      no_relation: {deserialize: widget.unpack_models}
    }, widget.WidgetModel.serializers)
  });


  wm.WidgetManager.register_widget_model(
    "ConceptBookModel", ConceptBookModel);

  return ConceptBookModel;
});
