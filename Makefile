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
	@if [ ! -d .claude/skills ]; then \
		echo "no .claude/skills directory, skipping skills validation"; \
	elif ! command -v uvx >/dev/null 2>&1; then \
		echo "ERROR: uvx not found, cannot validate .claude/skills" >&2; \
		exit 1; \
	else \
		for d in .claude/skills/*/; do \
			echo "validating $$d"; \
			uvx --from "git+https://github.com/agentskills/agentskills#subdirectory=skills-ref" skills-ref validate "$$d" || exit 1; \
		done; \
	fi

check: typecheck test skills-validate

audit:
	bun audit

outdated:
	bun outdated
