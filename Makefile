.PHONY: install dev test typecheck check audit outdated skills-validate

install:
	bun install

dev:
	bun run dev

test:
	bun test

typecheck:
	bun x tsc --noEmit

skills-validate:
	@if command -v uvx >/dev/null 2>&1; then \
		for d in .claude/skills/*/; do \
			echo "validating $$d"; \
			uvx --from "git+https://github.com/agentskills/agentskills#subdirectory=skills-ref" skills-ref validate "$$d" || exit 1; \
		done; \
	else \
		echo "WARNING: uvx not found, skipping skills validation" >&2; \
	fi

check: typecheck test skills-validate

audit:
	bun audit

outdated:
	bun outdated
