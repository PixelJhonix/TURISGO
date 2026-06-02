using AutoMapper;
using TuristGo.API.DTOs;
using TuristGo.Domain.Entities;

namespace TuristGo.API.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Tour, TourResponseDTO>()
            .ForCtorParam("Status", opt => opt.MapFrom(src => src.Status.ToString()))
            .ForCtorParam("ImagePlaceholder", opt => opt.MapFrom(src => src.ImageUrl ?? GetImageByCategory(src.Category)))
            .ForCtorParam("AgencyId", opt => opt.MapFrom(src => src.AgencyId))
            .ForCtorParam("AgencyName", opt => opt.MapFrom(src => src.Agency != null ? src.Agency.CommercialName : string.Empty));
    }

    private static string? GetImageByCategory(string category) => category switch
    {
        "Cultura"      => "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
        "Aventura"     => "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
        "Gastronomía"  => "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
        "Naturaleza"   => "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80",
        _              => null,
    };
}
