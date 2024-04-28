import { NodeType } from '../types/ast.type';
import { Parser, ParserConfig } from '../types/controller.type';
import {
  Error,
  Expression,
  ExpressionStatement,
  Precedences,
  Sort,
  Token,
  TokenType,
} from '../types/token.type';

class ExpParser implements Parser {
  // 内部流动数据
  tokens: Token[] = [];
  currToken: Token;
  peekToken: Token | undefined;
  Err: Error | null = null;
  offset: number = 0;
  prefixParseFns: Parser['prefixParseFns'] = {};
  infixParseFns: Parser['infixParseFns'] = {};
  repeatedExp: { token: Token | null; count: number };

  // 可选用配置内容
  identBoundarySymbol: string = '$'; // 一般来说应与 lex 的identBoundarySymbol保持一致

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.peekToken = this.currToken = tokens[0];
    this.repeatedExp = { token: null, count: 1 };

    // 注册各类型 token 的解析逻辑
    // 前缀
    this.prefixParseFns = {
      [TokenType.IDENT]: this.parseIdentifier,
      [TokenType.NUMERIC]: this.parseNumericLiteral,
      [TokenType.STRING]: this.parseStringLiteral,
      [TokenType.TRUE]: this.parseBoolean,
      [TokenType.FALSE]: this.parseBoolean,
      [TokenType.BANG]: this.parsePrefixExpression,
      [TokenType.MINUS]: this.parsePrefixExpression,
      [TokenType.LPAREN]: this.parseGroupedExpression,
    };
    // 中缀
    this.infixParseFns = {
      [TokenType.PLUS]: this.parseInfixExpression,
      [TokenType.MINUS]: this.parseInfixExpression,
      [TokenType.ASTERISK]: this.parseInfixExpression,
      [TokenType.SLASH]: this.parseInfixExpression,
      [TokenType.LT]: this.parseInfixExpression,
      [TokenType.GT]: this.parseInfixExpression,
      [TokenType.LTE]: this.parseInfixExpression,
      [TokenType.GTE]: this.parseInfixExpression,
      [TokenType.EQ]: this.parseInfixExpression,
      [TokenType.NOT_EQ]: this.parseInfixExpression,
      [TokenType.ASSIGN]: this.parseInfixExpression,
      [TokenType.LPAREN]: this.parseCallExpression,
    };

