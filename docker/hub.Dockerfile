FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY services/hub/hub.csproj services/hub/
RUN dotnet restore services/hub/hub.csproj
COPY services/hub/ services/hub/
RUN dotnet publish services/hub/hub.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 5100
ENV ASPNETCORE_URLS=http://+:5100
ENTRYPOINT ["dotnet", "hub.dll"]
