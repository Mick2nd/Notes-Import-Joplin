# QNAP Notes Station Notes Importer - A Joplin Plugin

This is an import module, e.g. a plugin serving the import of third party notes. In this case it
imports notes from an archive created with *QNAP Notes Station* - an application on *QNAP NAS* 
devices.

## How to import

An import involves the following steps:

1. The supported QNAP Notes Station archive is Notes Station 3 archive (ns3 extension)
2. First export notes from Notes Station 3 to archive
3. Select a notebook on the Joplin GUI where to import the notes
4. Invoke the import command from the Joplin File - Import sub menu
5. In the opening file dialog select the QNAP Notes Station archive
6. The file will be imported along with its notebooks, sections, notes, tags

## Features of QNAP Notes Station which will be transformed

 1. Headings
 1. Paragraphs
 1. Tables
 1. Code sections
 1. Citations
 1. Attachments
 1. Images
 1. Ordered lists
 1. Bullet lists
 1. Task lists
 1. Nested lists
 1. (External) Links
 1. Horizontal rulers
 1. Subscripts
 1. Superscripts
 1. Tags assigned to notes
 1. Created Time and Updated Time for notebooks, sections, notes, tags
 1. Alignment and indentation, implemented with HTML (no pure MD)
 1. Html entities for < and > characters in paragraphs
