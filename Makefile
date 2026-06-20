.PHONY: up down test test-verbose test-file logs shell

# Start the full stack
up:
	docker compose up --build

# Stop everything
down:
	docker compose down

# Run the full test suite inside the backend container
test:
	docker compose run --rm \
		-e DATABASE_URL=sqlite:///./test_docuquery.db \
		--no-deps \
		backend \
		pytest tests/ -v

# Run tests with live output (no capture)
test-verbose:
	docker compose run --rm \
		-e DATABASE_URL=sqlite:///./test_docuquery.db \
		--no-deps \
		backend \
		pytest tests/ -v -s

# Run a single test file: make test-file FILE=tests/test_auth_service.py
test-file:
	docker compose run --rm \
		-e DATABASE_URL=sqlite:///./test_docuquery.db \
		--no-deps \
		backend \
		pytest $(FILE) -v -s

# Run tests matching a keyword: make test-k K=test_login
test-k:
	docker compose run --rm \
		-e DATABASE_URL=sqlite:///./test_docuquery.db \
		--no-deps \
		backend \
		pytest tests/ -v -k "$(K)"

# Tail backend logs
logs:
	docker compose logs -f backend

# Open a shell in the backend container
shell:
	docker compose run --rm --no-deps backend bash
