DOCKER=docker

LOOMADB_IMAGE=loomadb
LOOMADB_VERSION=latest
LOOMADB_CTR=loomadb
LOOMAWEB_IMAGE=loomaweb
LOOMAWEB_VERSION=latest
LOOMAWEB_CTR=loomaweb

LOOMA_HOME=$(shell pwd)
DATAVOL=$(LOOMA_HOME)/loomadata
SRCDIR=$(LOOMA_HOME)

all: $(LOOMADB_IMAGE) $(LOOMAWEB_IMAGE)

.PHONY: all

$(LOOMADB_IMAGE):
	$(DOCKER) build mongo-dump -t $(LOOMADB_IMAGE)

$(LOOMAWEB_IMAGE):
	$(DOCKER) build -t $(LOOMAWEB_IMAGE) -f Dockerfile .

shell-db:
	$(DOCKER) exec -ti $(LOOMADB_CTR) /bin/bash
shell-web:
	$(DOCKER) exec -ti $(LOOMAWEB_CTR) /bin/bash

logs-db:
	$(DOCKER) logs $(LOOMADB_CTR) -f
logs-web:
	$(DOCKER) logs $(LOOMAWEB_CTR) -f

rmi:
	$(DOCKER) rmi $(LOOMADB_IMAGE):$(LOOMADB_VERSION)
	$(DOCKER) rmi $(LOOMAWEB_IMAGE):$(LOOMADB_VERSION)

clean:
	rm -rf $(DATAVOL)

publish-db:
	@docker tag $(LOOMADB_IMAGE):$(LOOMADB_VERSION) ghcr.io/looma/$(LOOMADB_IMAGE):$(LOOMADB_VERSION)
	@docker push ghcr.io/looma/$(LOOMADB_IMAGE):$(LOOMADB_VERSION)

publish-web:
	@docker tag $(LOOMAWEB_IMAGE):$(LOOMAWEB_VERSION) ghcr.io/looma/$(LOOMAWEB_IMAGE):$(LOOMAWEB_VERSION)
	@docker push ghcr.io/looma/$(LOOMAWEB_IMAGE):$(LOOMAWEB_VERSION)

