define([], function(){
  function context(){
    return {
      "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
      "xsd": "http://www.w3.org/2001/XMLSchema#",
      "openseat": "https://openseat.github.io/openseat#",
      "name": "rdfs:label",
      "description": "rdfs:comment"
    };
  }

  return context;
});
