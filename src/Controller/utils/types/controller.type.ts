import { DataObj, Func } from './data-type.type';
import { Error, Expression, Token } from './token.type';

/**
 * @key allowChineseAsIdent boolean 是否允许将中文校验为 ident
 * @key allowEmptyString boolean 是否允许出现空字符串
 * @key identBoundarySymbol string 使用此字符作为 ident 边界,暂时只支持一位字符
 * @key identRegExp RegExp ident 中仅允许出现此 RegExp 所匹配的内容,若使用自定义的限制内容,则对应的报错提示不再给出限制内容的对应描述,仅提示出现限制内容外的字符,不具备根据正则表达式给出合适描述的能力
 */
export interface LexerConfig {
  allowChineseAsIdent?: boolean;
  allowEmptyString?: boolean;
  identBoundarySymbol?: string;
  identRegExp?: RegExp;
  [key: string]: any;
}

export interface Lexer extends LexerConfig {
  expression: string;
  charactor: string | number;
  position: number;
  nextPosition: number;
  Err: Error | null;
  functions?: ((p: any) => any)[];
  [key: string]: any;
}

/**
 * @key identBoundarySymbol string 使用此字符作为 ident 边界,暂时只支持一位字符
 */
export interface ParserConfig {
  identBoundarySymbol?: string;
  [key: string]: any;
}

export interface Parser extends ParserConfig {
  tokens: Token[];
  currToken: Token;
  peekToken: Token | undefined;
  Err: Error | null;
  offset: number;
  prefixParseFns: Record<string, (p?: any) => Expression | null>;
  infixParseFns: Record<string, (p?: any) => Expression | null>;
}

export interface ValidatorConfig {
  notCheckIdent?: boolean;
  presetKeywords?: DataObj[];
  presetFunctions?: Record<string, Func>;
  [key: string]: any;
}

export interface Validator extends ValidatorConfig {
  Err: Error | null;
}
