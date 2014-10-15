BindingCalculator
=================

This folder contains a version of the binding calculator
used with the PacBio RS and PacBio RS II sequencers. It is used to
calculate binding and annealing reactions and to prepare DNA samples
for use in these sequencers.

For more information, please refer to the calculator section in the
Customer Training Slide set posted in the portal.


Installation
------------
To download the latest version of the binding calculator,
use the "Download ZIP" button to download a zip file containing this README 
file, a RELEASENOTES file describing changes between versions, 
as well as a single-file version of the calculator named
Calculator.html

1. Copy the Calculator.html file to a location on your computer
like your Desktop, Applications or your Documents folder. 
2. Double-click the file to launch the calculator in your browser.


Browser Compatibility
---------------------
The recommended web browsers to use with the Binding Calculator
are the Firefox and Chrome browsers.  The Safari browser, including 
mobile Safari, will likely also function although we have not tested it. 

Opening Calculator.html in Chrome and Safari will always show the 
list of old calculations. Opening a new version of Calculator.html 
in Firefox will show old calculations only if the location of the 
new version of Calculator.html is placed in the same location as 
the old version of Calculator.html. If a new location is used, 
Firefox will show a fresh (blank) list of calculations.


Versions
--------
This version of the calculator may differ from the version 
installed on your PacBio RS or PacBio RS II sequencer.
Make sure that your version of software is compatible with this
calculator by checking with Pacific Biosciences support.

Older versions of this calculator may be downloaded by using 
the branch button. Select the branch button and then the "Tags" 
tab under that. This show a list of releases. Select the
desired release then download
that version with the "Download ZIP" button.


Building
--------
The Calculator.html file provided is the latest version. If you
choose to modify the calculator sources located in the src
directory use the build.py script provided to build an updated
single-file version including your changes, like this:

python build.py src/index.html src/ Calculator.html









[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/1e07cf2392b62fcc7a3c46eeb7323884 "githalytics.com")](http://githalytics.com/PacificBiosciences/BindingCalculator)
