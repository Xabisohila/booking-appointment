using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AmalindaPlumbing.Api.Migrations
{
    /// <inheritdoc />
    public partial class DentalPivot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Issue",
                table: "Leads",
                newName: "Concern");

            migrationBuilder.RenameColumn(
                name: "TechnicianNotes",
                table: "Jobs",
                newName: "DentistNotes");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Concern",
                table: "Leads",
                newName: "Issue");

            migrationBuilder.RenameColumn(
                name: "DentistNotes",
                table: "Jobs",
                newName: "TechnicianNotes");
        }
    }
}
