using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TuristGo.API.Controllers;

[ApiController]
[Authorize(Roles = "Agency")]
[Route("api/agency")]
public class AgencyController : ControllerBase
{
    [HttpGet("guides")] public ActionResult GetGuides() => Ok(Array.Empty<object>());
    [HttpPost("guides")] public ActionResult CreateGuide() => Ok();
    [HttpPut("guides/{id:int}/certificate")] public ActionResult UpdateCertificate(int id) => NoContent();
}
