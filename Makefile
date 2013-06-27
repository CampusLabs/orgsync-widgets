BIN=node_modules/.bin/
COGS=$(BIN)cogs

dev:
	$(COGS) -w .

server:
	open http://localhost:8000/
	python -mSimpleHTTPServer &> /dev/null
