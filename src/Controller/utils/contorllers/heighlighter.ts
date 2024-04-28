import { NodeType } from '../types/ast.type';
import { Expression, Token, TokenType } from '../types/token.type';

const defaultHeighLightColorMap = {
  Identifier: '#9fa0d7',
  NumericLiteral: '#99004d',
  Comma: '#284f95',
  Compare: '#ffbc9b',
  Logic: '#ffb3b3',
  Boolean: '#477066',
  Function: '#ff47d1',
  StringLiteral: '#ffc428',
  Operator: '#337d56',
  Bracket: '#ff531a',
  Dot: '#0505d3',
};

class ANode {
  Name: string;
  Color: string;
  constructor(name?: string, color?: string) {
    this.Name = name ?? '';
    this.Color = color ?? '#000';
  }
}

class Highlighter {
  syntaxNodes: Array<{ Name: string; Color: string }> = [];
  heighLightColorMap: Record<string, string> = defaultHeighLightColorMap;

  // eslint-disable-next-line @typescript-eslint/ban-types
  SetBracket = (ast: Expression, cb: Function) => {
    if (ast.WithBracket) {
      for (let i = 0; i < ast.WithBracket; i++) {
        this.syntaxNodes.push(new ANode('(', this.heighLightColorMap.Bracket));
      }
    }
    cb();
    if (ast.WithBracket) {
      for (let i = 0; i < ast.WithBracket; i++) {
        this.syntaxNodes.push(new ANode(')', this.heighLightColorMap.Bracket));
      }
    }
  };

  // 使用 ast 构建
  SyntaxHighlightingByAst = (ast?: Expression | null) => {
    if (!ast) return;
    const { heighLightColorMap } = this;

    switch (ast.NodeType) {
      case NodeType.Identifier:
        this.SetBracket(ast, () => {
          this.syntaxNodes.push(
            new ANode(ast.Value, heighLightColorMap.Identifier),
          );
        });
        break;

      case NodeType.NumericLiteral:
        this.SetBracket(ast, () => {
          this.syntaxNodes.push(
            new ANode(ast.Value, heighLightColorMap.NumericLiteral),
          );
        });
        break;

      case NodeType.StringLiteral:
        this.SetBracket(ast, () => {
          this.syntaxNodes.push(
            new ANode(ast.Value, heighLightColorMap.StringLiteral),
          );
        });
        break;

      case NodeType.Boolean:
        this.SetBracket(ast, () => {
          this.syntaxNodes.push(
            new ANode(ast.Value, heighLightColorMap.Boolean),
          );
        });
        break;

      case NodeType.CallExpression:
        this.SetBracket(ast, () => {
          this.syntaxNodes.push(
            new ANode(ast.Function?.Value, heighLightColorMap.Function),
          );
          this.syntaxNodes.push(new ANode('(', heighLightColorMap.Bracket));
          if (ast.Arguments) {
            ast.Arguments.forEach((item, index) => {
              this.SyntaxHighlightingByAst(item);
              if (index !== (ast?.Arguments?.length ?? 0) - 1) {
                this.syntaxNodes.push(new ANode(',', heighLightColorMap.Dot));
              }
            });
          }

          this.syntaxNodes.push(new ANode(')', heighLightColorMap.Bracket));
        });
        break;

      case NodeType.Function:
        this.SetBracket(ast, () => {
          this.syntaxNodes.push(
            new ANode(ast.Value, heighLightColorMap.Function),
          );
        });
        break;

      case NodeType.InfixExpression:
        this.SetBracket(ast, () => {
          this.SyntaxHighlightingByAst(ast.Left);
          this.syntaxNodes.push(
            new ANode(ast.Operator, heighLightColorMap.Operator),
          );
          this.SyntaxHighlightingByAst(ast.Right);
        });
        break;

      case NodeType.PrefixExpression:
        this.SetBracket(ast, () => {
          this.syntaxNodes.push(
            new ANode(ast.Operator, heighLightColorMap.Operator),
          );
          this.SyntaxHighlightingByAst(ast.Right);
        });
        break;

      default:
        return;
    }
  };

  // 使用 token 构建
  SyntaxHighlightingByTokens = (tokens: Token[]) => {
    const { heighLightColorMap } = this;

    // 不需要 EOF 类型的 token
    let color = '';
    this.syntaxNodes = tokens.map((token) => {
      switch (token.Kind) {
        case TokenType.IDENT:
          color = heighLightColorMap.Identifier;
          break;
        case TokenType.NUMERIC:
          color = heighLightColorMap.NumericLiteral;
          break;
        case TokenType.STRING:
          color = heighLightColorMap.StringLiteral;
          break;
        case TokenType.TRUE:
        case TokenType.FALSE:
          color = heighLightColorMap.Boolean;
          break;
        case TokenType.LPAREN:
        case TokenType.RPAREN:
          color = heighLightColorMap.Bracket;
          break;
        case TokenType.COMMA:
          color = heighLightColorMap.Comma;
          break;
        case '.':
          color = heighLightColorMap.Dot;
          break;
        case TokenType.PLUS:
        case TokenType.MINUS:
        case TokenType.ASTERISK:
        case TokenType.SLASH:
          color = heighLightColorMap.Operator;
          break;
        case TokenType.LT:
        case TokenType.GT:
        case TokenType.LTE:
        case TokenType.GTE:
        case TokenType.EQ:
        case TokenType.NOT_EQ:
        case TokenType.ASSIGN:
          color = heighLightColorMap.Compare;
          break;
        case TokenType.BIT_AND:
        case TokenType.BIT_OR:
        case TokenType.AND:
        case TokenType.OR:
          color = heighLightColorMap.Logic;
          break;
      }
      return {
        Name: token.Literal,
        Color: color,
      };
    });
  };

  heighLighting = ({
    tokens,
    ast,
  }: {
    tokens: Token[];
    ast?: Expression;
  }) => {
    this.syntaxNodes.length = 0;

    // 优先考虑使用 ast 构建,语法解析出现错误时再使用 token 构建
    if (ast) {
      this.SyntaxHighlightingByAst(ast);
    } else {
      this.SyntaxHighlightingByTokens(tokens);
    }

    const styleExpHtmlStr = this.syntaxNodes.reduce((value, item, index) => {
      return (
        value +
        `<a id='token-${index}' class='style-token' style='color:${item.Color};'>${item.Name}</a>`
      );
    }, '');

    return styleExpHtmlStr;
  };
}

export default Highlighter;
