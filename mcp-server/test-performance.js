#!/usr/bin/env node

/**
 * REAL AI Performance Test
 * Actually calls the AI model and measures real performance
 */

const OLLAMA_URL = 'https://chat-api.retakt.cc';
const MODEL_ID = 'joe-speedboat/Gemma-4-Uncensored-HauhauCS-Aggressive:e4b';

// Intelligent mode analysis (same as in chat provider)
function analyzeQueryComplexity(text, hasTools, turnCount) {
  const lower = text.toLowerCase().trim();
  const length = text.length;
  const sentences = (text.match(/[.!?]+/g) || []).length;
  const words = text.split(/\s+/).length;
  
  let complexityScore = 0;
  
  // Length factors (more aggressive)
  if (length > 150) complexityScore += 2;
  if (length > 300) complexityScore += 3;
  if (sentences >= 2) complexityScore += 2;
  if (words > 30) complexityScore += 2;
  
  // High-priority patterns (immediate full-think)
  const highComplexityPatterns = [
    // Code-related
    /function|algorithm|implement|debug|code.*review|optimize.*code/,
    /javascript|python|react|component|programming/,
    /\.js|\.py|\.tsx?|\.jsx?|const |let |var |function\s*\(/,
    
    // Deep reasoning
    /explain.*why.*and.*how|compare.*pros.*cons|analyze.*and.*explain/,
    /step.*by.*step.*detailed|comprehensive.*analysis/,
    /design.*and.*implement|create.*algorithm/,
    
    // Multi-part queries
    /and.*also.*and|multiple.*different|several.*various/,
    /check.*and.*tell|status.*and.*weather.*and/,
  ];
  
  // Check for high complexity patterns first
  const hasHighComplexity = highComplexityPatterns.some(pattern => pattern.test(lower));
  if (hasHighComplexity) {
    complexityScore += 5; // Boost score significantly
  }
  
  // Medium complexity patterns
  const mediumComplexityPatterns = [
    /explain.*why|how.*work|what.*difference|compare|analyze|evaluate/,
    /detailed|comprehensive|thorough/,
    /pros.*cons|advantages.*disadvantages|benefits.*drawbacks/,
    /reasoning|logic|proof|derive|conclude/,
    /brainstorm|creative|innovative|design/,
    /help.*me.*understand|can.*you.*explain/,
  ];
  
  mediumComplexityPatterns.forEach(pattern => {
    if (pattern.test(lower)) complexityScore += 2;
  });
  
  // Tool usage patterns
  const multiToolPatterns = [
    /search.*and.*tell|find.*and.*explain/,
    /check.*and.*also|status.*and.*weather/,
    /multiple.*tools|several.*things/,
    /and.*tell.*me|and.*also.*check/,
    /and.*explain.*why|tell.*me.*and.*explain/,
    /status.*and.*weather.*and|check.*tell.*explain/,
  ];
  
  multiToolPatterns.forEach(pattern => {
    if (pattern.test(lower)) complexityScore += 3;
  });
  
  // Count "and" connectors for multi-part queries
  const andCount = (lower.match(/\band\b/g) || []).length;
  if (andCount >= 2) complexityScore += 3;
  
  // Retry/frustration signals
  const retrySignals = [
    "wrong", "incorrect", "not right", "try again", "still not",
    "doesn't work", "not working", "failed", "error"
  ];
  
  const isRetry = retrySignals.some(signal => lower.includes(signal));
  if (isRetry && turnCount >= 2) {
    return {
      mode: 'fullthink',
      options: { think: true, temperature: 1, top_k: 64, top_p: 0.95 },
      contextSize: 32768,
      reason: 'User retry/frustration detected - escalating to full reasoning'
    };
  }
  
  // Decision logic (use larger context sizes for 156K model)
  
  // Simple queries - stay fast
  if (complexityScore <= 1 && !hasTools && length < 80) {
    return {
      mode: 'nothink',
      options: { think: false, temperature: 0.3, top_k: 15, top_p: 1.0 },
      contextSize: 4096,
      reason: 'Simple query - using fastest mode'
    };
  }
  
  // Complex queries - full thinking (use more context)
  if (complexityScore >= 4 || hasHighComplexity || (hasTools && complexityScore >= 3)) {
    return {
      mode: 'fullthink',
      options: { think: true, temperature: 1, top_k: 64, top_p: 0.95 },
      contextSize: 32768,
      reason: 'Complex query detected - using full reasoning'
    };
  }
  
  // Tool usage or medium complexity - balanced mode
  if (hasTools || complexityScore >= 2) {
    return {
      mode: 'balanced',
      options: { think: false, temperature: 0.4, top_k: 20, top_p: 1.0 },
      contextSize: 16384,
      reason: hasTools ? 'Tool usage detected - using balanced mode' : 'Medium complexity - using balanced mode'
    };
  }
  
  // Default to balanced for safety
  return {
    mode: 'balanced',
    options: { think: false, temperature: 0.4, top_k: 20, top_p: 1.0 },
    contextSize: 16384,
    reason: 'Default balanced mode'
  };
}

// Real test scenarios - we'll send these to the actual AI
const REAL_TEST_SCENARIOS = [
  {
    name: 'Simple Greeting',
    message: 'Hello!',
    expectedMode: 'nothink',
    expectedTime: '<10s',
    expectsTools: false
  },
  {
    name: 'Status Check',
    message: 'Are my AI tools working?',
    expectedMode: 'balanced',
    expectedTime: '<15s',
    expectsTools: true
  },
  {
    name: 'Weather Query',
    message: 'What is the weather in Tokyo?',
    expectedMode: 'balanced', 
    expectedTime: '<15s',
    expectsTools: true
  },
  {
    name: 'Currency Convert',
    message: 'Convert 100 USD to EUR',
    expectedMode: 'balanced',
    expectedTime: '<15s', 
    expectsTools: true
  },
  {
    name: 'Code Debug',
    message: 'Debug this: function add(a,b) { return a + b; } // why is this slow?',
    expectedMode: 'fullthink',
    expectedTime: '<25s',
    expectsTools: false
  },
  {
    name: 'Complex Multi-Tool',
    message: 'Check my system status and tell me the weather in London',
    expectedMode: 'fullthink',
    expectedTime: '<30s',
    expectsTools: true
  }
];

async function testRealAI(scenario) {
  console.log(`\n🧪 REAL TEST: ${scenario.name}`);
  console.log(`📝 Query: "${scenario.message}"`);
  console.log(`🎯 Expected: ${scenario.expectedMode} mode, ${scenario.expectedTime}`);
  
  const startTime = Date.now();
  let firstTokenTime = null;
  let thinkingStartTime = null;
  let responseStartTime = null;
  let toolDetectionTime = null;
  let toolExecutionStartTime = null;
  let toolExecutionEndTime = null;
  
  // Tool tracking
  let toolsCalled = [];
  let toolResults = [];
  let hasToolDetection = false;
  
  try {
    console.log('🌐 Sending to AI model...');
    
    // First, check if tools will be detected (this is what our system does)
    console.log('🔍 Step 1: Tool detection phase...');
    const toolDetectionStart = Date.now();
    
    const toolCheckResponse = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [{ role: 'user', content: scenario.message }],
        stream: false,
        think: false,
        tools: [
          {
            type: "function",
            function: {
              name: "get_ai_tools_status",
              description: "Get persistent real-time status of all AI tools",
              parameters: { type: "object", properties: {} }
            }
          },
          {
            type: "function", 
            function: {
              name: "get_weather",
              description: "Get current weather conditions",
              parameters: {
                type: "object",
                required: ["city"],
                properties: { city: { type: "string" } }
              }
            }
          },
          {
            type: "function",
            function: {
              name: "get_exchange_rate", 
              description: "Get currency exchange rates",
              parameters: {
                type: "object",
                required: ["from", "to"],
                properties: {
                  from: { type: "string" },
                  to: { type: "string" }
                }
              }
            }
          }
        ],
        options: { num_ctx: 8192, temperature: 0.1 }
      })
    });
    
    toolDetectionTime = Date.now() - toolDetectionStart;
    
    if (toolCheckResponse.ok) {
      const toolData = await toolCheckResponse.json();
      const toolCalls = toolData?.message?.tool_calls;
      
      if (toolCalls && toolCalls.length > 0) {
        hasToolDetection = true;
        toolsCalled = toolCalls.map(tc => ({
          name: tc.function.name,
          args: tc.function.arguments
        }));
        
        console.log(`🔧 Tools detected (${toolDetectionTime}ms): ${toolsCalled.map(t => t.name).join(', ')}`);
        
        // Simulate tool execution (this is what our system does)
        console.log('⚙️  Step 2: Tool execution phase...');
        toolExecutionStartTime = Date.now();
        
        // Mock tool results (in real system, these would be actual API calls)
        for (const tool of toolsCalled) {
          let result = '';
          if (tool.name === 'get_ai_tools_status') {
            result = 'AI Tools Status: All 5 services operational (AI Model: READY 150ms, Web Search: READY 800ms, Weather: READY 600ms, Exchange: READY 200ms, YouTube: READY 900ms)';
          } else if (tool.name === 'get_weather') {
            result = `Weather in ${tool.args.city || 'Unknown'}: Partly cloudy, 22°C, humidity 65%, wind 15 km/h`;
          } else if (tool.name === 'get_exchange_rate') {
            result = `1 ${tool.args.from || 'USD'} = 0.85 ${tool.args.to || 'EUR'} (updated today)`;
          }
          
          toolResults.push({
            name: tool.name,
            result: result,
            executionTime: Math.random() * 1000 + 200 // Simulate 200-1200ms
          });
        }
        
        toolExecutionEndTime = Date.now();
        const totalToolTime = toolExecutionEndTime - toolExecutionStartTime;
        
        console.log(`⚙️  Tools executed (${totalToolTime}ms):`);
        toolResults.forEach(tr => {
          console.log(`   ${tr.name}: ${Math.round(tr.executionTime)}ms`);
        });
      } else {
        console.log(`🔧 No tools detected (${toolDetectionTime}ms)`);
      }
    }
    
    // Now test the main response with intelligent mode switching
    console.log('💬 Step 3: Main response phase...');
    
    // Apply our intelligent mode switching logic
    const hasTools = toolsCalled.length > 0;
    const modeDecision = analyzeQueryComplexity(scenario.message, hasTools, 0);
    
    console.log(`🧠 Intelligent system chose: ${modeDecision.mode} mode (${modeDecision.contextSize} tokens)`);
    console.log(`📋 Reason: ${modeDecision.reason}`);
    
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          { role: 'user', content: scenario.message },
          ...(hasToolDetection ? [
            { role: 'assistant', content: '', tool_calls: toolsCalled },
            ...toolResults.map(tr => ({
              role: 'tool',
              tool_name: tr.name,
              content: tr.result
            }))
          ] : [])
        ],
        stream: true,
        think: modeDecision.options.think, // Use intelligent decision
        options: {
          ...modeDecision.options,
          num_ctx: modeDecision.contextSize // Use dynamic context
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    console.log('📡 Response received, processing stream...');
    
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) throw new Error('No response body');
    
    let buffer = '';
    let reasoningText = '';
    let responseText = '';
    let hasReceivedFirstToken = false;
    let hasStartedThinking = false;
    let hasStartedResponse = false;
    let ollamaTimings = null;
    let modelLoadTime = null;
    let promptEvalTime = null;
    let evalTime = null;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        try {
          const chunk = JSON.parse(trimmed);
          const thinking = chunk?.message?.thinking;
          const content = chunk?.message?.content;
          
          // Capture Ollama timing information
          if (chunk.done && chunk.total_duration) {
            ollamaTimings = {
              total_duration: chunk.total_duration,
              load_duration: chunk.load_duration,
              prompt_eval_count: chunk.prompt_eval_count,
              prompt_eval_duration: chunk.prompt_eval_duration,
              eval_count: chunk.eval_count,
              eval_duration: chunk.eval_duration
            };
            
            // Convert nanoseconds to milliseconds
            modelLoadTime = chunk.load_duration ? Math.round(chunk.load_duration / 1000000) : null;
            promptEvalTime = chunk.prompt_eval_duration ? Math.round(chunk.prompt_eval_duration / 1000000) : null;
            evalTime = chunk.eval_duration ? Math.round(chunk.eval_duration / 1000000) : null;
            
            console.log(`🔥 Ollama timings received:`);
            if (modelLoadTime) console.log(`   Model load: ${modelLoadTime}ms`);
            if (promptEvalTime) console.log(`   Prompt eval: ${promptEvalTime}ms (${chunk.prompt_eval_count} tokens)`);
            if (evalTime) console.log(`   Generation: ${evalTime}ms (${chunk.eval_count} tokens)`);
            console.log(`   Total Ollama: ${Math.round(chunk.total_duration / 1000000)}ms`);
          }
          
          // Measure thinking start time
          if (thinking && !hasStartedThinking) {
            thinkingStartTime = Date.now();
            hasStartedThinking = true;
            console.log(`🧠 Thinking started: ${thinkingStartTime - startTime}ms`);
          }
          
          // Measure response start time
          if (content && !hasStartedResponse) {
            responseStartTime = Date.now();
            hasStartedResponse = true;
            console.log(`💬 Response started: ${responseStartTime - startTime}ms`);
          }
          
          // Measure first token time
          if ((thinking || content) && !hasReceivedFirstToken) {
            firstTokenTime = Date.now();
            hasReceivedFirstToken = true;
            console.log(`⚡ First token: ${firstTokenTime - startTime}ms`);
          }
          
          if (thinking) reasoningText += thinking;
          if (content) responseText += content;
          
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    // Analyze what mode was actually used
    const usedThinking = reasoningText.length > 0;
    const responseLength = responseText.length;
    
    let detectedMode = 'unknown';
    if (!usedThinking && responseLength < 500) {
      detectedMode = 'nothink';
    } else if (!usedThinking && responseLength >= 500) {
      detectedMode = 'balanced';
    } else if (usedThinking) {
      detectedMode = 'fullthink';
    }
    
    // Calculate tool overhead
    const toolOverhead = hasToolDetection ? 
      toolDetectionTime + (toolExecutionEndTime - toolExecutionStartTime) : 0;
    
    // Results
    console.log('\n📊 RESULTS:');
    console.log(`⏱️  Total time: ${totalTime}ms`);
    console.log(`⚡ First token: ${firstTokenTime ? firstTokenTime - startTime : 'N/A'}ms`);
    
    // Ollama detailed timing breakdown
    if (ollamaTimings) {
      console.log('\n🔥 OLLAMA PERFORMANCE BREAKDOWN:');
      if (modelLoadTime) {
        console.log(`   🚀 Model load: ${modelLoadTime}ms ${modelLoadTime > 1000 ? '(COLD START)' : '(warm)'}`);
      }
      if (promptEvalTime) {
        const tokensPerSec = ollamaTimings.prompt_eval_count / (promptEvalTime / 1000);
        console.log(`   📝 Prompt eval: ${promptEvalTime}ms (${ollamaTimings.prompt_eval_count} tokens, ${Math.round(tokensPerSec)} tok/s)`);
      }
      if (evalTime) {
        const tokensPerSec = ollamaTimings.eval_count / (evalTime / 1000);
        console.log(`   🧠 Generation: ${evalTime}ms (${ollamaTimings.eval_count} tokens, ${Math.round(tokensPerSec)} tok/s)`);
      }
      
      // Calculate cold start penalty
      const ollamaTotalMs = Math.round(ollamaTimings.total_duration / 1000000);
      const networkLatency = totalTime - ollamaTotalMs;
      console.log(`   🌐 Network latency: ${networkLatency}ms`);
      console.log(`   📊 Ollama efficiency: ${Math.round(ollamaTotalMs/totalTime*100)}%`);
      
      // Cold start detection
      if (modelLoadTime > 1000) {
        console.log(`   ❄️  COLD START DETECTED: ${modelLoadTime}ms model load time`);
      } else if (modelLoadTime > 100) {
        console.log(`   🔥 Warm start: ${modelLoadTime}ms model load time`);
      } else {
        console.log(`   ⚡ Hot model: ${modelLoadTime || 0}ms model load time`);
      }
    }
    
    if (hasToolDetection) {
      console.log(`\n🔧 TOOL PERFORMANCE:`);
      console.log(`   Detection: ${toolDetectionTime}ms`);
      console.log(`   Execution: ${toolExecutionEndTime - toolExecutionStartTime}ms`);
      console.log(`   Overhead: ${toolOverhead}ms (${Math.round(toolOverhead/totalTime*100)}%)`);
      console.log(`   Tools used: ${toolsCalled.map(t => t.name).join(', ')}`);
    } else {
      console.log(`\n🔧 No tools used`);
    }
    
    console.log(`\n🧠 REASONING PERFORMANCE:`);
    console.log(`   Thinking time: ${thinkingStartTime ? thinkingStartTime - startTime : 'N/A'}ms`);
    console.log(`   Response time: ${responseStartTime ? responseStartTime - startTime : 'N/A'}ms`);
    console.log(`   Mode used: ${detectedMode}`);
    console.log(`   Response length: ${responseLength} chars`);
    console.log(`   Thinking length: ${reasoningText.length} chars`);
    
    // Check if expectations met
    const modeMatch = detectedMode === scenario.expectedMode;
    const timeOk = totalTime < parseInt(scenario.expectedTime.replace(/[<>s]/g, '')) * 1000;
    
    console.log(`\n✅ Mode correct: ${modeMatch ? 'YES' : 'NO'}`);
    console.log(`✅ Time acceptable: ${timeOk ? 'YES' : 'NO'}`);
    console.log(`🔧 Tools expected: ${scenario.expectsTools ? 'YES' : 'NO'}, Used: ${hasToolDetection ? 'YES' : 'NO'}`);
    
    if (modeMatch && timeOk) {
      console.log('🎉 TEST PASSED');
    } else {
      console.log('❌ TEST FAILED');
    }
    
    return {
      scenario: scenario.name,
      success: modeMatch && timeOk,
      totalTime,
      firstTokenTime: firstTokenTime ? firstTokenTime - startTime : null,
      thinkingTime: thinkingStartTime ? thinkingStartTime - startTime : null,
      responseTime: responseStartTime ? responseStartTime - startTime : null,
      toolDetectionTime,
      toolExecutionTime: hasToolDetection ? toolExecutionEndTime - toolExecutionStartTime : null,
      toolOverhead,
      toolsCalled,
      toolResults,
      hasToolDetection,
      detectedMode,
      expectedMode: scenario.expectedMode,
      responseLength,
      thinkingLength: reasoningText.length,
      usedThinking,
      // Ollama timing data
      ollamaTimings,
      modelLoadTime,
      promptEvalTime,
      evalTime,
      isColdStart: modelLoadTime > 1000,
      networkLatency: ollamaTimings ? totalTime - Math.round(ollamaTimings.total_duration / 1000000) : null
    };
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.log(`❌ ERROR after ${totalTime}ms: ${error.message}`);
    
    return {
      scenario: scenario.name,
      success: false,
      error: error.message,
      totalTime
    };
  }
}

