BIN=node_modules/.bin/
COGS=$(BIN)cogs
RJS=$(BIN)r.js
WATCHY=$(BIN)watchy

all: clean init
	open $(PWD)/index.html
	$(MAKE) -j cogs rjs

clean:
	rm -fr tmp dist

init:
	$(COGS)

cogs:
	$(COGS) -w scripts,styles

rjs:
	$(WATCHY) -w tmp,build.json,start.frag.js,end.frag.js -W 1 -- $(RJS) -o build.json
