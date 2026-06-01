using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TuristGo.API.Controllers;

[ApiController]
[Authorize(Roles = "Guide")]
[Route("api/guide")]
public class GuideController : ControllerBase
{
    [HttpGet("tours")] public ActionResult Tours() => Ok(Array.Empty<object>());
    [HttpPost("unavailability")] public ActionResult Unavailability() => Ok();
}
