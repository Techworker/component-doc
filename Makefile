uid = $$(id -u)

node:
	docker-compose run --rm --user ${uid} node bash

test:
	docker-compose run --rm --user ${uid} node yarn test -v

.PHONY: node test
