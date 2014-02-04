#!/bin/sh

node ../../node_modules/.bin/jsinc *.jsin res/jasine.js.jsin

echo "Adding client.js"
cat ../../client.js >> res/jasine.js.jsin
echo "Done!"
