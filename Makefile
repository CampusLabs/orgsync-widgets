BIN=node_modules/.bin/
COGS=$(BIN)cogs

cogs:
	npm install
	bower install
	open index.html
	$(COGS) -w scripts,styles
