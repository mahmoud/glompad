# TODO

# Tasks

* Select and translate examples
* Factor out common codemirror (make specinput font sizing match target/result)
* Message on copy success
* Clean up autoformatting (just do it all in the python, assuming that plays OK with the urlstore)

# Features

* Dark mode
* Split run/copy/link buttons into a row
* Status object color and tooltips (requires refactor to status object)
* fetch() target
* auto-run on change
* Optional scope field
* multiple targets/results (tabbed)
* panel for generated glom code

## Technical improvements

* Unplugin plugin for autogenerating the examples (currently in glomp.py)
* Unplugin plugin for transcluding the python (currently in glomp.py build)
* iframe-ability for glom docs?
* Version filter on examples (or colocate examples with glom itself)

# Ideas

* Error visualization (overlaid on target/spec?)
* Beginner/Intermediate/Advanced icons on examples?
* Enable more python execution in spec field (setup panel?)