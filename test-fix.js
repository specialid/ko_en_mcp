import { TranslatorService } from './dist/services/translator.service.js';
import dotenv from 'dotenv';
dotenv.config();

const service = new TranslatorService();
service.translateToEnglish('안녕하세요').then(res => {
  console.log('Success:', res);
}).catch(err => {
  console.error('Failed:', err.message);
});
