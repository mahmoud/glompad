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
    target_url: str = ''
    section: str = 'Examples'

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


class GHEvents(Example):
    '''
    Restructuring a live GitHub API response.
    '''
    label = 'GitHub API Events'
    spec = [{'user': 'actor.login', 'type': 'type'}]
    target_url = 'https://api.github.com/repos/mahmoud/glom/events'


class BadJSONURL(Example):
    label = 'Bad JSON URL'
    spec = {"a": "a"}
    target_url = 'https://gist.githubusercontent.com/mahmoud/31182331fb5d4f1b99609d7867b96183/raw/fb2f7635191720834cd7ef866ee7d0e6d30630bb/bad_json.json'
    section = 'Debug Examples'
    icon = 'x-square'


class Bad404URL(Example):
    label = '404 URL'
    spec = {"c": "c"}
    section = 'Debug Examples'
    icon = 'x-square'
    target_url = 'https://gist.githubusercontent.com/mahmoud/31182331fb5d4f1b99609d7867b96183/raw/fb2f7635191720834cd7ef866ee7d0e6d30630bb/does_not_exist.json'