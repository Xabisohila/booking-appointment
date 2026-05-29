using AmalindaPlumbing.Api.Data;
using AmalindaPlumbing.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AmalindaPlumbing.Api.Controllers;

public record CreateLeadRequest(string Name, string Phone, string Concern, bool IsNewPatient);

[Authorize]
[ApiController]
[Route("api/leads")]
public class LeadsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var leads = await db.Leads
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new
            {
                l.Id, l.Name, l.Phone, l.Email, l.Address,
                l.Concern, l.Status, l.CreatedAt, l.UpdatedAt
            })
            .ToListAsync();
        return Ok(leads);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var lead = await db.Leads
            .Include(l => l.Conversations)
            .Include(l => l.Booking)
            .FirstOrDefaultAsync(l => l.Id == id);

        return lead is null ? NotFound() : Ok(lead);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLeadRequest req)
    {
        var lead = new Lead
        {
            Name = req.Name,
            Phone = req.Phone,
            Concern = req.Concern,
            Address = req.IsNewPatient ? "NewPatient" : "ReturningPatient",
            Status = LeadStatus.Qualified
        };
        db.Leads.Add(lead);
        await db.SaveChangesAsync();
        return Ok(lead);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] LeadStatus status)
    {
        var lead = await db.Leads.FindAsync(id);
        if (lead is null) return NotFound();

        lead.Status = status;
        lead.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok(lead);
    }
}
