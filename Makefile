# Visualisation locale de la doc OKF (docs/okf) avec OpenWiki.
# Prérequis : Node.js 22+ et un accès Internet (le viewer charge ses libs depuis un CDN).

OKF_DIR ?= docs/okf
OKF_PORT ?= 4321
OPENWIKI_VERSION ?= 0.6.0
OPENWIKI = npx --yes openwiki@$(OPENWIKI_VERSION)

.PHONY: help okf-viz okf-viz-export skills-index skills-index-check test-cpin-rules test-plugin

help: ## Liste les commandes
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-15s %s\n", $$1, $$2}'

okf-viz: ## Lance le graphe interactif de la doc (http://127.0.0.1:4321 par défaut)
	$(OPENWIKI) visualize $(OKF_DIR) --port $(OKF_PORT)

okf-viz-export: ## Exporte un visualiseur statique dans dist/okf-visualizer
	$(OPENWIKI) visualize $(OKF_DIR) --export dist/okf-visualizer

skills-index: ## Régénère le index.json de chaque groupe de skills
	node scripts/skills-index.mjs

skills-index-check: ## Vérifie que les index.json sont à jour (code 1 sinon)
	node scripts/skills-index.mjs --check

test-cpin-rules: ## Teste check-cpin-rules.py (skill helm-chart-cpin) sur les frictions réelles
	uv run --with pyyaml --with pytest pytest -q tests/check-cpin-rules

test-plugin:
	tests/plugin/check-config.sh
