FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY ["src/NFK.API/NFK.API.csproj", "src/NFK.API/"]
COPY ["src/NFK.Application/NFK.Application.csproj", "src/NFK.Application/"]
COPY ["src/NFK.Domain/NFK.Domain.csproj", "src/NFK.Domain/"]
COPY ["src/NFK.Infrastructure/NFK.Infrastructure.csproj", "src/NFK.Infrastructure/"]
COPY ["src/NFK.Shared/NFK.Shared.csproj", "src/NFK.Shared/"]

RUN dotnet restore "src/NFK.API/NFK.API.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/src/NFK.API"
RUN dotnet build "NFK.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "NFK.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "NFK.API.dll"]
