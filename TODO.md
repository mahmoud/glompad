# TODO

# Bugs

* CodeMirror cursor not showing up after upgrade?
* "last run" text needs to be smaller on mobile

# Tasks

* About modal
* Fetch state handling
* Figure out why target data preview refreshes on execute (and hits API again)
* Races:
  * Startup: When page is loaded with URL target, URL is fetched faster than pyodide is loaded. load_target/executeGlom are bypassed. When executeGlom finally does run, it looks at stateStack which are still empty states.
  * Clicking Bad JSON URL results in trying to use the URL as the target data itself.
* Select and translate examples
* Message on copy success

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
* Enable more python execution in spec field (setup panel?)
* panel for generated glom code
* multiple targets/results (tabbed)
