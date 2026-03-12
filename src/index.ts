import dotenv from "dotenv";
dotenv.config();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TranslatorService } from "./services/translator.service.js";

const translatorService = new TranslatorService();

const server = new Server(
  {
    name: "koen-translator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * 도구 목록 정의
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "translate_prompt",
        description: "Translate Korean prompt to English to save tokens and improve model performance.",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "The Korean text to translate",
            },
          },
          required: ["text"],
        },
      },
    ],
  };
});

/**
 * 도구 호출 핸들러
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "translate_prompt") {
    const text = request.params.arguments?.text as string;
    
    if (!text) {
      throw new Error("Text is required for translation");
    }

    try {
      const result = await translatorService.translateToEnglish(text);
      return {
        content: [
          {
            type: "text",
            text: result.translatedText,
          },
        ],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error during translation: ${error.message}`,
          },
        ],
      };
    }
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});

/**
 * 서버 실행
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("KoEn-Translator MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
