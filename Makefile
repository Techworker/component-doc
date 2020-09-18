uid = $$(id -u)

cli:
	docker-compose run --rm --user ${uid} node bash

.PHONY: cli
