BIN=node_modules/.bin/
COGS=$(BIN)cogs
RJS=$(BIN)r.js
WATCHY=$(BIN)watchy

cogs:
	$(COGS) -w scripts,styles
