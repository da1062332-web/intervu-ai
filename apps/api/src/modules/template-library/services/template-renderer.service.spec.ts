import { TemplateRendererService } from "./template-renderer.service";

describe("TemplateRendererService", () => {
  let service: TemplateRendererService;

  beforeEach(() => {
    service = new TemplateRendererService();
  });

  it("should replace valid placeholders", () => {
    const template = "Correct answer is {{answer}} because {{explanation}}";
    const payload = { answer: "42", explanation: "derived from formula" };
    const result = service.render(template, payload);
    expect(result.renderedOutput).toBe(
      "Correct answer is 42 because derived from formula",
    );
    expect(result.resolvedVariables).toEqual({
      answer: "42",
      explanation: "derived from formula",
    });
  });

  it("should ignore missing payload keys", () => {
    const template = "Correct answer is {{answer}} because {{explanation}}";
    const payload = { answer: "42" };
    const result = service.render(template, payload);
    expect(result.renderedOutput).toBe(
      "Correct answer is 42 because {{explanation}}",
    );
    expect(result.resolvedVariables).toEqual({ answer: "42" });
  });

  it("should stringify object values", () => {
    const template = "Data: {{data}}";
    const payload = { data: { x: 1 } };
    const result = service.render(template, payload);
    expect(result.renderedOutput).toBe('Data: {"x":1}');
    expect(result.resolvedVariables).toEqual({ data: { x: 1 } });
  });
});
