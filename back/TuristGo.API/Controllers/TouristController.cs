using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TuristGo.API.Controllers;

[ApiController]
[Authorize(Roles = "Tourist")]
[Route("api/tourist")]
public class TouristController : ControllerBase
{
    [HttpGet("profile")] public ActionResult Profile() => Ok();
    [HttpPut("profile")] public ActionResult UpdateProfile() => NoContent();
    [HttpDelete("account")] public ActionResult DeleteAccount() => NoContent();
}
