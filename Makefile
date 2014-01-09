BIN=node_modules/.bin/
COGS=$(BIN)cogs
RJS=$(BIN)r.js
WATCHY=$(BIN)watchy

dev:
	$(MAKE) -j cogs rjs server

cogs:
	$(COGS) -w scripts,styles

rjs:
	$(WATCHY) -w tmp,build.json,start.frag.js,end.frag.js -W 1 -- $(RJS) -o build.json

server:
	open http://localhost:8000/
	python -mSimpleHTTPServer &> /dev/null
