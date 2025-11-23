# .NET Hexagonal Boilerplate

A robust, scalable, and production-ready boilerplate for building .NET applications using **Hexagonal Architecture** (Ports and Adapters). This project serves as a foundation for building complex domain-centric applications with a focus on maintainability, testability, and loose coupling.

## 🏗 Architecture

This project follows the **Hexagonal Architecture** pattern, ensuring a strict separation of concerns:

- **Domain Layer**: The heart of the software. Contains entities, value objects, and domain logic. Zero dependencies.
- **Application Layer**: Orchestrates use cases and defines ports (interfaces) for infrastructure. Depends only on Domain.
- **Infrastructure Layer**: Implements ports defined in Application (e.g., Repositories, Database access). Depends on Application and Domain.
- **API Layer**: The entry point (REST API). Depends on Application and Infrastructure (for dependency injection).

## ✨ Features

- **Hexagonal Architecture**: Clean separation of concerns.
- **DDD Principles**: Rich domain model with Entities and Value Objects.
- **RESTful API**: Built with ASP.NET Core.
- **User Management**:
  - Secure password hashing (BCrypt).
  - Email validation and normalization.
  - Unique email constraints.
  - Sensitive data protection (passwords never exposed).
- **Videogames CRUD**: Example domain implementation.
- **Database**: PostgreSQL with Entity Framework Core.
- **Testing**: Unit tests with xUnit and Moq.
- **Docker Support**: Ready for containerization.

## 🛠 Tech Stack

- **Framework**: .NET 10.0 (Preview)
- **Database**: PostgreSQL
- **ORM**: Entity Framework Core
- **Logging**: Serilog
- **Documentation**: Swagger / OpenAPI
- **Testing**: xUnit, Moq, FluentAssertions
- **Security**: BCrypt.Net-Next

## 🚀 Getting Started

### Prerequisites

- [.NET SDK](https://dotnet.microsoft.com/download)
- [Docker](https://www.docker.com/) (optional, for database)
- [PostgreSQL](https://www.postgresql.org/) (if not using Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dotnet-hexagonal-boilerplate.git
   cd dotnet-hexagonal-boilerplate
   ```

2. **Setup Database**
   You can use the provided `docker-compose.yml` to start PostgreSQL:
   ```bash
   docker-compose up -d
   ```

3. **Apply Migrations**
   ```bash
   cd Videogames.Infrastructure
   dotnet ef database update -s ../Videogames.API
   ```

4. **Run the Application**
   ```bash
   cd ../Videogames.API
1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/dotnet-hexagonal-boilerplate.git
    cd dotnet-hexagonal-boilerplate
    ```

2.  **Setup Database**
    You can use the provided `docker-compose.yml` to start PostgreSQL:
    ```bash
    docker-compose up -d
    ```

3.  **Apply Migrations**
    ```bash
    cd Videogames.Infrastructure
    dotnet ef database update -s ../Videogames.API
    ```

4.  **Run the Application**
    ```bash
    cd ../Videogames.API
    dotnet run
    ```

    The API will be available at `http://localhost:5017` (or similar port).
    Swagger UI: `http://localhost:5017/swagger`

## Authentication

The API is secured using JWT (JSON Web Tokens).

1.  **Register**: Create a new user via `POST /api/Users`.
2.  **Login**: Authenticate via `POST /api/Auth/login` to receive a JWT token.
3.  **Access**: Include the token in the `Authorization` header for protected endpoints:
    ```
    Authorization: Bearer <your_token>
    ```

### Testing with Swagger

1.  Navigate to `http://localhost:5017/swagger`.
2.  Click the **Authorize** button.
3.  Enter `Bearer <your_token>` in the value field.
4.  Click **Authorize** and then **Close**.
5.  Now you can execute protected endpoints.

## 📂 Project Structure

```
├── Videogames.Domain          # Core business logic (Entities, Value Objects, Ports)
├── Videogames.Application     # Use cases, DTOs, Services, Interfaces
├── Videogames.Infrastructure  # Database, Repositories, External Services
├── Videogames.API             # REST Controllers, Configuration
└── Videogames.Tests           # Unit and Integration Tests
```

## 🗺 Roadmap

- [x] **Core Architecture Setup** (Hexagonal/DDD)
- [x] **Videogames Module** (CRUD)
- [x] **User Management** (Secure Registration/Updates)
- [x] **Authentication**: Implement JWT (JSON Web Tokens) for secure login.
- [ ] **Authorization**: Role-based access control (RBAC).
- [ ] **Email Verification**: Send verification emails upon registration.
- [ ] **Pagination & Filtering**: Advanced query capabilities for lists.
- [ ] **CI/CD Pipeline**: GitHub Actions workflow for automated testing and deployment.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
