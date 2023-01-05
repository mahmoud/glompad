# TODO

# Tasks

* "Debug" examples (broken specs, json, 500s, 404s, etc.)
* Fetch state handling
* Figure out why target data preview refreshes on execute (and hits API again)
* Figure out JSON + autoformat breakage
* Startup race:
  * When page is loaded with URL target, URL is fetched faster than pyodide is loaded. load_target/executeGlom are bypassed. When executeGlom finally does run, it looks at stateStack which are still empty states.

* Select and translate examples
* Message on copy success
* Should a failure above (e.g., in spec) clear fields below (e.g., latest result), or is badge messaging sufficient?

# Features

* auto-run on change

## Technical improvements

* Unplugin plugin for autogenerating the examples (currently in glomp.py)
* Unplugin plugin for transcluding the python (currently in glomp.py build)
* iframe-ability for glom docs?
* Version filter on examples (or colocate examples with glom itself)
* Automated tests

# Ideas

* Error visualization (overlaid on target/spec?)
* Beginner/Intermediate/Advanced icons on examples?
* Enable more python execution in spec field (setup panel?)
* panel for generated glom code
* multiple targets/results (tabbed)

# Tests

* /#spec={'a'%3A+'a'}&target=https%3A%2F%2Fgist.githubusercontent.com%2Fmahmoud%2F31182331fb5d4f1b99609d7867b96183%2Fraw%2Ffb2f7635191720834cd7ef866ee7d0e6d30630bb%2Fbad_json.json&v=1