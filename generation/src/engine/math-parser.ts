type TokenType = 'NUMBER' | 'STRING' | 'IDENTIFIER' | 'OPERATOR' | 'LPAREN' | 'RPAREN' | 'EOF';

interface Token {
  type: TokenType;
  value: string;
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const operators = [
    '===', '!==', '==', '!=', '<=', '>=', '&&', '||',
    '+', '-', '*', '/', '%', '>', '<', '='
  ];

  while (i < input.length) {
    const char = input[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // String literals
    if (char === '"' || char === "'") {
      const quote = char;
      let strVal = '';
      i++; // Skip opening quote
      while (i < input.length && input[i] !== quote) {
        strVal += input[i];
        i++;
      }
      if (i >= input.length) {
        throw new Error("Unterminated string literal");
      }
      i++; // Skip closing quote
      tokens.push({ type: 'STRING', value: strVal });
      continue;
    }

    // Match multi-character operators first
    let matchedOp = false;
    for (const op of operators) {
      if (input.startsWith(op, i)) {
        tokens.push({ type: 'OPERATOR', value: op });
        i += op.length;
        matchedOp = true;
        break;
      }
    }
    if (matchedOp) continue;

    // Number matching (including decimals)
    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(input[i + 1] || ''))) {
      let numStr = '';
      while (i < input.length && /[0-9.]/.test(input[i])) {
        numStr += input[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    // Identifier matching (variables)
    if (/[a-zA-Z_]/.test(char)) {
      let idStr = '';
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        idStr += input[i];
        i++;
      }
      tokens.push({ type: 'IDENTIFIER', value: idStr });
      continue;
    }

    throw new Error(`Unexpected character: ${char}`);
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

class Parser {
  private tokens: Token[];
  private current = 0;
  private context: Record<string, unknown>;

  constructor(tokens: Token[], context: Record<string, unknown>) {
    this.tokens = tokens;
    this.context = context;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private match(...operators: string[]): boolean {
    const token = this.peek();
    if (token.type === 'OPERATOR' && operators.includes(token.value)) {
      this.current++;
      return true;
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.peek().type === type) {
      this.current++;
      return this.previous();
    }
    throw new Error(message);
  }

  evaluate(): unknown {
    return this.logicalOr();
  }

  private logicalOr(): unknown {
    let expr = this.logicalAnd();
    while (this.match('||')) {
      const right = this.logicalAnd();
      expr = (expr as boolean) || (right as boolean);
    }
    return expr;
  }

  private logicalAnd(): unknown {
    let expr = this.equality();
    while (this.match('&&')) {
      const right = this.equality();
      expr = (expr as boolean) && (right as boolean);
    }
    return expr;
  }

  private equality(): unknown {
    let expr = this.comparison();
    while (this.match('===', '!==', '==', '!=')) {
      const op = this.previous().value;
      const right = this.comparison();
      if (op === '===' || op === '==') {
        expr = expr === right;
      } else {
        expr = expr !== right;
      }
    }
    return expr;
  }

  private comparison(): unknown {
    let expr = this.term();
    while (this.match('<=', '>=', '<', '>')) {
      const op = this.previous().value;
      const right = this.term();
      if (op === '<') expr = (expr as number) < (right as number);
      else if (op === '>') expr = (expr as number) > (right as number);
      else if (op === '<=') expr = (expr as number) <= (right as number);
      else if (op === '>=') expr = (expr as number) >= (right as number);
    }
    return expr;
  }

  private term(): unknown {
    let expr = this.factor();
    while (this.match('+', '-')) {
      const op = this.previous().value;
      const right = this.factor();
      if (op === '+') expr = (expr as number) + (right as number);
      else expr = (expr as number) - (right as number);
    }
    return expr;
  }

  private factor(): unknown {
    let expr = this.unary();
    while (this.match('*', '/', '%')) {
      const op = this.previous().value;
      const right = this.unary();
      if (op === '*') expr = (expr as number) * (right as number);
      else if (op === '/') {
        if ((right as number) === 0) {
          throw new Error("Division by zero");
        }
        expr = (expr as number) / (right as number);
      }
      else expr = (expr as number) % (right as number);
    }
    return expr;
  }

  private unary(): unknown {
    if (this.match('-')) {
      return -(this.unary() as number);
    }
    return this.primary();
  }

  private primary(): unknown {
    const token = this.peek();

    if (token.type === 'NUMBER') {
      this.current++;
      return parseFloat(token.value);
    }

    if (token.type === 'STRING') {
      this.current++;
      return token.value;
    }

    if (token.type === 'IDENTIFIER') {
      this.current++;
      if (token.value in this.context) {
        return this.context[token.value];
      }
      throw new Error(`Undefined variable: ${token.value}`);
    }

    if (token.type === 'LPAREN') {
      this.current++;
      const expr = this.evaluate();
      this.consume('RPAREN', "Expect ')' after expression.");
      return expr;
    }

    throw new Error(`Expect expression, got ${token.value}`);
  }
}

/**
 * Safely evaluates a mathematical or logical expression using variables in the context.
 */
export function evaluateExpression(expr: string, context: Record<string, unknown>): unknown {
  const tokens = tokenize(expr);
  const parser = new Parser(tokens, context);
  return parser.evaluate();
}
