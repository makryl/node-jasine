#!/bin/sh

cd `dirname $0`

node ../node_modules/.bin/jsinc -d public static/jsin.compiled.js

echo "Copying client script"
cp ../jasine.js static
echo "Done!"
