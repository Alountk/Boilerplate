using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Videogames.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMarketplaceFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AcceptOffersRange",
                table: "Videogames",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "AveragePrice",
                table: "Videogames",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "Category",
                table: "Videogames",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Videogames",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "GeneralState",
                table: "Videogames",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "OwnPrice",
                table: "Videogames",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Score",
                table: "Videogames",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "UrlImg",
                table: "Videogames",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "GameContent",
                columns: table => new
                {
                    VideogameId = table.Column<Guid>(type: "uuid", nullable: false),
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FrontalUrl = table.Column<string>(type: "text", nullable: false),
                    BackUrl = table.Column<string>(type: "text", nullable: false),
                    RightSideUrl = table.Column<string>(type: "text", nullable: false),
                    LeftSideUrl = table.Column<string>(type: "text", nullable: false),
                    TopSideUrl = table.Column<string>(type: "text", nullable: false),
                    BottomSideUrl = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameContent", x => new { x.VideogameId, x.Id });
                    table.ForeignKey(
                        name: "FK_GameContent_Videogames_VideogameId",
                        column: x => x.VideogameId,
                        principalTable: "Videogames",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GameContent");

            migrationBuilder.DropColumn(
                name: "AcceptOffersRange",
                table: "Videogames");

            migrationBuilder.DropColumn(
                name: "AveragePrice",
                table: "Videogames");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Videogames");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Videogames");

            migrationBuilder.DropColumn(
                name: "GeneralState",
                table: "Videogames");

            migrationBuilder.DropColumn(
                name: "OwnPrice",
                table: "Videogames");

            migrationBuilder.DropColumn(
                name: "Score",
                table: "Videogames");

            migrationBuilder.DropColumn(
                name: "UrlImg",
                table: "Videogames");
        }
    }
}
