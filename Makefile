BIN=node_modules/.bin/
COGS=$(BIN)cogs

dev:
	$(MAKE) -j cogs server

cogs:
	$(COGS) -w orgsync-widgets.js,css,jst,models,themes,views

compress:
	$(COGS) -c

server:
	open http://localhost:8000/
	python -mSimpleHTTPServer &> /dev/null
