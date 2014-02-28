BIN=node_modules/.bin/
COGS=$(BIN)cogs

cogs:
	$(COGS) -w scripts,styles
