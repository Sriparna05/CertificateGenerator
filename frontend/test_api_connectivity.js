// Simple test to verify frontend-backend connectivity
// To test: Open browser console on http://localhost:8080 and run this code

async function testAPIConnectivity() {
  console.log("🧪 Testing API connectivity...");

  const API_BASE_URL = "http://127.0.0.1:5000/api/v1";

  try {
    console.log("📡 Testing health endpoint...");
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    console.log("Health status:", healthResponse.status);
    const healthData = await healthResponse.json();
    console.log("Health data:", healthData);

    console.log("📋 Testing templates endpoint...");
    const templatesResponse = await fetch(`${API_BASE_URL}/templates`);
    console.log("Templates status:", templatesResponse.status);
    const templatesData = await templatesResponse.json();
    console.log("Templates data:", templatesData);

    console.log("✅ All API tests passed!");
    return true;
  } catch (error) {
    console.error("❌ API test failed:", error);
    return false;
  }
}

// Auto-run the test
testAPIConnectivity();
