BIN=node_modules/.bin/
COGS=$(BIN)cogs

cogs:
	npm install
	$(COGS) -w src,styles
