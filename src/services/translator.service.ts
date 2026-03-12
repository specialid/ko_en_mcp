import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface TranslationResult {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

export class TranslatorService {
  private readonly geminiKey: string;

  constructor() {
    this.geminiKey = process.env.GEMINI_API_KEY || '';
  }

  /**
   * 한국어 프롬프트를 영어로 번역합니다.
   * Gemini API를 사용하여 번역을 수행합니다.
   */
  async translateToEnglish(text: string): Promise<TranslationResult> {
    if (this.geminiKey) {
      return await this.translateWithGemini(text);
    }

    console.warn('Warning: No Gemini API Key found. Returning original text.');
    return { translatedText: `[Untranslated] ${text}`, sourceLang: 'KO', targetLang: 'EN' };
  }

  private async translateWithGemini(text: string): Promise<TranslationResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${this.geminiKey}`;
    const payload = {
      contents: [{
        parts: [{
          text: `Translate the following Korean prompt into English for a large language model. Keep technical terms as they are and only output the translation: "${text}"`
        }]
      }]
    };
    
    try {
      console.error(`Attempting Gemini API call to: ${url.split('?')[0]}`);
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (!response.data.candidates || response.data.candidates.length === 0) {
        throw new Error('No translation candidates returned from Gemini');
      }

      const translated = response.data.candidates[0].content.parts[0].text.trim();
      return { translatedText: translated, sourceLang: 'KO', targetLang: 'EN' };
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;
      
      console.error(`Gemini API Error Detail [${status}]:`, JSON.stringify(data, null, 2));
      
      if (status === 403 && data?.error?.message?.includes('leaked')) {
        throw new Error('GEMINI_API_KEY_LEAKED: The provided API key is marked as leaked by Google.');
      }
      
      throw new Error(`Gemini translation failed [${status}]: ${error.message}${data ? ' - ' + JSON.stringify(data) : ''}`);
    }
  }
}
