import { LLMAgent } from "../../core/llmagent";
import { Investigator } from "../../core/investigator";
import { CodeFile } from '../../core/codefile';
import { GeminiAgent } from "../../app/geminiagent";
import { Config } from "../../app/config";


describe("InvestigatorGeneration", () => {
  it("should generate valid OpenAPI documentation", async () => {
    const config = Config.load();
    const apiKey = config.requiredFromEnv("GEMINI_API_KEY");

    const agent = new GeminiAgent(apiKey);
    const investigator = new Investigator(agent);
    const codefile = new CodeFile("api.controller.ts");

    codefile.write(`
    const express = require('express')
    const app = express()
    const port = 3000

    app.get('/', (req, res) => {
      res.send('Hello World!')
    })

    app.listen(port, () => {
      console.log('Example app listening on 8080')
    })
  `);

    const oas = await investigator.generateOas(codefile);

    expect(oas).toBeDefined();
    expect(oas).toContain("openapi:");
    expect(oas).toContain("3.0.0");
    expect(oas).toContain("info:");
    expect(oas).toContain("paths:");
    expect(oas).toContain("get:");
    expect(oas).toContain("responses:");
  });
})