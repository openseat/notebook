from ..widgets import Concept

def entity():
    return "opm:type", [
        Concept(name="Object", uri="opm:Object",
                icon="cube"),
        Concept(name="Process", uri="opm:Process",
                icon="circle-o"),
        Concept(name="State", uri="opm:State",
                icon="square-o"),
    ]
