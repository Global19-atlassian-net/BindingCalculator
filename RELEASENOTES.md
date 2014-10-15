Version 2.3.0.0
- Add support for the P6 binding protocol
- Add support for the OneCellPerWell (OCPW) protocol
- Add a custom parameter for Primer to Template Ratio
- All changes from the 2.1.0.3 calculator below including sample export and import, label changes, and print view additions
- This version no longer allows editing of samples using C2 or XL binding, download older calculators for those samples

Version 2.1.0.3
- Add export and import of samples in the list page. 
    - Samples are saved as files with a ".sample" filename
    - Exported sample files may then be imported using the Import: Choose button in the list view 
- Now displays if a sample is "Standard" or not, instead of "Non-Standard" or not to avoid the double negative (issue 25354)
    - Previous stored samples which showed as "Non-Standard" before will now show as not "Standard", and vis versa
- Display optional Custom Parameters in the print view so the print view is a complete archive of inputs (issue 25310)
- Added a Print button on the single sample edit page, to print just that sample conveniently (issue 25663)
- Changes to calculator wording for clarity (issue 25355)
    - Renamed Annealing to Sequencing Primer Annealing
    - Re-numbered "steps" in output to start with diluting sequencing primer
    - Moved the "Binding Polymerase to Templates" section to include preparing the polyerase dilution
    - Removed the suggested polymerase tube label
    - Matched bead binding and wash buffer labels to kit names
    - Clarified magnetic bead step labels and instructions
- Display correct sample concentration on plate in magbead titration print view (issue 24462)
- Correct an error that prevented display of certain magbead titrations (issue 24464)

Version 2.1.0.2
- Show DTT contribution in titration with diffusion loading (issue 24193)

Version 2.1.0.1
- Correct label of sequencing primer with C3 chemistry (issue 24121)

Version 2.1.0.0
- Support for the P5 binding kit
- Support for long term storage with small preparation protocols
- Support for 20kb insert sizes with size selection with P4 and P5 binding kits (issue 24054)
- Added short summary in the sidebar, which stays on screen when scrolled (issue 23476)
- Correct volume needed when using titration and magbead (issue 23737)
- Name changed to Binding Calculator to match documentation (issue 23646)
- Update warning using magnetic bead loading between 750 and 999 bp (issue 23437)
- Print view now shows control volume aliquot in diffusion case with P4 or P5 chemistry (issue 24047)

Version 2.0.1.2
- Changed polymerase ratio from 2 to 3 for large-scale, magnetic bead loading when the P4 binding kit is selected (issue 23482)

Version 2.0.1.1 
 (released with PacBio RS version 2.0.2 Software)
- Remove warning with standard/diffusion protocol when P4 binding kit selected (issue 23427)
- Correct binding buffer calculations when P4 binding kit selected (issue 23428)
- Change low binding volume error message and avoid showing erroneous calculations (issue 23450)
- Show DNA Control dilution in print view when P4 binding kit selected (issue 23455)
- Added nM units to the titration input concentrations (issue 23478)

Version 2.0.1.0
- Update coefficients for the P4 binding kit
- Correct polymerase tube label for samples using P4 (issue 23382)
- Correct the diluted polymerase label in the print view (issue 23382)
- Only display extra dilution step in "using binding complex" section with large preparations (issue 23382)

Version 2.0.0.2
- Switching a sample to non-standard will now recompute concentrations immediately (issue 23123)
- The polymerase dilution is now displayed in the print view for standard samples (issue 23127)
- Print view sample concentration is now labeled as ng/uL instead of nM (issue 23144)
- Print view checkbox options now persist between both stand-alone and on-instrument (issue 23126)
- Resolve issue where sorting the list of samples could result in only 20 displayed (issue 23168)

Version 2.0.0.1
- Prevents renaming a sample to have a blank name (issue 23060)
- Improves display of errors when renaming
- Only rounds volumes to two digits of precision when less than 1 uL

Version 2.0.0
- First release of stand-alone Binding Calculator
