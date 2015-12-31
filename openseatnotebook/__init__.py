from IPython.display import (
    display,
    Javascript,
)

from .widgets import (
    ConceptBook,
    Classifier,
    Relater,
    Systemigram,
)

from .contrib import tmd


class OpenSEATNotebook(object):
    """
    A convenience wrapper around creating and configuring the linked
    widgets for a OpenSEAT Notebook.
    """
    def __init__(self):
        self.book = ConceptBook()

        self._relaters = {}
        self._classifiers = {}
        self._systemigrams = {}

        display(self.book)

    def classifier(self, name="default"):
        if name not in self._classifiers:
            column_property, columns = tmd.entity()
            row_property, rows = tmd.scale()

            self._classifiers[name] = Classifier(
                book=self.book,
                column_property=column_property,
                row_property=row_property,
                columns=columns,
                rows=rows
            )

        return self._classifiers[name]

    def relater(self, name="default"):
        if name not in self._relaters:
            self._relaters[name] = Relater(book=self.book)
        return self._relaters[name]

    def systemigram(self, name="default"):
        if name not in self._systemigrams:
            self._systemigrams[name] = Systemigram(book=self.book)
        return self._systemigrams[name]


def load_ipython_extension(ip):
    display(Javascript("""
        IPython.load_extensions(['openseat-notebook/js/widget_openseat']);
    """))
