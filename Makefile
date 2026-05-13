.PHONY: docker-up run-api docker-down migrate docker-deploy-up docker-deploy-down audit-images recover-images migrate-external-images sync-frontend-assets

migrate:
	ASPNETCORE_ENVIRONMENT=Development dotnet ef database update --project Videogames.Infrastructure --startup-project Videogames.API


docker-up:
	docker-compose up -d

run-api:
	cd Videogames.API && ASPNETCORE_ENVIRONMENT=Development dotnet run

docker-down:
	docker-compose down

run-web:
	cd Videogames.Web && npm run dev

docker-deploy-up:
	docker compose -f docker-compose.deploy.yml pull
	docker compose -f docker-compose.deploy.yml up -d

docker-deploy-down:
	docker compose -f docker-compose.deploy.yml down

audit-images:
	dotnet run --project tools/ImageRecoveryAudit/ImageRecoveryAudit.csproj

recover-images:
	AUDIT_MODE=recover dotnet run --project tools/ImageRecoveryAudit/ImageRecoveryAudit.csproj

migrate-external-images:
	AUDIT_MODE=migrate-external dotnet run --project tools/ImageRecoveryAudit/ImageRecoveryAudit.csproj

sync-frontend-assets:
	AUDIT_MODE=sync-frontend-assets dotnet run --project tools/ImageRecoveryAudit/ImageRecoveryAudit.csproj
