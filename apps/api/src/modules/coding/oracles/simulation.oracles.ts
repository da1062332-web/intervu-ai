import { Injectable } from "@nestjs/common";
import { BaseOracle } from "./base.oracle";

/**
 * 70. SIMULATION_BANK_ACCOUNT_ORACLE
 */
@Injectable()
export class SimulationBankAccountOracle extends BaseOracle {
  readonly key = "SIMULATION_BANK_ACCOUNT_ORACLE";
  readonly name = "Bank Account Simulation";
  readonly category = "SIMULATION";
  readonly description = "Simulates a bank account processing sequential deposit and withdrawal transactions.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    initialBalance: { type: "integer", min: 100, max: 50000, default: 5000 },
    depositCount: { type: "integer", min: 1, max: 5, default: 2 },
    withdrawCount: { type: "integer", min: 1, max: 5, default: 2 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const initialBalance = typeof parameters.initialBalance === "number" ? parameters.initialBalance : 5000;
    const depCount = typeof parameters.depositCount === "number" ? parameters.depositCount : 2;
    const withCount = typeof parameters.withdrawCount === "number" ? parameters.withdrawCount : 2;

    const transactions = [];
    for (let i = 0; i < depCount; i++) {
      transactions.push({ type: "DEPOSIT", amount: (i + 1) * 1000 });
    }
    for (let i = 0; i < withCount; i++) {
      transactions.push({ type: "WITHDRAW", amount: (i + 1) * 2500 });
    }

    return { initialBalance, transactions };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const initialBalance = typeof input.initialBalance === "number" ? input.initialBalance : 0;
    const transactions = Array.isArray(input.transactions) ? input.transactions : [];

    let currentBalance = initialBalance;
    const history: Array<{ type: string; amount: number; balanceAfter: number; status: string }> = [];

    for (const tx of transactions) {
      const type = tx.type;
      const amount = typeof tx.amount === "number" ? tx.amount : 0;

      if (type === "DEPOSIT") {
        currentBalance += amount;
        history.push({ type, amount, balanceAfter: currentBalance, status: "SUCCESS" });
      } else if (type === "WITHDRAW") {
        if (currentBalance >= amount) {
          currentBalance -= amount;
          history.push({ type, amount, balanceAfter: currentBalance, status: "SUCCESS" });
        } else {
          history.push({ type, amount, balanceAfter: currentBalance, status: "FAILED_INSUFFICIENT_FUNDS" });
        }
      }
    }

    return {
      initialBalance,
      finalBalance: currentBalance,
      successfulTransactions: history.filter((h) => h.status === "SUCCESS").length,
      failedTransactions: history.filter((h) => h.status !== "SUCCESS").length,
      history,
      result: currentBalance,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.initialBalance !== "number") errors.push("Input property 'initialBalance' must be a number.");
    if (!Array.isArray(input.transactions)) errors.push("Input property 'transactions' must be an array.");
    return errors;
  }
}

/**
 * 71. SIMULATION_ATM_TRANSACTION_ORACLE
 */
@Injectable()
export class SimulationAtmTransactionOracle extends BaseOracle {
  readonly key = "SIMULATION_ATM_TRANSACTION_ORACLE";
  readonly name = "ATM Note Dispenser Simulation";
  readonly category = "SIMULATION";
  readonly description = "Simulates ATM currency note dispensing across available denominations.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    amount: { type: "integer", min: 100, max: 20000, default: 3800 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const amount = typeof parameters.amount === "number" ? Math.max(100, parameters.amount) : 3800;
    const roundedAmount = Math.floor(amount / 100) * 100;
    const denominations = [2000, 500, 200, 100];
    return { amount: roundedAmount, denominations };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const amount = typeof input.amount === "number" ? input.amount : 0;
    const denominations = Array.isArray(input.denominations) ? [...input.denominations].sort((a, b) => b - a) : [2000, 500, 200, 100];

    let remaining = amount;
    const breakdown: Record<string, number> = {};
    let totalNotes = 0;

    for (const den of denominations) {
      if (typeof den === "number" && den > 0 && remaining >= den) {
        const count = Math.floor(remaining / den);
        breakdown[String(den)] = count;
        totalNotes += count;
        remaining %= den;
      }
    }

    const success = remaining === 0;

    return {
      success,
      amount,
      breakdown: success ? breakdown : {},
      totalNotes: success ? totalNotes : 0,
      dispensed: success,
      result: success ? totalNotes : -1,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.amount !== "number" || input.amount < 0) {
      errors.push("Input property 'amount' must be a non-negative number.");
    }
    return errors;
  }
}

/**
 * 72. SIMULATION_INVENTORY_ORACLE
 */
