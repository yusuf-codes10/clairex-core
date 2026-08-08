export class ClaireResponse {
  private status: number;

  constructor(status: number = 200) {
    this.status = status;
  }

  json(data: unknown, status: number = 200) {
    this.status = status;
    return new Response(JSON.stringify(data), {
      status: this.status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
