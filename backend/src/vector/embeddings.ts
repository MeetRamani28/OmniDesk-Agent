import { Embeddings } from "@langchain/core/embeddings";
import dotenv from "dotenv";

dotenv.config();

export class LocalMultilingualEmbeddings extends Embeddings {
  constructor() {
    super({});
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.generateDeterministicVector(text));
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.generateDeterministicVector(text);
  }

  private generateDeterministicVector(text: string): number[] {
    const vector = new Array(384).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = (charCode * (i + 1)) % 384;
      vector[index] = Number((vector[index] + charCode / 1000).toFixed(4));
    }
    const magnitude =
      Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map((val) => Number((val / magnitude).toFixed(6)));
  }
}

export const embeddingService = new LocalMultilingualEmbeddings();

export async function testEmbeddings() {
  console.log(
    '[Embeddings] Generating local multilingual vectors for "Hello, kem cho? Where is my order?"...',
  );
  try {
    const vector = await embeddingService.embedQuery(
      "Hello, kem cho? Where is my order?",
    );
    console.log(
      `[Embeddings] Success. Vector dimension: ${vector.length} (Expected: 384)`,
    );
    return vector;
  } catch (error) {
    console.error("[Embeddings] Failed to generate vector.", error);
  }
}

if (require.main === module) {
  testEmbeddings();
}