@Injectable()
export class SimulationInventoryOracle extends BaseOracle {
  readonly key = "SIMULATION_INVENTORY_ORACLE";
  readonly name = "Warehouse Inventory Simulation";
  readonly category = "SIMULATION";
  readonly description = "Simulates warehouse stock management with RESTOCK and PURCHASE operations.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    initialStock: { type: "integer", min: 10, max: 100, default: 50 },
    purchaseQty: { type: "integer", min: 1, max: 30, default: 15 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const initialStock = typeof parameters.initialStock === "number" ? parameters.initialStock : 50;
    const purchaseQty = typeof parameters.purchaseQty === "number" ? parameters.purchaseQty : 15;

    const inventory: Record<string, { stock: number; unitPrice: number }> = {
      ITEM_A: { stock: initialStock, unitPrice: 100 },
      ITEM_B: { stock: initialStock + 20, unitPrice: 250 },
    };

    const operations = [
      { type: "PURCHASE", item: "ITEM_A", quantity: purchaseQty },
      { type: "RESTOCK", item: "ITEM_A", quantity: 20 },
      { type: "PURCHASE", item: "ITEM_B", quantity: purchaseQty * 2 },
    ];

    return { inventory, operations };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const inventory = input.inventory && typeof input.inventory === "object" ? JSON.parse(JSON.stringify(input.inventory)) : {};
    const operations = Array.isArray(input.operations) ? input.operations : [];

    let totalRevenue = 0;
    const log: Array<{ type: string; item: string; quantity: number; status: string }> = [];

    for (const op of operations) {
      const itemKey = op.item;
      const qty = typeof op.quantity === "number" ? op.quantity : 0;

      if (!inventory[itemKey]) {
        log.push({ ...op, status: "ITEM_NOT_FOUND" });
        continue;
      }

      if (op.type === "RESTOCK") {
        inventory[itemKey].stock += qty;
        log.push({ ...op, status: "RESTOCKED" });
      } else if (op.type === "PURCHASE") {
        if (inventory[itemKey].stock >= qty) {
          inventory[itemKey].stock -= qty;
          totalRevenue += qty * (inventory[itemKey].unitPrice || 0);
          log.push({ ...op, status: "PURCHASED" });
        } else {
          log.push({ ...op, status: "OUT_OF_STOCK" });
        }
      }
    }

    return {
      finalInventory: inventory,
      totalRevenue,
      log,
      result: totalRevenue,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!input.inventory || typeof input.inventory !== "object") {
      errors.push("Input property 'inventory' must be an object.");
    }
    return errors;
  }
}

/**
 * 73. SIMULATION_BILLING_ORACLE
 */
@Injectable()
export class SimulationBillingOracle extends BaseOracle {
  readonly key = "SIMULATION_BILLING_ORACLE";
  readonly name = "POS Billing & Loyalty Simulation";
  readonly category = "SIMULATION";
  readonly description = "Simulates point-of-sale itemized invoice with promo discounts, membership tier rates, and tax.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    membershipTier: { type: "enum", options: ["GOLD", "SILVER", "REGULAR"], default: "GOLD" },
    cartTotal: { type: "integer", min: 500, max: 20000, default: 4500 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const tier = parameters.membershipTier || "GOLD";
    const cartTotal = typeof parameters.cartTotal === "number" ? parameters.cartTotal : 4500;

    const items = [
      { name: "Electronics", price: Math.round(cartTotal * 0.6) },
      { name: "Accessories", price: Math.round(cartTotal * 0.4) },
    ];

    return { membershipTier: tier, items, taxRate: 18 };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const tier = input.membershipTier || "REGULAR";
    const items = Array.isArray(input.items) ? input.items : [];
    const taxRate = typeof input.taxRate === "number" ? input.taxRate : 18;

    const subtotal = items.reduce((acc, curr) => acc + (typeof curr.price === "number" ? curr.price : 0), 0);

    let tierDiscountPct = 0;
    if (tier === "GOLD") tierDiscountPct = 15;
    else if (tier === "SILVER") tierDiscountPct = 10;
    else tierDiscountPct = 0;

    const discountAmount = Math.round((subtotal * tierDiscountPct) / 100);
    const discounted = subtotal - discountAmount;
    const taxAmount = Math.round((discounted * taxRate) / 100);
    const finalAmount = discounted + taxAmount;

    return {
      subtotal,
      membershipTier: tier,
      tierDiscountPct,
      discountAmount,
      taxRate,
      taxAmount,
      finalAmount,
      result: finalAmount,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.items)) errors.push("Input property 'items' must be an array.");
    return errors;
  }
}

/**
 * 74. SIMULATION_LIBRARY_FINE_ORACLE
 */
