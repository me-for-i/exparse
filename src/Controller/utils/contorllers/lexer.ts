import { Lexer, LexerConfig } from '../types/controller.type';
import { Error, Keywords, Token, TokenType } from '../types/token.type';

// 标识结束的 charactor
const END_CHAR = 0;
const defaultIdentRegExp = /^(\w|\.|-)+$/;
const defaultBoundarySymbol = '$';

class ExpLexer implements Lexer {
  // 内部流动数据
  expression: string = '';
  charactor: string | number = ''; //  从 exp 中顺序读取的均为string
  position: number = 0;
  nextPosition: number = 0;
  Err: Error | null = null;

  // 可用配置内容
  allowChineseAsIdent: boolean = false; //允许将中文校验为ident
  allowEmptyString: boolean = false; // 是否允许出现空字符串
  identBoundarySymbol: string = defaultBoundarySymbol; // 使用此字符作为 ident 边界,目前暂时只支持一位字符
  identRegExp: RegExp = defaultIdentRegExp; // ident 中仅允许出现此 RegExp 所匹配的内容,若使用自定义的限制内容,则对应的报错提示不再给出限制内容的对应描述,仅提示出现限制内容外的字符,不具备根据正则表达式给出合适描述的能力

  constructor(exp: string) {
    // error case
    switch (true) {
      case typeof exp !== 'string':
        this.raiseLexError('Input parameter should be a string', 0, '');
        break;
      case !exp.trim().length:
        this.raiseLexError('Expression shound not be empty', 0, '');
        break;
    }

    this.expression = exp;
    this.charactor = exp?.[0];
  }

  //词法解析 config
  /**
   * @param config a object with these memeber
   * @param {boolean} config.allowChineseAsIdent 是否允许将中文校验为 ident
   * @param {boolean} config.allowEmptyString 是否允许出现空字符串
   * @param {string} config.identBoundarySymbol 使用此字符作为 ident 边界,暂时只支持一位字符
   * @param {RegExp} config.identRegExp ident 中仅允许出现此 RegExp 所匹配的内容,若使用自定义的限制内容,则对应的报错提示不再给出限制内容的对应描述,仅提示出现限制内容外的字符,不具备根据正则表达式给出合适描述的能力
   * @example
   * 以下为默认配置
   * lex({
   *  allowChineseAsIdent: false,
   *  allowEmptyString: false,
   *  identBoundarySymbol: '$',
   *  identRegExp: /^(\w|\.|-)+$/
   * })
   * @returns Token[]
   */
  lex(config?: LexerConfig) {
    if (config) {
      for (const prop in config) {
        if (Object.hasOwn(config, prop)) {
          (this as LexerConfig)[prop] = config[prop];
        }
      }
    }

    const tokens: Token[] = [];
    this.readChar();

    while (true) {
      const token = this.nextToken();
      if (token === null) break;
      tokens.push(token);
      if (token.Kind === TokenType.EOF) break;
    }

    return tokens;
  }

