export interface VerifyOptions {
  algorithm?: string;
}

export async function verify(
  filename: string,
  opts: VerifyOptions
): Promise<void> {}
