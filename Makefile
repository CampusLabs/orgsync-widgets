BIN=node_modules/.bin/
COGS=$(BIN)cogs

cogs:
	npm install
	bower install
	(cd bower_components/superagent && npm install && make superagent.js)
	open index.html
	$(COGS) -w scripts,styles