    this.nextToken();
    this.nextToken();
  }

  // 语法解析config
  /**
   * @param config a object with these memeber
   * @param {string} config.identBoundarySymbol 使用此字符作为 ident 边界,目前暂时只支持一位字符
   * @example
   * 以下为默认配置
   * parse({
   *  identBoundarySymbol: '$',
   * })
   * @returns Expression
   */
  parse(config?: ParserConfig): Expression | null {
    if (config) {
      for (let prop in config) {
        if (Object.hasOwn(config, prop)) {
          (this as ParserConfig)[prop] = config[prop];
        }
      }
    }

    const stmt = this.parseExpressionStatement();
    return stmt.Expression;
  }

  // 向后读取 token
  nextToken() {
    if (this.peekToken) {
      this.currToken = this.peekToken;
    }
    this.peekToken = this.tokens[this.offset];
    this.offset++;
  }

  // 优先级解析
  parseExpression = (precedence: number): Expression | null => {
    this.checkSyntax();
    if (this.Err) return null;
    const prefix = this.prefixParseFns[this.currToken.Kind];
    if (!prefix) {
      this.noPrefixParseFnError(this.currToken);
      return null;
    }
    let leftExp = prefix();
    while (
      !this.peekTokenIs(TokenType.EOF) &&
      precedence < this.peekPrecedence()
    ) {
      // ident后应为中缀操作符并参与中缀表达式
      const infix = this.infixParseFns[this.peekToken?.Kind ?? ''];
      if (!infix) {
        return leftExp;
      }
      this.nextToken();
      if (this.peekTokenIs(TokenType.EOF)) {
        this.raiseSyntaxError('Unexpected token', this.currToken);
        return leftExp;
      }
      leftExp = infix(leftExp);
    }
    return leftExp;
  };

  parseExpressionStatement(): ExpressionStatement {
    const stmt: ExpressionStatement = {
      Token: this.currToken,
      Expression: this.parseExpression(Sort.LOWEST),
    };
    return stmt;
  }

  // 映射回调
  parseIdentifier = (): Expression => {
    return {
      Token: this.currToken,
      Value: this.currToken.Literal,
      NodeType: NodeType.Identifier,
    };
  };

  parseBoolean = (): Expression => {
    return {
      Token: this.currToken,
      Value: this.currToken.Kind === TokenType.TRUE,
      NodeType: NodeType.Boolean,
    };
  };

  parseStringLiteral = (): Expression => {
    return {
      Token: this.currToken,
      Value: this.currToken.Literal,
      NodeType: NodeType.StringLiteral,
    };
  };

  parseNumericLiteral = (): Expression | null => {
    if (
      !(
        this.currToken.Literal.startsWith(this.identBoundarySymbol) &&
        this.currToken.Literal.endsWith(this.identBoundarySymbol)
      )
    ) {
      // ident 被解析为数字类型的 Token,不再检查 ident 的数字合法性
      if (isNaN(parseFloat(this.currToken.Literal))) {
        this.Err = {
          Msg: `Could not parse ${this.currToken.Literal} as float64`,
          Offset: this.currToken.Offset,
        };
        // 这个条件判断存疑,不知当时需要满足什么需求
        if (this.currToken.Literal !== '...') {
          return null;
        }
      }
    }

    return {
      Token: this.currToken,
      Value: this.currToken.Literal,
      NodeType: NodeType.NumericLiteral,
    };
  };

  // 括号内部表达式
  parseGroupedExpression = (): Expression | null => {
    this.checkSyntax();
    if (this.Err) return null;
    if (this.peekTokenIs(TokenType.RPAREN)) {
      this.raiseSyntaxError('Group can not be empty', this.currToken);
      return null;
    }
    this.nextToken();
    const exp = this.parseExpression(Sort.LOWEST);
    if (JSON.stringify(exp!.Token) === JSON.stringify(this.repeatedExp.token)) {
      this.repeatedExp = {
        token: exp!.Token,
        count: this.repeatedExp.count + 1,
      };
    } else {
      this.repeatedExp = {
        token: exp!.Token,
        count: 1,
      };
    }
    if (!this.expectPeek(TokenType.RPAREN)) return null;
    exp!.WithBracket = this.repeatedExp.count;
    return exp;
  };

  // 表达式回调
  // 前缀
  parsePrefixExpression = (): Expression | null => {
    const exp: Expression = {
      Token: this.currToken,
      Operator: this.currToken.Literal,
      NodeType: NodeType.PrefixExpression,
    };
    this.nextToken();
    this.checkSyntax();
    if (this.Err !== null) {
      return null;
    }
    exp.Right = this.parseExpression(Sort.PREFIX);
    if (exp.Right === null) {
      return null;
    }
    return exp;
  };

  // 中缀
  parseInfixExpression = (left: Expression): Expression | null => {
    this.checkSyntax();
    if (this.Err) return null;
    const exp: Expression = {
      Token: this.currToken,
      Operator: this.currToken.Literal,
      Left: left,
      NodeType: NodeType.InfixExpression,
    };
    const precedence = this.curPrecedence();
    this.nextToken();
    exp.Right = this.parseExpression(precedence);
    return exp;
  };

  // 函数
  parseCallExpression = (func: Expression): Expression | null => {
    this.checkSyntax();
    if (this.Err) return null;
    const exp: Expression = {
      Token: this.currToken,
      Function: {
        Token: func.Token,
        Value: func.Value,
        NodeType: NodeType.Function,
      },
      Arguments: this.parseCallArguments(),
      NodeType: NodeType.CallExpression,
    };
    return exp;
  };

  // 入参
  parseCallArguments = (): Array<Expression> | null => {
    let args: Array<Expression> = [];
    if (this.peekTokenIs(TokenType.RPAREN)) {
      this.nextToken();
      this.checkSyntax();
      if (this.Err) return null;
      return args;
    }

    this.nextToken();
    args = [...args, this.parseExpression(Sort.LOWEST) as Expression];
    while (this.peekTokenIs(TokenType.COMMA)) {
      this.nextToken();
      this.nextToken();
      args = [...args, this.parseExpression(Sort.LOWEST) as Expression];
    }
    if (!this.expectPeek(TokenType.RPAREN)) return null;
    this.checkSyntax();
    if (this.Err) return null;
    return args;
  };

  // 优先级
  peekPrecedence(): number {
    let type = '';
    for (let item in TokenType) {
      // @ts-ignore
      if (TokenType[item] === this.peekToken?.Kind) {
        type = item;
        break;
      }
    }
    // @ts-ignore
    return Precedences[type] ? Sort[String(Precedences[type])] : Sort.LOWEST;
  }

  curPrecedence(): number {
    let type = '';
    for (let item in TokenType) {
      // @ts-ignore
      if (TokenType[item] === this.currToken.Kind) {
        type = item;
        break;
      }
    }
    // @ts-ignore
    return Precedences[type] ? Sort[String(Precedences[type])] : Sort.LOWEST;
  }

  // token
  peekTokenIs(tokenType: string): boolean {
    return this.peekToken?.Kind === tokenType;
  }

  expectPeek(tokenType: string): boolean {
    if (this.peekTokenIs(tokenType)) {
      this.nextToken();
      return true;
    }
    this.peekError(tokenType);
    return false;
  }

  // 接下来的token.kind 应 位于此范围,返回值为真则无错误
  peekTokenShouldIn(tokenTypes: string[]): boolean {
    return tokenTypes.some((tokenType) => tokenType === this.peekToken?.Kind);
  }
  // 接下来的token.kind 不应 位于此范围,返回值为真则无错误
  peekTokenNotIn(tokenTypes: string[]): boolean {
    return tokenTypes.every((tokenType) => tokenType !== this.peekToken?.Kind);
  }

  // 语法检查,某个 Kind 后应接或不可接某类 Kind
  checkSyntax() {
    let noSyntaxError = true;

    switch (this.currToken.Kind) {
      case TokenType.IDENT:
        if (!this.peekTokenNotIn([TokenType.IDENT])) {
          noSyntaxError = false;
        }
        break;

      case TokenType.NUMERIC:
      case TokenType.STRING:
        if (
          !this.peekTokenNotIn([
            TokenType.IDENT,
            TokenType.NUMERIC,
            TokenType.STRING,
            TokenType.LPAREN,
          ])
        ) {
          noSyntaxError = false;
        }
        break;

      case TokenType.RPAREN:
        if (
          !this.peekTokenNotIn([
            TokenType.IDENT,
            TokenType.NUMERIC,
            TokenType.STRING,
          ])
        ) {
          noSyntaxError = false;
        }
        break;

      case TokenType.LPAREN:
        if (
          !this.peekTokenShouldIn([
            TokenType.IDENT,
            TokenType.NUMERIC,
            TokenType.STRING,
            TokenType.RPAREN,
            TokenType.PLUS,
            TokenType.MINUS,
            TokenType.LPAREN,
            TokenType.BANG,
            TokenType.TRUE,
            TokenType.FALSE,
          ])
        ) {
          noSyntaxError = false;
        }
        break;

      case TokenType.ASSIGN:
      case TokenType.ASTERISK:
      case TokenType.SLASH:
      case TokenType.GT:
      case TokenType.LT:
      case TokenType.GTE:
      case TokenType.LTE:
      case TokenType.EQ:
      case TokenType.NOT_EQ:
        if (
          !this.peekTokenShouldIn([
            TokenType.IDENT,
            TokenType.NUMERIC,
            TokenType.STRING,
            TokenType.LPAREN,
            TokenType.BANG,
          ])
        ) {
          noSyntaxError = false;
        }
        break;

      case TokenType.MINUS:
      case TokenType.BANG:
        if (
          !this.peekTokenShouldIn([
            TokenType.IDENT,
            TokenType.NUMERIC,
            TokenType.LPAREN,
          ])
        ) {
          noSyntaxError = false;
        }
        break;

      case TokenType.PLUS:
        if (
          !this.peekTokenShouldIn([
            TokenType.IDENT,
            TokenType.NUMERIC,
            TokenType.LPAREN,
            TokenType.STRING,
            TokenType.BANG,
          ])
        ) {
          noSyntaxError = false;
        }
        break;
    }

    if (!noSyntaxError) {
      this.raiseSyntaxError('Unexpected token', this.peekToken);
    }
  }

  // 获取错误信息
  error() {
    return this.Err;
  }

  peekError(tokenType: string) {
    this.Err = {
      Msg: `Expected next token to be ${tokenType}, got ${this.peekToken?.Kind} instead : ${this.peekToken?.Offset}`,
      Offset: this.peekToken?.Offset ?? -1,
    };
  }

  noPrefixParseFnError(token: Token) {
    this.Err = {
      Msg: `No prefix parse function for ${token.Kind} found : ${
        token.Offset + 1
      }`,
      Offset: token.Offset,
    };
  }

  raiseSyntaxError(err: string, token?: Token) {
    this.Err = {
      Msg: `Invalid syntax, ${err}, '${token?.Literal}' ; position: ${
        (token?.Offset ?? -1) + 1
      }`,
      Offset: token?.Offset ?? -1,
    };
  }
}

export default function parseTokens({
  tokens,
  parseConfig,
}: {
  tokens: Token[];
  parseConfig?: ParserConfig;
}) {
  const parser = new ExpParser(tokens);
  const ast = parser.parse(parseConfig);

  return {
    ast,
    errorInfo: parser.Err,
  };
}
