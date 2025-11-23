.PHONY: docker-up run-api docker-down migrate

migrate:
	dotnet ef database update --project Videogames.Infrastructure --startup-project Videogames.API


docker-up:
	docker-compose up -d

run-api:
	cd Videogames.API && dotnet run

docker-down:
	docker-compose down
