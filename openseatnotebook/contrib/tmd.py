from ..widgets import Concept


def scale():
    return "tmd:scale", [
        Concept(name="Macroscale",
                uri="tmd:Macroscale",
                color="#DBF1B0"),
        Concept(name="Mesoscale",
                uri="tmd:Mesoscale",
                color="#A688B7"),
        Concept(name="Microscale",
                uri="tmd:Microscale",
                color="#FFF3BA"),
    ]


def entity():
    return "rdf:type", [
        Concept(name="Enabling Environment",
                uri="tmd:EnablingEnvironment",
                icon="globe"),
        Concept(name="Actor",
                uri="tmd:Actor",
                icon="user"),
        Concept(name="Relationship",
                uri="tmd:Relationship",
                icon="exchange"),
        Concept(name="Outcome",
                uri="tmd:Outcome",
                icon="flag-checkered"),
    ]
