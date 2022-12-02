'''
Examples used to populate the drawer
'''
from dataclasses import dataclass

from glom import *

@dataclass
class Example:
    label: str
    spec: object
    target: object

    # a name from https://feathericons.com/
    icon: str = ''


class BasicDeepGet(Example):
    label = 'Basic Deep Get'
    spec = 'a.b.c'
    target = {'a': {'b': {'c': 'd'}}}


class TutorialNestedLists(Example):
    '''
    See https://glom.readthedocs.io/en/latest/tutorial.html#handling-nested-lists
    '''
    label = 'Nested Lists'
    icon = 'list'
    spec = {
        'planet_names': ('system.planets', ['name']),
        'moon_names': ('system.planets', [('moons', ['name'])])
    }
    target = {
        'system': {
            'planets': [
                {
                    'name': 'earth',
                    'moons': [
                        {'name': 'luna'}
                    ]
                },
                {
                    'name': 'jupiter',
                    'moons': [
                        {'name': 'io'},
                        {'name': 'europa'}
                    ]
                }
            ]
        }
    }