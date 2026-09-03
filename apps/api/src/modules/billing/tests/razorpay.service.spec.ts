import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { RazorpayService } from "../services/razorpay.service";

describe("RazorpayService", () => {
  let service: RazorpayService;
  const keySecret = "rzp_test_secret_12345";
  const webhookSecret = "test_webhook_secret_12345";

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RazorpayService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "RAZORPAY_KEY_ID") return "rzp_test_key";
              if (key === "RAZORPAY_KEY_SECRET") return keySecret;
              if (key === "RAZORPAY_WEBHOOK_SECRET") return webhookSecret;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RazorpayService>(RazorpayService);
    
    // Mock the internal razorpay instance orders.create
    if ((service as any).razorpayInstance) {
      (service as any).razorpayInstance.orders = {
        create: jest.fn().mockImplementation(async (params) => ({
          id: "order_mock_123456",
          amount: params.amount,
          currency: params.currency,
          receipt: params.receipt,
        })),
      };
    }
  });

  it("should create order for PRO plan", async () => {
    const order = await service.createOrder({
      userId: "user-123456",
      email: "candidate@example.com",
      plan: "PRO",
    });

    expect(order.amount).toBe(240000);
    expect(order.currency).toBe("INR");
    expect(order.plan).toBe("PRO");
    expect(order.keyId).toBe("rzp_test_key");
    expect(order.order_id).toBe("order_mock_123456");
  });

  it("should verify valid payment signature", () => {
    const orderId = "order_9A33XWu170gUtm";
    const paymentId = "pay_29AeHIaeQErwhh";
    const payload = `${orderId}|${paymentId}`;

    const signature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    const isValid = service.verifyPaymentSignature({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });

    expect(isValid).toBe(true);
  });

  it("should reject forged payment signature", () => {
    const orderId = "order_9A33XWu170gUtm";
    const paymentId = "pay_29AeHIaeQErwhh";

    const forgedSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    const isValid = service.verifyPaymentSignature({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: forgedSignature,
    });

    expect(isValid).toBe(false);
  });

  it("should verify valid webhook signature", () => {
    const payload = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_123" } } },
    });

    const signature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    const isValid = service.verifyWebhookSignature(payload, signature);
    expect(isValid).toBe(true);
  });

  it("should reject forged webhook signature", () => {
    const payload = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_123" } } },
    });

    const forgedSignature = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    const isValid = service.verifyWebhookSignature(payload, forgedSignature);
    expect(isValid).toBe(false);
  });
});
