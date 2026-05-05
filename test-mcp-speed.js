// Quick test: How fast is MCP server?

async function testSpeed() {
  console.log('Testing MCP server speed...\n');
  
  const tests = 5;
  const times = [];
  
  for (let i = 1; i <= tests; i++) {
    const start = Date.now();
    const response = await fetch('http://localhost:3002/status');
    const data = await response.json();
    const time = Date.now() - start;
    times.push(time);
    console.log(`Test ${i}: ${time}ms`);
  }
  
  const avg = Math.round(times.reduce((a, b) => a + b) / times.length);
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  console.log(`\nResults:`);
  console.log(`  Average: ${avg}ms`);
  console.log(`  Min: ${min}ms`);
  console.log(`  Max: ${max}ms`);
  console.log(`\n${avg < 100 ? '✅ FAST' : avg < 500 ? '⚠️ ACCEPTABLE' : '❌ SLOW'} - MCP server response time`);
}

testSpeed();
