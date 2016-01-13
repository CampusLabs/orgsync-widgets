BIN=node_modules/.bin/
COGS=$(BIN)cogs
LIVERELOAD=$(BIN)livereload

dev:
	npm install
	make -j cogs livereload

cogs:
	@npm install --loglevel error
	@$(COGS) -w src,styles

livereload:
	@$(LIVERELOAD) dist
