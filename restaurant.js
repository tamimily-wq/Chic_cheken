Map<String, String> auth = new HashMap<>();
auth.put("api_key", "secret_api_key");
auth.put("engine", "google");

SerpApi client = new SerpApi(auth);

Map<String, String> parameter = new HashMap<>();

parameter.put("q", "restaurant");
parameter.put("hl", "en");
parameter.put("gl", "us");
parameter.put("google_domain", "google.com");

try {
  JsonObject results = client.search(parameter);
} catch (SerpApiException ex) {
  System.out.println("Exception:");
  System.out.println(ex.toString());
}