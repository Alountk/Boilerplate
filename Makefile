.PHONY: docker-up run-api docker-down migrate docker-deploy-up docker-deploy-down

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