async function runRealPerformanceTest() {
  console.log('🚀 REAL AI Performance Test');
  console.log('This actually calls your AI model and measures real performance\n');
  console.log(`Model: ${MODEL_ID}`);
  console.log(`Endpoint: ${OLLAMA_URL}`);
  console.log(`Testing intelligent mode switching in production...\n`);
  
  console.log('=' .repeat(80));
  
  const results = [];
  
  for (let i = 0; i < REAL_TEST_SCENARIOS.length; i++) {
    const scenario = REAL_TEST_SCENARIOS[i];
    const result = await testRealAI(scenario);
    results.push(result);
    
    // Wait between tests to avoid overwhelming the model
    if (i < REAL_TEST_SCENARIOS.length - 1) {
      console.log('\n⏳ Waiting 5 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 PERFORMANCE SUMMARY\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log(`✅ Successful tests: ${successful.length}/${results.length}`);
    
    // Performance metrics
    const avgTotal = successful.reduce((sum, r) => sum + r.totalTime, 0) / successful.length;
    const avgFirstToken = successful.filter(r => r.firstTokenTime).reduce((sum, r) => sum + r.firstTokenTime, 0) / successful.filter(r => r.firstTokenTime).length;
    
    console.log(`⏱️  Average total time: ${Math.round(avgTotal)}ms`);
    console.log(`⚡ Average first token: ${Math.round(avgFirstToken)}ms`);
    
    // Tool metrics
    const toolTests = successful.filter(r => r.hasToolDetection);
    if (toolTests.length > 0) {
      const avgToolDetection = toolTests.reduce((sum, r) => sum + r.toolDetectionTime, 0) / toolTests.length;
      const avgToolExecution = toolTests.reduce((sum, r) => sum + (r.toolExecutionTime || 0), 0) / toolTests.length;
      const avgToolOverhead = toolTests.reduce((sum, r) => sum + r.toolOverhead, 0) / toolTests.length;
      
      console.log(`\n🔧 Tool Performance:`);
      console.log(`   Detection time: ${Math.round(avgToolDetection)}ms avg`);
      console.log(`   Execution time: ${Math.round(avgToolExecution)}ms avg`);
      console.log(`   Total overhead: ${Math.round(avgToolOverhead)}ms avg (${Math.round(avgToolOverhead/avgTotal*100)}%)`);
      
      // Tool usage accuracy
      const toolAccuracy = successful.filter(r => 
        (r.hasToolDetection && results.find(orig => orig.scenario === r.scenario)?.expectsTools) ||
        (!r.hasToolDetection && !results.find(orig => orig.scenario === r.scenario)?.expectsTools)
      ).length;
      
      console.log(`   Tool accuracy: ${toolAccuracy}/${successful.length} (${Math.round(toolAccuracy/successful.length*100)}%)`);
      
      // Most used tools
      const toolUsage = {};
      toolTests.forEach(r => {
        r.toolsCalled.forEach(tool => {
          toolUsage[tool.name] = (toolUsage[tool.name] || 0) + 1;
        });
      });
      
      if (Object.keys(toolUsage).length > 0) {
        console.log(`   Tools used: ${Object.entries(toolUsage).map(([name, count]) => `${name}(${count})`).join(', ')}`);
      }
    }
    
    // Mode accuracy
    const modeCorrect = successful.filter(r => r.detectedMode === r.expectedMode).length;
    console.log(`\n🎯 Mode accuracy: ${modeCorrect}/${successful.length} (${Math.round(modeCorrect/successful.length*100)}%)`);
    
    // Cold start analysis
    const firstTest = results[0];
    const subsequentTests = results.slice(1).filter(r => r.success);
    
    if (firstTest.success && subsequentTests.length > 0) {
      const avgSubsequent = subsequentTests.reduce((sum, r) => sum + r.totalTime, 0) / subsequentTests.length;
      const coldStartPenalty = firstTest.totalTime - avgSubsequent;
      
      console.log(`\n🧊 Cold start analysis:`);
      console.log(`   First test: ${firstTest.totalTime}ms`);
      console.log(`   Avg subsequent: ${Math.round(avgSubsequent)}ms`);
      console.log(`   Cold start penalty: ${Math.round(coldStartPenalty)}ms`);
    }
    
    // Mode distribution
    const modeDistribution = {};
    successful.forEach(r => {
      modeDistribution[r.detectedMode] = (modeDistribution[r.detectedMode] || 0) + 1;
    });
    
    console.log(`\n📈 Actual mode usage:`);
    Object.entries(modeDistribution).forEach(([mode, count]) => {
      const emoji = mode === 'nothink' ? '🚀' : mode === 'balanced' ? '⚖️' : '🧠';
      console.log(`   ${emoji} ${mode}: ${count} tests`);
    });
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed tests: ${failed.length}`);
    failed.forEach(f => {
      console.log(`   ${f.scenario}: ${f.error || 'Performance not met'}`);
    });
  }
  
  console.log('\n🎯 DEPLOYMENT NOTES:');
  console.log('📦 This intelligent system can be deployed to your server');
  console.log('🌐 The logic runs in your chat provider (React component)');
  console.log('🚀 No separate server needed - it\'s built into your app');
  console.log('⚡ Works with any Ollama endpoint (local or hosted)');
  console.log('🔧 Context size can be increased to 156K if needed');
}

// Add command line options
if (process.argv.includes('--help')) {
  console.log('Real AI Performance Test');
  console.log('');
  console.log('Usage: node test-real-ai-performance.js [options]');
  console.log('');
  console.log('This test actually calls your AI model to measure real performance.');
  console.log('It will take several minutes to complete.');
  console.log('');
  process.exit(0);
}

runRealPerformanceTest().catch(console.error);