using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace NFK.API.Swagger;

public class SwaggerFileOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var fileParameters = context.MethodInfo.GetParameters()
            .Where(p => p.ParameterType == typeof(IFormFile) || 
                       p.ParameterType == typeof(IEnumerable<IFormFile>))
            .ToList();

        if (!fileParameters.Any())
            return;

        operation.RequestBody = new OpenApiRequestBody
        {
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["multipart/form-data"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema
                    {
                        Type = "object",
                        Properties = context.MethodInfo.GetParameters()
                            .ToDictionary(
                                p => p.Name!,
                                p => p.ParameterType == typeof(IFormFile)
                                    ? new OpenApiSchema { Type = "string", Format = "binary" }
                                    : new OpenApiSchema { Type = "integer", Format = "int32" }
                            ),
                        Required = fileParameters.Select(p => p.Name!).ToHashSet()
                    }
                }
            }
        };
    }
}
