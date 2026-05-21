import worker from './worker.js';

async function test() {
  console.log("[*] Starting local test of worker.js...");
  
  // Mock request object
  const mockRequest = {
    url: "http://localhost/?url=https://www.omg.xxx/videos/93745616/kendra-lynn-gives-her-boyfriend-a-birthday-threesome-with-jojo-kiss/",
    headers: new Map()
  };

  try {
    const response = await worker.fetch(mockRequest);
    const data = await response.json();
    
    console.log("[+] Response Status:", response.status);
    console.log("[+] Response Data:", JSON.stringify(data, null, 2));
    
    if (response.status === 403) {
      console.log("\n[!] TEST RESULT: FAILED (Expected)");
      console.log("Reason: Cloudflare blocked the request because standard fetch doesn't solve the challenge.");
    } else if (data.results && data.results.length > 0) {
      console.log("\n[+] TEST RESULT: SUCCESS (Unexpected)");
      console.log("The environment was able to bypass Cloudflare without cloudscraper.");
    }
  } catch (error) {
    console.error("[!] Error during test:", error);
  }
}

test();
