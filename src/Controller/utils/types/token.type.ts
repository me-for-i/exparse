
export enum TokenType {
  INVALID = 'INVALID',
  EOF = 'EOF',

  IDENT = 'IDENT',

  ASSIGN = '=',
  PLUS = '+',
  MINUS = '-',
  BANG = '!',
  ASTERISK = '*',
  SLASH = '/',
  LT = '<',
  GT = '>',
  LTE = '<=',
  GTE = '>=',
  EQ = '==',
  NOT_EQ = '!=',
  BIT_AND = '&',
  BIT_OR = '|',
  AND = '&&',
  OR = '||',
  COMMA = ',',
  LPAREN = '(',
  RPAREN = ')',
  LBRACE = '{',
  RBRACE = '}',

  STRING = 'STRING',
  NUMERIC = 'NUMERIC',
  FUNCTION = 'FUNCTION',

  // Keywords
  TRUE = 'TRUE',
  FALSE = 'FALSE',
}

export enum Keywords {
  true = 'TRUE',
  false = 'FALSE',
}

export enum Sort {
  LOWEST,
  ASSIGN,
  EQUALS,
  LESSGREATER,
  SUM,
  PRODUCT,
  PREFIX,
  CALL,
}

export enum Precedences {
  ASSIGN = 'ASSIGN',

  EQ = 'EQUALS',
  NOT_EQ = 'EQUALS',

  LT = 'LESSGREATER',
  LTE = 'LESSGREATER',
  GT = 'LESSGREATER',
  GTE = 'LESSGREATER',

  PLUS = 'SUM',
  MINUS = 'SUM',

  SLASH = 'PRODUCT',
  ASTERISK = 'PRODUCT',

  LPAREN = 'CALL',
}

export interface Token {
  Literal: string;
  Kind: string;
  Offset: number;
  Variable?: boolean; // 标识该 Token 是否来自一个可变量 
}

export interface Expression {
  Token: Token;
  Operator?: string;
  Value?: any;
  Left?: Expression | null;
  Right?: Expression | null;
  Expression?: Expression | null;
  Function?: Expression;
  Arguments?: Array<Expression> | null;
  NodeType?: string;
  Variable?: boolean;
  WithBracket?: number;
}

export interface ExpressionStatement {
  Token: Token;
  Expression: Expression | null;
}

export interface Error {
  Msg: string;
  Offset: number;
}

