import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface TranslationResult {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

export class TranslatorService {
  private readonly openaiKey: string;
  private readonly geminiKey: string;

  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY || '';
    this.geminiKey = process.env.GEMINI_API_KEY || '';
  }

  /**
   * 한국어 프롬프트를 영어로 번역합니다.
   * Gemini API 키가 있으면 Gemini를, 없으면 OpenAI를 사용합니다.
   */
  async translateToEnglish(text: string): Promise<TranslationResult> {
    if (this.geminiKey) {
      return this.translateWithGemini(text);
    } else if (this.openaiKey) {
      return this.translateWithOpenAI(text);
    }

    console.warn('Warning: No API Key found. Returning original text.');
    return { translatedText: `[Untranslated] ${text}`, sourceLang: 'KO', targetLang: 'EN' };
  }

  private async translateWithGemini(text: string): Promise<TranslationResult> {
    // v1beta 및 gemini-1.5-flash-latest 사용하여 최신 모델 접근 및 안정성 확보
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${this.geminiKey}`;
    try {
      const response = await axios.post(url, {
        contents: [{
          parts: [{
            text: `Translate the following Korean prompt into English for a large language model. Keep technical terms as they are and only output the translation: "${text}"`
          }]
        }]
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('No translation candidates returned from Gemini');
      }

      const translated = response.data.candidates[0].content.parts[0].text.trim();
      return { translatedText: translated, sourceLang: 'KO', targetLang: 'EN' };
    } catch (error: any) {
      const status = error.response?.status;
      const data = JSON.stringify(error.response?.data);
      console.error(`Gemini API Error [${status}]:`, data || error.message);
      
      if (status === 404) {
        throw new Error(`Gemini model not found (404). Endpoint: ${url.split('?')[0]}`);
      }
      throw new Error(`Gemini translation failed [${status}]: ${error.message}`);
    }
  }

  private async translateWithOpenAI(text: string): Promise<TranslationResult> {
    const url = 'https://api.openai.com/v1/chat/completions';
    try {
      const response = await axios.post(
        url,
        {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a professional translator. Translate the Korean prompt to English." },
            { role: "user", content: text }
          ],
          temperature: 0.3,
        },
        { headers: { 'Authorization': `Bearer ${this.openaiKey}` } }
      );

      return {
        translatedText: response.data.choices[0].message.content.trim(),
        sourceLang: 'KO', targetLang: 'EN'
      };
    } catch (error: any) {
      throw new Error(`OpenAI translation failed: ${error.message}`);
    }
  }
}
