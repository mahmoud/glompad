# TODO

# Bugs

* CodeMirror cursor not showing up after upgrade?    
   * https://discuss.codemirror.net/t/cant-see-cursor-at-all/5267/7
   * Possibly fighting with pyscript's codemirror integration

# Tasks

* Fetch state handling
* Figure out why target data preview refreshes on execute (and hits API again)
* Races:
  * Startup: When page is loaded with URL target, URL is fetched faster than pyodide is loaded. load_target/executeGlom are bypassed. When executeGlom finally does run, it looks at stateStack which are still empty states.
  * Clicking Bad JSON URL results in trying to use the URL as the target data itself.

# Features

* Custom autocompletion: https://codemirror.net/examples/autocompletion/
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