  //创建token
  nextToken(): Token {
    let token;

    this.eatWhiteSpace();

    switch (this.charactor) {
      case END_CHAR:
        token = this.createToken('', TokenType.EOF, this.position);
        break;
      //----------------------------------------------------------------
      case '(':
        token = this.createToken(
          this.charactor,
          TokenType.LPAREN,
          this.nextPosition,
        );
        break;
      case ')':
        token = this.createToken(
          this.charactor,
          TokenType.RPAREN,
          this.nextPosition,
        );
        break;
      case ',':
        token = this.createToken(
          this.charactor,
          TokenType.COMMA,
          this.nextPosition,
        );
        break;
      case '{':
        token = this.createToken(
          this.charactor,
          TokenType.LBRACE,
          this.nextPosition,
        );
        break;
      case '}':
        token = this.createToken(
          this.charactor,
          TokenType.RBRACE,
          this.nextPosition,
        );
        break;
      case '+':
        token = this.createToken(
          this.charactor,
          TokenType.PLUS,
          this.nextPosition,
        );
        break;
      case '-':
        token = this.createToken(
          this.charactor,
          TokenType.MINUS,
          this.nextPosition,
        );
        break;
      case '*':
        token = this.createToken(
          this.charactor,
          TokenType.ASTERISK,
          this.nextPosition,
        );
        break;
      case '/':
        token = this.createToken(
          this.charactor,
          TokenType.SLASH,
          this.nextPosition,
        );
        break;

      case "'":
        const str = this.readString();
        token = this.createToken(str, TokenType.STRING, this.nextPosition);
        break;
      //----------------------------------------------------------------
      case '=':
        token = this.doubleCh('=', TokenType.EQ, TokenType.ASSIGN);
        break;
      case '!':
        token = this.doubleCh('=', TokenType.NOT_EQ, TokenType.BANG);
        break;
      case '<':
        token = this.doubleCh('=', TokenType.LTE, TokenType.LT);
        break;
      case '>':
        token = this.doubleCh('=', TokenType.GTE, TokenType.GT);
        break;
      case '&':
        token = this.doubleCh('&', TokenType.AND, TokenType.BIT_AND);
        break;
      case '|':
        token = this.doubleCh('|', TokenType.OR, TokenType.BIT_OR);
        break;
      //----------------------------------------------------------------
      default:
        switch (true) {
          case this.isLetter(this.charactor):
            const literal = this.readIdentifier();
            token = this.createToken(
              literal,
              this.checkIdent(literal),
              this.position,
            );
            return token;

          case this.isNumber(this.charactor):
            token = this.createToken(
              this.readNumber(),
              TokenType.NUMERIC,
              this.position,
            );
            return token; // readNumber时会将charactor指向 number 的下一位,不能在下面再次 this.readChar 否则会丢失下一位 charactor

          case this.charactor === this.identBoundarySymbol:
            const position = this.position;
            while (true) {
              this.readChar();
              if (this.charactor === this.identBoundarySymbol) break;
              // @ts-ignore
              if (this.charactor === END_CHAR) {
                this.raiseLexError(
                  this.charactor,
                  this.position,
                  `Lack of ${this.identBoundarySymbol}`,
                );
                break;
              }
            }
            const numCh = this.expression.slice(position, this.position + 1);
            if (!RegExp(this.identRegExp).exec(numCh.slice(1, -1)))
              this.raiseLexError(
                // 使用默认identRegExp给出默认描述,其他则使用更宽泛的解释
                String(this.identRegExp) === String(defaultIdentRegExp)
                  ? 'Variable should only include number,letter, "_" , "-" , "."'
                  : 'Characters outside the allowed range appear',
                this.position,
                'Illegal variable,',
              );
            this.readChar();
            // ident 视为 num
            token = this.createToken(numCh, TokenType.NUMERIC, this.position);
            return token;

          default:
            token = this.createToken(
              '' + this.charactor,
              TokenType.INVALID,
              this.position,
            );
            this.raiseLexError(this.charactor, this.position, 'Invalid token');
        }
    }

    this.readChar();
    return token;
  }

  // 读取下一个字符
  readChar() {
    this.charactor =
      this.nextPosition >= this.expression.length
        ? END_CHAR
        : this.expression[this.nextPosition];

    this.position = this.nextPosition;
    this.nextPosition++;
  }

  // 读取字符串
  readString(): string {
    const position = this.position + 1; // 字符串的开始位置
    let isSingleQute = false;
    while (true) {
      this.readChar();
      if (this.charactor === "'") break; // 始终读取直到边界 '
      if (this.charactor === END_CHAR) {
        isSingleQute = true;
        this.raiseLexError("'", this.position, 'Unterminated string constant');
        break;
      }
      if (this.isEmpty()) {
        this.raiseLexError(
          'Stringliteral can not include blank, enter, tab and other format character',
          this.position,
          'Illegal stringliteral',
        );
      }
    }

    // 不允许空字符串
    if (!this.allowEmptyString && this.position - position === 0)
      this.raiseLexError(
        'Stringliteral can not be empty',
        this.position,
        'Illegal stringliteral',
      );

    const strCh = this.expression.slice(position, this.position);

    if (
      strCh.startsWith(this.identBoundarySymbol) &&
      strCh.endsWith(this.identBoundarySymbol) &&
      !RegExp(this.identRegExp).exec(strCh.slice(1, -1))
    ) {
      this.raiseLexError(
        String(this.identRegExp) === String(defaultIdentRegExp)
          ? 'Variable should only include number,letter, "_" , "-" , "."'
          : 'Characters outside the allowed range appear',
        this.position + 1,
        'Illegal variable,',
      );
    }

    return isSingleQute ? `'${strCh}` : `'${strCh}'`;
  }

