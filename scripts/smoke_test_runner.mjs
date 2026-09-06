// Dedicated Smoke Test Runner for Phase H.9.11.1 Conformance Report
const ZEABUR_API_TOKEN = process.env.ZEABUR_API_TOKEN;
const WORKER_SERVICE_ID = '6a9a7b5baeaf8610e9063a31';
const LOCAL_AI_SERVICE_ID = '6a9adc49aeaf8610e906611a';
const ENVIRONMENT_ID = '6a9a7ac1a34c0097521fed57';

async function execOnWorker(scriptContent) {
  const query = `mutation($cmd: [String!]!) {
    executeCommand(
      serviceID: "${WORKER_SERVICE_ID}",
      environmentID: "${ENVIRONMENT_ID}",
      command: $cmd
    ) {
      exitCode
      output
    }
  }`;
  const res = await fetch('https://api.zeabur.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + ZEABUR_API_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables: { cmd: ['node', '-e', scriptContent] } })
  });
  const data = await res.json();
  return data.data?.executeCommand?.output || '';
}

async function execOnLocalAI(cmdArray) {
  const query = `mutation($cmd: [String!]!) {
    executeCommand(
      serviceID: "${LOCAL_AI_SERVICE_ID}",
      environmentID: "${ENVIRONMENT_ID}",
      command: $cmd
    ) {
      exitCode
      output
    }
  }`;
  const res = await fetch('https://api.zeabur.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + ZEABUR_API_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables: { cmd: cmdArray } })
  });
  const data = await res.json();
  return data.data?.executeCommand?.output || '';
}

async function main() {
  console.log('=== STARTING PHASE H.9.11.1 SMOKE TESTS ===');

  // Test 1: Health
  const test1Code = `
    const t0 = Date.now();
    fetch('http://eve-local-ai.zeabur.internal:8080/health')
      .then(r => r.json())
      .then(d => console.log('TEST1_RESULT:' + JSON.stringify({ status: 200, body: d, latencyMs: Date.now() - t0 })))
      .catch(e => console.log('TEST1_ERR:' + e.message));
  `;
  const out1 = await execOnWorker(test1Code);
  console.log(out1.trim());

  // Test 2: Models
  const test2Code = `
    fetch('http://eve-local-ai.zeabur.internal:8080/v1/models')
      .then(r => r.json())
      .then(d => console.log('TEST2_RESULT:' + JSON.stringify(d)))
      .catch(e => console.log('TEST2_ERR:' + e.message));
  `;
  const out2 = await execOnWorker(test2Code);
  console.log(out2.trim());

  // Helper for AI queries
  async function runAI(name, systemPrompt, userPrompt, maxTokens = 384) {
    const payload = JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.0,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' }
    });
    const code = `
      const t0 = Date.now();
      fetch('http://eve-local-ai.zeabur.internal:8080/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(${JSON.stringify(JSON.parse(payload))})
      })
        .then(r => r.json())
        .then(d => {
          let content = d.choices?.[0]?.message?.content?.trim() || '';
          if (!content && d.choices?.[0]?.message?.reasoning_content) {
            const m = d.choices[0].message.reasoning_content.match(/\\{[\\s\\S]*\\}/);
            if (m) content = m[0];
          }
          console.log('${name}_RESULT:' + JSON.stringify({
            content,
            reasoningSample: (d.choices?.[0]?.message?.reasoning_content || '').slice(0, 100),
            latencyMs: Date.now() - t0,
            usage: d.usage
          }));
        })
        .catch(e => console.log('${name}_ERR:' + e.message));
    `;
    const out = await execOnWorker(code);
    console.log(out.trim());
  }

  // Test 3: Income Statement Classification
  console.log('Running Test 3 (Income statement classification)...');
  await runAI(
    'TEST3',
    'You are a CPA. Output JSON: {"statementType": "INCOME_STATEMENT" | "BALANCE_SHEET" | "CASH_FLOW_STATEMENT", "confidence": number}',
    'Classify: Revenues EUR 10.5B, Cost of Sales EUR 6.2B, Gross Profit EUR 4.3B, Operating Profit EUR 1.8B'
  );

  // Test 4: Ambiguous financial row classification
  console.log('Running Test 4 (Ambiguous financial row)...');
  await runAI(
    'TEST4',
    'You are a financial analyst. Map row to IFRS statement category. Output JSON: {"canonicalMapping": string, "category": string, "confidence": number}',
    'Row label: "Operating working capital changes and provisions in ongoing operations"'
  );

  // Test 5: Subsidiary vs parent entity classification
  console.log('Running Test 5 (Subsidiary vs parent entity)...');
  await runAI(
    'TEST5',
    'You are a legal entity analyst. Output JSON: {"entityType": "PARENT" | "SUBSIDIARY" | "EXTERNAL", "confidence": number}',
    'Parent entity: Heineken N.V. Target entity: Heineken Supply Chain B.V.'
  );

  // Test 6: Multi-language or foreign accounting term
  console.log('Running Test 6 (Multi-language term)...');
  await runAI(
    'TEST6',
    'You are an accounting translator. Output JSON: {"englishStandardTerm": string, "ifrsCategory": string, "confidence": number}',
    'Term: "Umsatzerlöse" (German IFRS statement)'
  );

  // Test 7: Low-confidence / escalation trigger
  console.log('Running Test 7 (Low-confidence escalation trigger)...');
  await runAI(
    'TEST7',
    'You are a strict financial classifier. If input is nonsensical or non-financial, confidence MUST be below 0.3. Output JSON: {"valid": boolean, "confidence": number, "reason": string}',
    'Row label: "qwerty asdf zxcvb 98765 random glyphs #$%^"'
  );

  // Test 8: Resource Safety Check
  console.log('Running Test 8 (Resource safety: RSS, CPU, Process status)...');
  const psLocalAI = await execOnLocalAI(['ps', 'aux']);
  console.log('LOCAL_AI_PS:\n' + psLocalAI.trim());
  const psWorker = await execOnWorker('const { execSync } = require("child_process"); console.log(execSync("ps aux").toString());');
  console.log('WORKER_PS:\n' + psWorker.trim());
}

main().catch(err => console.error(err));
