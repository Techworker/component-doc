uid = $$(id -u)

node:
	docker-compose run --rm --user ${uid} node bash

.PHONY: node
