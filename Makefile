SHELL := /bin/bash
DEV_PROJECT_ID := cllctve-test
PROD_PROJECT_ID := cllctve-prod

GIT_TAG := $(shell git rev-parse --short HEAD 2> /dev/null)

init: deps

deps:
	npm install --quiet

test:
	npm run format:dry

set-dev:
	gcloud config set project $(DEV_PROJECT_ID)

deploy-dev: set-dev
	NODE_ENV="development" \
	gcloud app deploy app.yaml

set-prod:
	gcloud config set project $(PROD_PROJECT_ID)

deploy-prod: set-prod
	NODE_ENV="production" \
	gcloud app deploy app.yaml

.PHONY: deploy-staging ci

#gsutil -m web set -m build/index.html -e build/index.html gs://dev.cllctve-test.com
#gsutil -m web set -m index.html -e index.html gs://www.cllctve-test.com
#gsutil -m acl -R -u AllUsers:R gs://dev.cllctve-test.com
#gsutil -m acl ch -R -u AllUsers:R gs://dev.cllctve-test.com
#gsutil defacl set public-read gs://dev.cllctve-test.com
#gcloud app deploy
#gsutil rsync -r gs://www.cllctve-test.com  ./cllctve-ui
