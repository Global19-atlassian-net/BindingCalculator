#!/usr/bin/python

#
# this script takes three arguments [source] [root] [output]
# it basically looks for link and script tags in 'source' and replaces them inline with
# the contents of those files. It writes out the new combined single file as [output]
# or stdout
#

import sys
import re
import unicodedata
  

input = sys.argv[1]
root = sys.argv[2]
with open(input, 'r') as f:
    content = f.readlines()

output = sys.argv[3]
o = open(output, 'w')

# now we have a line by line version of the file
# parse each line and either output it or replace it with a file

cssmatch = re.compile(".*?(<link.*?/>)")
jsmatch = re.compile(".*?(<script.*?src=.*?</script>)")
omitmatch = re.compile("oninstrument_begin")
omitendmatch = re.compile("oninstrument_end")
striptags = re.compile("(<%@[^>]+>)")

def outputFile(linkmatch, innerpattern, innermatchnumber, root, wrapperstart, wrapperend, output):
 link = linkmatch.group(0)
 print "Link found was " + link
 pathmatch = re.search(innerpattern, link)
 if pathmatch:
  path = pathmatch.group(innermatchnumber)
    
  # ok now we have both a string to replace and the file path of what to replace it with
  print "Reading from " + root + path
  r = open(root + path, 'r')
  rtext = r.read()
  
  # strip any unicode, we only want ascii
  rtext = wrapperstart + rtext + wrapperend;
  rtext = rtext.decode('UTF-8')
  rtext = unicodedata.normalize('NFKD', rtext).encode('ascii','ignore')

  # output to file
  output.write(rtext)
 else:
  print "Failed to read filename from " + link

def outputJS(match, output, root):
 print "found js file to inline"
 innermatch = '.*?' + '".*?"' + '.*?' + '"(.*?)"'
 wrapperstart = "<script type='text/javascript'>"
 wrapperend = "</script>"
 outputFile(match, innermatch, 1, root, wrapperstart, wrapperend, output)
 pass

def outputCSS(match, output, root):
 print "found css file to inline"
 innermatch = ".*?((?:[a-z][a-z\\.\\d\\-]+)\\.(?:[a-z][a-z\\-]+))(?![\\w\\.])"
 wrapperstart = "<style type='text/css'>"
 wrapperend = "</style>"
 outputFile(match, innermatch, 1, root, wrapperstart, wrapperend, output)
 pass

# loop

omitting = False
for line in content:
 outputLine = True

 css = cssmatch.search(line)
 if (css is not None):
  outputLine = False
  outputCSS(css, o, root)

 js = jsmatch.search(line)
 if (js is not None):
  outputLine = False
  outputJS(js, o, root)

 omit = omitmatch.search(line)
 if (omit is not None):
  omitting = True
  outputLine = False
  print "found omit start line"

 if (omitting):
  omitend = omitendmatch.search(line)
  if (omitend is not None):
   omitting = False
   outputLine = False
   print "found omit end line"

 strip = striptags.search(line)
 if (strip is not None):
  print "found strippable tag"
  outputLine = False

 if (omitting):
  continue

 if (outputLine):
  # strip non-breaking space unicode character
  line = line.decode('UTF-8')
  #line = line.replace(u'\ufeff', '')
  line = unicodedata.normalize('NFKD', line).encode('ascii','ignore')
  o.write(line)

# we're done, close the file
o.close()