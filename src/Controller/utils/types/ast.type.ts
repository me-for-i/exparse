import { Token, Expression } from './token.type';

export enum NodeType {
  Identifier = 'Identifier',
  NumericLiteral = 'NumericLiteral',
  Boolean = 'Boolean',
  Function = 'Function',
  CallExpression = 'CallExpression',
  StringLiteral = 'StringLiteral',
  PrefixExpression = 'PrefixExpression',
  InfixExpression = 'InfixExpression',
}

export class Identifier {
  Token: Token;
  Value: string;
  constructor(token: Token, value: string) {
    this.Token = token;
    this.Value = value;
  }
  TokenLiteral = (): string => this.Token.Literal;
  String = (): string => this.Token.Literal;
  expressionNode = () => { };
}

export class Boolean {
  Token: Token;
  Value: boolean;
  constructor(token: Token, value: boolean) {
    this.Token = token;
    this.Value = value;
  }
  TokenLiteral = (): string => this.Token.Literal;
  String = (): string => this.Token.Literal;
  expressionNode = () => { };
}

export class StringLiteral {
  Token: Token;
  Value: string;
  constructor(token: Token, value: string) {
    this.Token = token;
    this.Value = value;
  }
  TokenLiteral = (): string => this.Token.Literal;
  String = (): string => `'${this.Token.Literal}'`;
  expressionNode = () => { };
}

export class NumericLiteral {
  Token: Token;
  Value: number;
  constructor(token: Token, value: number) {
    this.Token = token;
    this.Value = value;
  }
  TokenLiteral = (): string => this.Token.Literal;
  String = (): string => this.Token.Literal;
  expressionNode = () => { };
}

export class PrefixExpression {
  Token: Token;
  Operator: string;
  Right: Expression;
  constructor(token: Token, operator: string, right: Expression) {
    this.Token = token;
    this.Operator = operator;
    this.Right = right;
  }
  TokenLiteral = (): string => this.Token.Literal;
  String = (): string =>
    `(${this.Operator}${this.Right.Token.Literal.toString()})`;
  expressionNode = () => { };
}

export class InfixExpression {
  Token: Token;
  Operator: string;
  Left: Expression;
  Right: Expression;
  constructor(
    token: Token,
    operator: string,
    left: Expression,
    right: Expression,
  ) {
    this.Token = token;
    this.Operator = operator;
    this.Left = left;
    this.Right = right;
  }
  TokenLiteral = (): string => this.Token.Literal;
  String = (): string =>
    `(${this.Left.Token.Literal.toString()}${this.Operator
    }${this.Right.Token.Literal.toString()})`;
  expressionNode = () => { };
}

export class CallExpression {
  Token: Token;
  Function: Expression;
  Arguments: Array<Expression>;
  constructor(token: Token, func: Expression, args: Array<Expression>) {
    this.Token = token;
    this.Function = func;
    this.Arguments = args;
  }
  TokenLiteral = (): string => this.Token.Literal;
  String = (): string => {
    const args = this.Arguments.reduce((value, item) => {
      return value + `${item.Token.Literal.toString()},`;
    }, '').slice(0, -1);
    return `${this.Function.Token.Literal}(${args})`;
  };
  expressionNode = () => { };
}

export class Function {
  Token: Token;
  constructor(token: Token) {
    this.Token = token;
  }
  TokenLiteral = (): string => this.Token.Literal;
  String = (): string => this.Token.Literal;
  expressionNode = () => { };
}

