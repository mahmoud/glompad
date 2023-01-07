"""
Examples used to populate the drawer
"""
from dataclasses import dataclass

from glom import *


@dataclass
class Example:
    label: str
    spec: object
    target: object
    target_url: str = ""
    section: str = "Examples"

    # a name from https://feathericons.com/
    icon: str = ""


class BasicDeepGet(Example):
    label = "Basic Deep Get"
    icon = "play"
    spec = "a.b.c"
    target = {"a": {"b": {"c": "d"}}}


class TutorialNestedLists(Example):
    """
    See https://glom.readthedocs.io/en/latest/tutorial.html#handling-nested-lists
    """

    label = "Nested Lists"
    icon = "play"
    spec = {
        "planet_names": ("system.planets", ["name"]),
        "moon_names": ("system.planets", [("moons", ["name"])]),
    }
    target = {
        "system": {
            "planets": [
                {"name": "earth", "moons": [{"name": "luna"}]},
                {"name": "jupiter", "moons": [{"name": "io"}, {"name": "europa"}]},
            ]
        }
    }


class DeepAssign(Example):
    """Modify a dictionary in-place."""
    label = "Deep Assign"
    spec = Assign("a.e", "new value")
    target = {"a": {"b": {"c": "d"}}}
    icon = "play"


class DeepAssignWithBackfill(Example):
    """Automatically create dicts for missing keys."""
    icon = "play"
    label = "Deep Assign with Backfill"
    spec = Assign(Path("user", "contact", "email"), "foobar@example.com", missing=dict)
    target = {
        "user": {
            "location": {"city": "Berlin", "country": "DE"},
            "username": "foobar",
            "created": 1672950417,
        }
    }


class DeepAssignSpec(Example):
    label = "Deep Assign Spec"
    spec = Assign("a.b", Spec(("a.b", sorted)))
    target = {"a": {"b": [3, 1, 2]}}
    icon = "diamond"


class GHEvents(Example):
    """
    Restructuring a live GitHub API response.
    """

    label = "GitHub API Events"
    icon = "diamond"
    spec = [{"user": "actor.login", "type": "type"}]
    target_url = "https://api.github.com/repos/mahmoud/glom/events"


class JSONRecursiveTransform(Example):
    "Uses Ref and pattern matching to automatically traverse JSON-compatible recursive structures"
    label = "Tree Transformation"
    spec = Ref(
        "json",
        Match(
            Switch(
                {
                    dict: {str: Ref("json")},
                    list: [Ref("json")],
                    str: Auto(str),
                    object: T,
                }
            )
        ),
    )
    target_url = "https://api.github.com/repos/mahmoud/glom"
    icon = "codesandbox"


class SlowURL(Example):
    label = "Slow URL"
    spec = T
    target_url = "https://httpbin.org/delay/3"
    section = "Debug Examples"
    icon = "clock"


class BadJSONURL(Example):
    label = "Bad JSON URL"
    spec = {"a": "a"}
    target_url = "https://gist.githubusercontent.com/mahmoud/31182331fb5d4f1b99609d7867b96183/raw/fb2f7635191720834cd7ef866ee7d0e6d30630bb/bad_json.json"
    section = "Debug Examples"
    icon = "x-square"


class Bad404URL(Example):
    label = "404 URL"
    spec = {"c": "c"}
    section = "Debug Examples"
    icon = "x-square"
    target_url = "https://gist.githubusercontent.com/mahmoud/31182331fb5d4f1b99609d7867b96183/raw/fb2f7635191720834cd7ef866ee7d0e6d30630bb/does_not_exist.json"
