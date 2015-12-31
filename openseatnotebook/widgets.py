import time

from traitlets import (
    CBool,
    CInt,
    Instance,
    Tuple,
    Unicode,
    link,
    HasTraits,
)

from ipywidgets import widgets
from ipywidgets.widgets import widget_serialization


class Updater(HasTraits):
    _updated = CInt(sync=True)

    def __init__(self, *args, **kwargs):
        super(Updater, self).__init__(*args, **kwargs)
        if hasattr(self, "book"):
            link((self.book, "_updated"), (self, "_updated"))

    def __updated_changed(self, name=None, old=None, new=None):
        if name != "_updated":
            self._updated = time.time()


@widgets.register()
class Concept(widgets.Widget, Updater):
    _model_module = Unicode(
        "nbextensions/openseat-notebook/js/widget_openseat", sync=True)
    _model_name = Unicode("ConceptModel", sync=True)

    name = Unicode(sync=True)
    color = Unicode(sync=True)
    icon = Unicode(sync=True)
    uri = Unicode(sync=True)
    properties = Tuple(sync=True)


NoRelation = Concept(name="No Relation",
                     uri="openseat-notebook:norelation")


@widgets.register()
class Relationship(widgets.Widget, Updater):
    _model_module = Unicode(
        "nbextensions/openseat-notebook/js/widget_openseat", sync=True)
    _model_name = Unicode("RelationshipModel", sync=True)

    source = Instance(klass=Concept, sync=True, allow_none=True,
                      **widget_serialization)
    target = Instance(klass=Concept, sync=True, allow_none=True,
                      **widget_serialization)
    relation = Instance(klass=Concept, sync=True, allow_none=True,
                        **widget_serialization)


@widgets.register()
class ConceptBook(widgets.DOMWidget, Updater):
    _view_module = Unicode(
        "nbextensions/openseat-notebook/js/widget_openseat", sync=True)
    _view_name = Unicode("ConceptBookView", sync=True)

    _model_module = Unicode(
        "nbextensions/openseat-notebook/js/widget_openseat", sync=True)
    _model_name = Unicode("ConceptBookModel", sync=True)

    concepts = Tuple(sync=True, **widget_serialization)
    relationships = Tuple(sync=True, **widget_serialization)
    no_relation = Instance(klass=Concept, sync=True, **widget_serialization)
    icon_prop_uri = Unicode("rdf:type", sync=True)
    color_prop_uri = Unicode(sync=True)
    use_metadata = CBool(True, sync=True)

    def __init__(self, *args, **kwargs):
        kwargs["no_relation"] = NoRelation
        super(ConceptBook, self).__init__(*args, **kwargs)
        self.on_msg(self._handle_book_message)

    def _handle_book_message(self, _, content):
        if content.get('event', '') == 'add_concepts':
            self._add_concepts(content["concepts"])

    def _add_concepts(self, new_concepts):
        old_uris = [c.uri for c in self.concepts]
        self.concepts += tuple([
            Concept(uri=uri, **nc)
            for uri, nc in new_concepts.items()
            if uri not in old_uris
        ])

    def _concepts_changed(self, name, old, new):
        print("concepts changed")
        for new_concept in set(old) - set(new):
            new_concept.on_trait_change(
                lambda name, old, new: self.__updated_changed()
            )


class Classifier(widgets.DOMWidget, Updater):
    _view_module = Unicode(
        "nbextensions/openseat-notebook/js/widget_openseat", sync=True)
    _view_name = Unicode("ClassifierView", sync=True)
    _model_name = Unicode("ClassifierModel", sync=True)

    book = Instance(klass=ConceptBook, sync=True, **widget_serialization)
    rows = Tuple(sync=True, **widget_serialization)
    columns = Tuple(sync=True, **widget_serialization)
    row_property = Unicode(sync=True)
    column_property = Unicode(sync=True)

    def __init__(self, *args, **kwargs):
        super(Classifier, self).__init__(*args, **kwargs)
        link((self.book, "_updated"), (self, "_updated"))


class Relater(widgets.DOMWidget, Updater):
    _view_module = Unicode(
        "nbextensions/openseat-notebook/js/widget_openseat", sync=True)
    _model_name = Unicode("RelaterModel", sync=True)
    _view_name = Unicode("RelaterView", sync=True)

    book = Instance(klass=ConceptBook, sync=True, **widget_serialization)

    def _relationships_changed(self, name, old, new):
        for new_rel in set(old) - set(new):
            new_rel.on_trait_changed(
                lambda name, old, new: self.__updated_changed()
            )


class Systemigram(widgets.DOMWidget, Updater):
    _view_module = Unicode(
        "nbextensions/openseat-notebook/js/widget_openseat", sync=True)
    _view_name = Unicode("SystemigramView", sync=True)

    book = Instance(klass=ConceptBook, sync=True, **widget_serialization)

    link_distance = CInt(50, sync=True)
    avoid_overlaps = CBool(True, sync=True)
    handle_disconnected = CBool(True, sync=True)

    width = CInt(800, sync=True)
    height = CInt(500, sync=True)

    def _relationships_changed(self, name, old, new):
        for new_rel in set(old) - set(new):
            new_rel.on_trait_changed(
                lambda name, old, new: self.__updated_changed()
            )

    def _concepts_changed(self, name, old, new):
        for new_concept in set(old) - set(new):
            print("listening to", new_concept)
            new_concept.on_trait_change(
                lambda name, old, new: self.__updated_changed()
            )
