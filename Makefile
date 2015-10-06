BIN=node_modules/.bin/
COGS=$(BIN)cogs

cogs:
	npm install
	(cd node_modules/superagent && npm install && make superagent.js)
	$(COGS) -w src,styles
