import * as http from "@actions/http-client";

export type Bundle = { [key: string]: any };
export type Attestation = {
  bundle: Bundle;
};

type AttestationsResponse = {
  attestations: Attestation[];
};

export interface ClientOptions {
  userAgent?: string;
  githubToken?: string;
}

export class Client {
  private httpClient: http.HttpClient;
  constructor(opts?: ClientOptions) {
    const userAgent = opts?.userAgent || "@shogo82148/attestation-verify";
    const headers: { [key: string]: string } = {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    };
    if (opts?.githubToken) {
      headers.authorization = `Bearer ${opts.githubToken}`;
    }
    this.httpClient = new http.HttpClient(userAgent, [], {
      headers: headers,
    });
  }

  async getByRepoAndDigest(
    repo: string,
    digest: string
  ): Promise<Attestation[]> {
    const url = `https://api.github.com/repos/${repo}/attestations/${digest}`;
    return await this.get(url);
  }

  async getByOwnerAndDigest(
    owner: string,
    digest: string
  ): Promise<Attestation[]> {
    const url = `https://api.github.com/orgs/${owner}/${digest}`;
    return await this.get(url);
  }

  private async get(url: string): Promise<Attestation[]> {
    const response = await this.httpClient.getJson<AttestationsResponse>(url);
    // TODO: pagination
    // TODO: error handling
    return response.result?.attestations ?? [];
  }
}
