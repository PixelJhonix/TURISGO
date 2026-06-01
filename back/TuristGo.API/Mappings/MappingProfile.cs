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
            // A.6: nuevos campos — ImagePlaceholder es null hasta que se implemente upload
            .ForCtorParam("ImagePlaceholder", opt => opt.MapFrom(src => (string?)null));
    }
}
