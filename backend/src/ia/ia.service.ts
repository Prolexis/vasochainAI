import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export interface ResultadoValidacionIa {
  valido: boolean;
  confianza: number;
  motivo: string;
}

type ProveedorIA = 'anthropic' | 'openai';

/**
 * Servicio de validación de evidencias fotográficas mediante IA con
 * visión. Soporta dos proveedores:
 * - Anthropic Claude (claude-sonnet-4-20250514)
 * - OpenAI GPT-4o
 *
 * Selecciona el proveedor según AI_PROVIDER en .env, o auto-detecta
 * según qué API key esté configurada. Si no hay ninguna key, lanza
 * error controlado sin tumbar el sistema.
 */
@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);
  private readonly proveedor: ProveedorIA | null;
  private readonly anthropicClient: Anthropic | null;
  private readonly openaiClient: OpenAI | null;

  constructor(private readonly config: ConfigService) {
    // Detectar proveedor
    const proveedorExplícito = this.config.get<string>('AI_PROVIDER');
    const anthropicKey = this.config.get<string>('ANTHROPIC_API_KEY');
    const openaiKey = this.config.get<string>('OPENAI_API_KEY');

    const anthropicConfigurada =
      anthropicKey && anthropicKey !== 'tu_api_key_de_anthropic_aqui';
    const openaiConfigurada =
      openaiKey && openaiKey !== 'tu_api_key_de_openai_aqui';

    if (proveedorExplícito === 'openai' && openaiConfigurada) {
      this.proveedor = 'openai';
      this.openaiClient = new OpenAI({ apiKey: openaiKey });
      this.anthropicClient = null;
    } else if (proveedorExplícito === 'anthropic' && anthropicConfigurada) {
      this.proveedor = 'anthropic';
      this.anthropicClient = new Anthropic({ apiKey: anthropicKey });
      this.openaiClient = null;
    } else if (openaiConfigurada) {
      this.proveedor = 'openai';
      this.openaiClient = new OpenAI({ apiKey: openaiKey });
      this.anthropicClient = null;
      this.logger.log('Proveedor IA: OpenAI (auto-detectado)');
    } else if (anthropicConfigurada) {
      this.proveedor = 'anthropic';
      this.anthropicClient = new Anthropic({ apiKey: anthropicKey });
      this.openaiClient = null;
      this.logger.log('Proveedor IA: Anthropic (auto-detectado)');
    } else {
      this.proveedor = null;
      this.anthropicClient = null;
      this.openaiClient = null;
      this.logger.warn(
        'Ninguna API key de IA configurada (ANTHROPIC_API_KEY ni OPENAI_API_KEY). El módulo de validación IA estará deshabilitado hasta que se configure una en el .env',
      );
    }
  }

  estaDisponible(): boolean {
    return this.proveedor !== null;
  }

  /**
   * Envía la imagen (base64) al proveedor de IA configurado y devuelve
   * {valido, confianza, motivo} parseado desde la respuesta JSON.
   */
  async validarEvidenciaEntrega(
    imagenBase64: string,
    mediaType: string,
  ): Promise<ResultadoValidacionIa> {
    if (!this.proveedor) {
      throw new Error(
        'Servicio de IA no disponible: configura ANTHROPIC_API_KEY u OPENAI_API_KEY en el .env',
      );
    }

    const prompt = `Eres un validador automático de evidencias del Programa Vaso de Leche (programa social de distribución de alimentos en Perú).

Analiza la imagen adjunta y determina si muestra evidencia razonable de una entrega real de alimentos: por ejemplo, bolsas de víveres, productos alimenticios, una persona recibiendo o sosteniendo alimentos, o una escena de reparto comunitario.

Responde EXCLUSIVAMENTE con un objeto JSON, sin texto adicional, sin markdown, con este formato exacto:
{"valido": true o false, "confianza": numero entre 0 y 1, "motivo": "explicación breve en español"}`;

    if (this.proveedor === 'anthropic') {
      return this.validarConAnthropic(imagenBase64, mediaType, prompt);
    }
    return this.validarConOpenAI(imagenBase64, mediaType, prompt);
  }

  private async validarConAnthropic(
    imagenBase64: string,
    mediaType: string,
    prompt: string,
  ): Promise<ResultadoValidacionIa> {
    const response = await this.anthropicClient!.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as
                  | 'image/jpeg'
                  | 'image/png'
                  | 'image/gif'
                  | 'image/webp',
                data: imagenBase64,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const rawText = textBlock && 'text' in textBlock ? textBlock.text : '';

    return this.parsearRespuesta(rawText);
  }

  private async validarConOpenAI(
    imagenBase64: string,
    mediaType: string,
    prompt: string,
  ): Promise<ResultadoValidacionIa> {
    // OpenAI solo acepta image/jpeg, image/png, image/gif, image/webp.
    // Si el MIME type viene como application/octet-stream (ej: curl que
    // no detecta webp), lo normalizamos a image/jpeg.
    const mimePermitido = mediaType.startsWith('image/')
      ? mediaType
      : 'image/jpeg';
    const dataUrl = `data:${mimePermitido};base64,${imagenBase64}`;

    const response = await this.openaiClient!.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const rawText = response.choices[0]?.message?.content || '';

    return this.parsearRespuesta(rawText);
  }

  private parsearRespuesta(rawText: string): ResultadoValidacionIa {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      return {
        valido: Boolean(parsed.valido),
        confianza:
          typeof parsed.confianza === 'number' ? parsed.confianza : 0,
        motivo:
          typeof parsed.motivo === 'string'
            ? parsed.motivo
            : 'Sin motivo especificado por el modelo.',
      };
    } catch (error) {
      this.logger.error(
        `No se pudo parsear la respuesta de la IA: ${rawText}`,
      );
      return {
        valido: false,
        confianza: 0,
        motivo: 'Error al interpretar la respuesta del modelo de IA.',
      };
    }
  }
}