@Injectable()
export class SimulationLibraryFineOracle extends BaseOracle {
  readonly key = "SIMULATION_LIBRARY_FINE_ORACLE";
  readonly name = "Library Overdue Fine Simulation";
  readonly category = "SIMULATION";
  readonly description = "Calculates overdue book fines using progressive day slabs and membership discounts.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    daysOverdue: { type: "integer", min: 0, max: 60, default: 12 },
    membershipType: { type: "enum", options: ["STUDENT", "FACULTY", "GUEST"], default: "STUDENT" },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const days = typeof parameters.daysOverdue === "number" ? Math.max(0, parameters.daysOverdue) : 12;
    const mem = parameters.membershipType || "STUDENT";
    return { daysOverdue: days, membershipType: mem };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const days = typeof input.daysOverdue === "number" ? Math.max(0, input.daysOverdue) : 0;
    const mem = input.membershipType || "STUDENT";

    // Slab: Days 1-5 @ 2/day, Days 6-10 @ 5/day, Days 11+ @ 10/day
    let rawFine = 0;
    if (days > 10) {
      rawFine = (5 * 2) + (5 * 5) + ((days - 10) * 10);
    } else if (days > 5) {
      rawFine = (5 * 2) + ((days - 5) * 5);
    } else if (days > 0) {
      rawFine = days * 2;
    }

    // Membership adjustment: FACULTY 50% waiver, STUDENT 20% waiver, GUEST 0% waiver
    let discountPct = 0;
    if (mem === "FACULTY") discountPct = 50;
    else if (mem === "STUDENT") discountPct = 20;

    const discount = Math.round((rawFine * discountPct) / 100);
    const finalFine = rawFine - discount;

    return {
      daysOverdue: days,
      membershipType: mem,
      rawFine,
      discount,
      finalFine,
      result: finalFine,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.daysOverdue !== "number") errors.push("Input property 'daysOverdue' must be a number.");
    return errors;
  }
}

/**
 * 75. SIMULATION_SALARY_ORACLE
 */
@Injectable()
export class SimulationSalaryOracle extends BaseOracle {
  readonly key = "SIMULATION_SALARY_ORACLE";
  readonly name = "Payroll Simulation with Overtime";
  readonly category = "SIMULATION";
  readonly description = "Calculates payroll with standard hours, 1.5x overtime (>40h), and withholding tax.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    hoursWorked: { type: "integer", min: 20, max: 80, default: 48 },
    hourlyRate: { type: "integer", min: 20, max: 200, default: 50 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const hours = typeof parameters.hoursWorked === "number" ? Math.max(0, parameters.hoursWorked) : 48;
    const rate = typeof parameters.hourlyRate === "number" ? Math.max(1, parameters.hourlyRate) : 50;
    return { hoursWorked: hours, hourlyRate: rate };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const hours = typeof input.hoursWorked === "number" ? Math.max(0, input.hoursWorked) : 0;
    const rate = typeof input.hourlyRate === "number" ? Math.max(1, input.hourlyRate) : 50;

    const regularHours = Math.min(40, hours);
    const overtimeHours = Math.max(0, hours - 40);

    const regularPay = regularHours * rate;
    const overtimePay = Math.round(overtimeHours * rate * 1.5);
    const grossPay = regularPay + overtimePay;

    // 10% standard tax withholding
    const tax = Math.round(grossPay * 0.1);
    const netPay = grossPay - tax;

    return {
      hoursWorked: hours,
      regularHours,
      overtimeHours,
      regularPay,
      overtimePay,
      grossPay,
      tax,
      netPay,
      result: netPay,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.hoursWorked !== "number") errors.push("Input property 'hoursWorked' must be a number.");
    return errors;
  }
}

/**
 * 76. SIMULATION_ELECTRICITY_BILL_ORACLE
 */
@Injectable()
export class SimulationElectricityBillOracle extends BaseOracle {
  readonly key = "SIMULATION_ELECTRICITY_BILL_ORACLE";
  readonly name = "Electricity Tariff Billing Simulation";
  readonly category = "SIMULATION";
  readonly description = "Simulates utility tariff billing with tiered slab rates, meter fixed charge, and surcharge.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    unitsConsumed: { type: "integer", min: 0, max: 1500, default: 280 },
    connectionType: { type: "enum", options: ["DOMESTIC", "COMMERCIAL"], default: "DOMESTIC" },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const units = typeof parameters.unitsConsumed === "number" ? Math.max(0, parameters.unitsConsumed) : 280;
    const conn = parameters.connectionType === "COMMERCIAL" ? "COMMERCIAL" : "DOMESTIC";
    return { unitsConsumed: units, connectionType: conn };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const units = typeof input.unitsConsumed === "number" ? Math.max(0, input.unitsConsumed) : 0;
    const conn = input.connectionType === "COMMERCIAL" ? "COMMERCIAL" : "DOMESTIC";

