using System.Security.Cryptography;
using System.Text;

namespace TuristGo.Domain.Services;

public static class HashHelper
{
    public static string Sha256(string input)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input))).ToLower();
}
