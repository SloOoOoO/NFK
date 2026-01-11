using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Reflection;

namespace NFK.API.Swagger;

public class IgnoreNavigationPropertiesSchemaFilter : ISchemaFilter
{
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        if (schema.Properties == null || context.Type == null)
            return;

        // Get all properties marked with JsonIgnore or navigation properties
        var excludedProperties = context.Type.GetProperties()
            .Where(p => 
                // Ignore virtual navigation properties
                p.GetGetMethod()?.IsVirtual == true && 
                p.DeclaringType != typeof(object) &&
                (p.PropertyType.IsClass || 
                 (p.PropertyType.IsGenericType && 
                  p.PropertyType.GetGenericTypeDefinition() == typeof(ICollection<>))))
            .Select(p => ToCamelCase(p.Name))
            .ToList();

        foreach (var excludedProperty in excludedProperties)
        {
            if (schema.Properties.ContainsKey(excludedProperty))
            {
                schema.Properties.Remove(excludedProperty);
            }
        }
    }

    private static string ToCamelCase(string name)
    {
        if (string.IsNullOrEmpty(name) || !char.IsUpper(name[0]))
            return name;

        return char.ToLowerInvariant(name[0]) + name.Substring(1);
    }
}