  // 读取数字
  readNumber(): string {
    const position = this.position;
    while (this.isNumber(this.charactor)) {
      this.readChar();
    }
    if (this.isIdentifierStart(this.charactor)) {
      this.raiseLexError(
        this.charactor,
        this.position,
        'Identifier directly after number',
      );
    }
    return this.expression.slice(position, this.position);
  }

  // 通过首尾索引读取标识符
  readIdentifier(): string {
    const position = this.position;
    while (true) {
      this.readChar();
      if (!this.isWordChar(this.charactor) || this.charactor === END_CHAR)
        break;
    }
    return this.expression.slice(position, this.position);
  }

  // 临时读取某个ch
  peekChar(): string | number {
    return this.nextPosition >= this.expression.length
      ? END_CHAR
      : this.expression[this.nextPosition];
  }

  // 标识符类型,关键字还是自定义变量?
  checkIdent(ident: string): string {
    // @ts-ignore
    return typeof Keywords[ident] === 'string'
      ? // @ts-ignore
        Keywords[ident]
      : TokenType.IDENT;
  }

  // 创建token
  createToken(literal: string, kind: string, offset: number): Token {
    return {
      Literal: literal,
      Kind: kind,
      Offset: offset,
    };
  }

  // 双字操作符
  doubleCh(nextCh: string, double: string, single: string): Token {
    if (this.peekChar() === nextCh) {
      const charactor = this.charactor;
      this.readChar();
      return this.createToken(
        `${charactor}${this.charactor}`,
        double,
        this.position,
      );
    } else {
      return this.createToken(`${this.charactor}`, single, this.position);
    }
  }

  // 获取错误信息
  error() {
    return this.Err;
  }

  // 去除空白,包括空格,换行,制表符等
  eatWhiteSpace() {
    while (true) {
      if (this.isEmpty()) {
        this.readChar();
      } else break;
    }
  }

  isEndChar(c: string | number): boolean {
    return c === END_CHAR;
  }

  // char 类型判断
  isLetter(c: string | number): boolean {
    return (
      !this.isEndChar(c) &&
      !!RegExp(
        this.allowChineseAsIdent ? /[_a-zA-Z\u4e00-\u9fd5]/ : /[_a-zA-Z]/,
      ).exec(String(c))
    );
  }

  isNumber(c: string | number): boolean {
    return !this.isEndChar(c) && (c === '.' || !isNaN(Number(c as string)));
  }

  isChar(c: string | number): boolean {
    return !this.isEndChar(c) && !!RegExp(/[_a-zA-Z]/).exec(String(c));
  }

  isWordChar(c: string | number): boolean {
    return (
      (!this.isEndChar(c) && this.isLetter(c)) || !isNaN(parseInt(c as string))
    );
  }

  isNotQuote(c: string | number): boolean {
    return !this.isEndChar(c) && c !== "'" && c !== '"';
  }

  isNotAlphanumeric(c: string | number): boolean {
    return (
      !this.isEndChar(c) &&
      !(
        this.isNumber(c) ||
        this.isChar(c) ||
        c === '(' ||
        c === ')' ||
        !this.isNotQuote(c)
      )
    );
  }

  isIdentifierStart(c: string | number): boolean {
    return !this.isEndChar(c) && !!RegExp(/[_a-zA-Z]/).exec(String(c));
  }

  isEmpty() {
    /*
     * \s 匹配任何空白字符，包括空格、制表符、换行符、回车符、换页符等。
     * \f 匹配一个换页符。
     * \n 匹配一个换行符。
     * \r 匹配一个回车符。
     * \v 匹配一个垂直制表符。
     * \t 匹配一个制表符（tab）。
     */
    return (
      typeof this.charactor === 'string' && RegExp(/[\s]/).exec(this.charactor)
    );
  }

  // 错误处理
  raiseLexError(c: string | number, position: number, errMsg: string) {
    this.Err = {
      Msg: `${errMsg}  ${c as string},  please check position(${position})`,
      Offset: position,
    };
  }
}

export default function lexExp({
  exp,
  lexConfig,
}: {
  exp: string;
  lexConfig?: LexerConfig;
}) {
  const lexer = new ExpLexer(exp);
  const tokens = lexer.lex(lexConfig);

  return {
    tokens,
    errorInfo: lexer.Err,
    // lexer, 暂时不暴露 controller,只提供处理结果和错误信息
  };
}