    const fixedCharge = conn === "COMMERCIAL" ? 250 : 100;
    const rateMultiplier = conn === "COMMERCIAL" ? 1.5 : 1.0;

    // Slabs: 0-100 @ 3.0/unit, 101-300 @ 5.0/unit, 301+ @ 8.0/unit
    let energyCharges = 0;
    if (units > 300) {
      energyCharges = (100 * 3.0) + (200 * 5.0) + ((units - 300) * 8.0);
    } else if (units > 100) {
      energyCharges = (100 * 3.0) + ((units - 100) * 5.0);
    } else {
      energyCharges = units * 3.0;
    }

    energyCharges *= rateMultiplier;
    const subtotal = energyCharges + fixedCharge;
    const surcharge = subtotal > 1500 ? Math.round(subtotal * 0.05) : 0;
    const totalBill = Math.round(subtotal + surcharge);

    return {
      unitsConsumed: units,
      connectionType: conn,
      fixedCharge,
      energyCharges: Math.round(energyCharges),
      surcharge,
      totalBill,
      result: totalBill,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.unitsConsumed !== "number") errors.push("Input property 'unitsConsumed' must be a number.");
    return errors;
  }
}

/**
 * 77. SIMULATION_TICKET_BOOKING_ORACLE
 */
@Injectable()
export class SimulationTicketBookingOracle extends BaseOracle {
  readonly key = "SIMULATION_TICKET_BOOKING_ORACLE";
  readonly name = "Ticket Booking Engine Simulation";
  readonly category = "SIMULATION";
  readonly description = "Simulates seat reservation engine with capacity limits, confirmed list, and waitlist allocations.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    totalSeats: { type: "integer", min: 10, max: 200, default: 20 },
    requestCount: { type: "integer", min: 3, max: 10, default: 5 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const totalSeats = typeof parameters.totalSeats === "number" ? Math.max(5, parameters.totalSeats) : 20;
    const count = typeof parameters.requestCount === "number" ? Math.max(1, parameters.requestCount) : 5;

    const requests = [];
    for (let i = 0; i < count; i++) {
      requests.push({ userId: `USR_${i + 1}`, seats: (i % 3) + 4 });
    }
    return { totalSeats, requests };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const totalSeats = typeof input.totalSeats === "number" ? Math.max(0, input.totalSeats) : 0;
    const requests = Array.isArray(input.requests) ? input.requests : [];

    let available = totalSeats;
    const confirmed: Array<{ userId: string; seats: number }> = [];
    const waitlisted: Array<{ userId: string; seats: number }> = [];

    for (const req of requests) {
      const seats = typeof req.seats === "number" ? req.seats : 0;
      if (available >= seats) {
        available -= seats;
        confirmed.push(req);
      } else {
        waitlisted.push(req);
      }
    }

    return {
      totalSeats,
      remainingSeats: available,
      confirmedCount: confirmed.length,
      waitlistedCount: waitlisted.length,
      confirmed,
      waitlisted,
      result: confirmed.length,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.totalSeats !== "number") errors.push("Input property 'totalSeats' must be a number.");
    if (!Array.isArray(input.requests)) errors.push("Input property 'requests' must be an array.");
    return errors;
  }
}

/**
 * 78. SIMULATION_ORDER_PROCESSING_ORACLE
 */
@Injectable()
export class SimulationOrderProcessingOracle extends BaseOracle {
  readonly key = "SIMULATION_ORDER_PROCESSING_ORACLE";
  readonly name = "Order Priority Processing Simulation";
  readonly category = "SIMULATION";
  readonly description = "Simulates priority queue order fulfillment (HIGH priority before NORMAL with FIFO ordering).";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    orderCount: { type: "integer", min: 3, max: 15, default: 6 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const count = typeof parameters.orderCount === "number" ? Math.max(2, parameters.orderCount) : 6;
    const orders = [];
    for (let i = 0; i < count; i++) {
      orders.push({
        orderId: `ORD_${100 + i}`,
        priority: i % 2 === 0 ? "HIGH" : "NORMAL",
        itemsCount: (i * 3 + 2) % 10 + 1,
      });
    }
    return { orders };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const orders = Array.isArray(input.orders) ? [...input.orders] : [];

    // Stable sort: HIGH before NORMAL, preserving original index
    const highOrders = orders.filter((o) => o.priority === "HIGH");
    const normalOrders = orders.filter((o) => o.priority !== "HIGH");
    const processedOrder = [...highOrders, ...normalOrders];

    const processedOrderIds = processedOrder.map((o) => o.orderId);

    return {
      totalOrders: orders.length,
      highPriorityCount: highOrders.length,
      normalPriorityCount: normalOrders.length,
      processingSequence: processedOrderIds,
      result: processedOrderIds,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.orders)) errors.push("Input property 'orders' must be an array.");
    return errors;
  }
}
